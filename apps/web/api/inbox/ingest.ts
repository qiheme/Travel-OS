import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

interface IngestBody {
  userId: string;
  source?: string;
  raw: { subject: string; from: string; receivedAt: string; text: string };
}

interface ParsedResult {
  vendor: string;
  type: string;
  title: string;
  dates: string;
  cost: number;
  confirmation: string | null;
  suggested_trip: string | null;
  suggested_confidence: number;
}

function isValidBody(b: unknown): b is IngestBody {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o['userId'] === 'string' &&
    !!o['raw'] &&
    typeof (o['raw'] as Record<string, unknown>)['subject'] === 'string' &&
    typeof (o['raw'] as Record<string, unknown>)['text'] === 'string'
  );
}

export function createIngestHandler({
  anthropic,
  supabase,
}: {
  anthropic: Pick<Anthropic, 'messages'>;
  supabase: SupabaseClient;
}) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const secret = req.headers.get('x-ingest-secret');
    if (!secret || secret !== process.env['INGEST_SECRET']) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: IngestBody;
    try {
      const raw = await req.json();
      if (!isValidBody(raw)) {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
      }
      body = raw;
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const id = randomUUID();
    const { error: insertError } = await supabase.from('inbox_items').insert({
      id,
      user_id: body.userId,
      source: body.source ?? 'email',
      subject: body.raw.subject,
      from_address: body.raw.from,
      received_ago: body.raw.receivedAt,
      status: 'parsing',
      parsed: null,
    });
    if (insertError) {
      return Response.json({ error: 'Failed to create inbox item' }, { status: 500 });
    }

    const { data: trips } = await supabase
      .from('trips')
      .select('id,destination,country,start_date,end_date,date_approx,stage')
      .eq('user_id', body.userId)
      .neq('stage', 'archived');

    let parsed: ParsedResult | null = null;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system:
          'You are a travel confirmation email parser. Extract booking details and suggest which trip this belongs to. Return JSON only — no prose, no code fences.',
        messages: [
          {
            role: 'user',
            content: `Email subject: ${body.raw.subject}\nFrom: ${body.raw.from}\nBody:\n${body.raw.text}\n\nActive trips:\n${JSON.stringify(trips ?? [])}\n\nReturn JSON with keys: vendor, type (flight|lodging|transport|activity|dining|other), title, dates, cost (number), confirmation (string|null), suggested_trip (trip id|null), suggested_confidence (0-1).`,
          },
        ],
      });
      const first = message.content[0];
      const text = first?.type === 'text' ? first.text : '';
      parsed = JSON.parse(text) as ParsedResult;
    } catch (err) {
      const note = err instanceof Error ? err.message : 'Parse error';
      await supabase.from('inbox_items').update({ status: 'needs_review', note }).eq('id', id);
      return Response.json({ id }, { status: 200 });
    }

    const confidence = parsed.suggested_confidence ?? 0;
    const status = confidence >= 0.5 ? 'parsed' : 'needs_review';
    await supabase.from('inbox_items').update({
      status,
      vendor: parsed.vendor,
      parsed: {
        type: parsed.type,
        title: parsed.title,
        dates: parsed.dates,
        cost: parsed.cost,
        confirmation: parsed.confirmation,
      },
      suggested_trip: parsed.suggested_trip,
      suggested_confidence: confidence,
    }).eq('id', id);

    return Response.json({ id }, { status: 200 });
  };
}

export default createIngestHandler({
  anthropic: new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] }),
  supabase: createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  ),
});
