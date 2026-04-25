import { supabase } from './supabase';
import type { Trip, TripDetail, TripSplit, Insight, InboxItem, Traveler } from './types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  return { error: error as Error | null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

type AuthSession = Awaited<ReturnType<typeof getSession>>;

export function subscribeAuthChange(
  callback: (session: AuthSession) => void,
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session),
  );
  return { unsubscribe: () => subscription.unsubscribe() };
}

// ── Seed detection ────────────────────────────────────────────────────────────

export async function hasSeededData(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return (count ?? 0) > 0;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    destination: row.destination as string,
    region: row.region as string,
    country: row.country as string,
    stage: row.stage as Trip['stage'],
    categories: row.categories as Trip['categories'],
    start_date: row.start_date as string | null,
    end_date: row.end_date as string | null,
    date_approx: row.date_approx as string | null,
    budget_total: row.budget_total as number,
    budget_spent: row.budget_spent as number,
    budget_currency: row.budget_currency as string,
    travelers: row.travelers as string[],
    cover: { hue: row.cover_hue as number, label: row.cover_label as string },
    notes: row.notes as string,
    nights: row.nights as number,
    created_days_ago: row.created_days_ago as number | undefined,
    daysInStage: row.days_in_stage as number | undefined,
  }));
}

export async function fetchTripDetails(userId: string): Promise<Record<string, TripDetail>> {
  const { data, error } = await supabase
    .from('trip_details')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return {};
  return Object.fromEntries(
    data.map((row) => [
      row.trip_id as string,
      {
        itinerary: row.itinerary as TripDetail['itinerary'],
        bookings: row.bookings as TripDetail['bookings'],
        budget_breakdown: row.budget_breakdown as TripDetail['budget_breakdown'],
        packing: row.packing as TripDetail['packing'],
        documents: row.documents as TripDetail['documents'],
        splits: (row.splits as TripSplit[] | null) ?? undefined,
      },
    ]),
  );
}

export async function fetchInsights(userId: string): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data as Insight[];
}

export async function fetchInboxItems(userId: string): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    source: row.source as InboxItem['source'],
    vendor: row.vendor as string,
    subject: row.subject as string,
    from: row.from_address as string,
    received_ago: row.received_ago as string,
    status: row.status as InboxItem['status'],
    parsed: row.parsed as InboxItem['parsed'],
    suggested_trip: row.suggested_trip as string | undefined,
    suggested_confidence: row.suggested_confidence as number | undefined,
    note: row.note as string | undefined,
  }));
}

export async function fetchTravelers(userId: string): Promise<Traveler[]> {
  const { data, error } = await supabase
    .from('travelers')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data as Traveler[];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function upsertTrip(userId: string, trip: Trip): Promise<void> {
  const { error } = await supabase.from('trips').upsert(
    {
      id: trip.id, user_id: userId,
      destination: trip.destination, region: trip.region, country: trip.country,
      stage: trip.stage, categories: trip.categories,
      start_date: trip.start_date, end_date: trip.end_date, date_approx: trip.date_approx,
      budget_total: trip.budget_total, budget_spent: trip.budget_spent,
      budget_currency: trip.budget_currency, travelers: trip.travelers,
      cover_hue: trip.cover.hue, cover_label: trip.cover.label,
      notes: trip.notes, nights: trip.nights,
    },
    { onConflict: 'id,user_id' },
  );
  if (error) console.warn('[db] upsertTrip:', error.message);
}

export async function upsertTripDetail(
  userId: string,
  tripId: string,
  detail: TripDetail,
): Promise<void> {
  const { error } = await supabase.from('trip_details').upsert(
    {
      trip_id: tripId, user_id: userId,
      itinerary: detail.itinerary, bookings: detail.bookings,
      budget_breakdown: detail.budget_breakdown, packing: detail.packing,
      documents: detail.documents, splits: detail.splits,
    },
    { onConflict: 'trip_id,user_id' },
  );
  if (error) console.warn('[db] upsertTripDetail:', error.message);
}

export async function deleteInsight(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('insights')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('[db] deleteInsight:', error.message);
}

export async function deleteInboxItem(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('inbox_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('[db] deleteInboxItem:', error.message);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

export async function seedFromFixtures(
  userId: string,
  data: {
    trips: Trip[];
    tripDetails: Record<string, TripDetail>;
    insights: Insight[];
    inbox: InboxItem[];
    travelers: Traveler[];
  },
): Promise<void> {
  if (await hasSeededData(userId)) return;

  await Promise.all([
    supabase.from('travelers').upsert(
      data.travelers.map((t) => ({ ...t, user_id: userId })),
      { onConflict: 'id,user_id' },
    ),
    supabase.from('trips').upsert(
      data.trips.map((t) => ({
        id: t.id, user_id: userId,
        destination: t.destination, region: t.region, country: t.country,
        stage: t.stage, categories: t.categories,
        start_date: t.start_date, end_date: t.end_date, date_approx: t.date_approx,
        budget_total: t.budget_total, budget_spent: t.budget_spent,
        budget_currency: t.budget_currency, travelers: t.travelers,
        cover_hue: t.cover.hue, cover_label: t.cover.label,
        notes: t.notes, nights: t.nights,
      })),
      { onConflict: 'id,user_id' },
    ),
    supabase.from('trip_details').upsert(
      Object.entries(data.tripDetails).map(([tripId, detail]) => ({
        trip_id: tripId, user_id: userId,
        itinerary: detail.itinerary, bookings: detail.bookings,
        budget_breakdown: detail.budget_breakdown, packing: detail.packing,
        documents: detail.documents, splits: detail.splits,
      })),
      { onConflict: 'trip_id,user_id' },
    ),
    supabase.from('insights').upsert(
      data.insights.map((i) => ({ ...i, user_id: userId })),
      { onConflict: 'id,user_id' },
    ),
    supabase.from('inbox_items').upsert(
      data.inbox.map((item) => ({
        id: item.id, user_id: userId,
        source: item.source, vendor: item.vendor, subject: item.subject,
        from_address: item.from, received_ago: item.received_ago, status: item.status,
        parsed: item.parsed, suggested_trip: item.suggested_trip,
        suggested_confidence: item.suggested_confidence, note: item.note,
      })),
      { onConflict: 'id,user_id' },
    ),
  ]);
}

