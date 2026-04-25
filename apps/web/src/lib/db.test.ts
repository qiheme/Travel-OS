import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trip, TripDetail, Insight, InboxItem, Traveler } from './types';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from './supabase';
import {
  getSession,
  signInWithMagicLink,
  signOut,
  subscribeAuthChange,
  hasSeededData,
  fetchTrips,
  fetchTripDetails,
  fetchInsights,
  fetchInboxItems,
  fetchTravelers,
  upsertTrip,
  upsertTripDetail,
  deleteInsight,
  deleteInboxItem,
  seedFromFixtures,
} from './db';

function makeChain(result: { data: unknown; error: unknown; count?: number }) {
  const c = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    then: (cb: (v: { data: unknown; error: unknown; count?: number }) => void) =>
      Promise.resolve(cb(result)),
  };
  c.select.mockReturnValue(c);
  c.eq.mockReturnValue(c);
  c.order.mockReturnValue(c);
  c.upsert.mockReturnValue(c);
  c.delete.mockReturnValue(c);
  return c;
}

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockAuth = supabase.auth as unknown as {
  getSession: ReturnType<typeof vi.fn>;
  signInWithOtp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
};

beforeEach(() => vi.clearAllMocks());

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('getSession', () => {
  it('returns session when one exists', async () => {
    const session = { user: { id: 'u1' } };
    mockAuth.getSession.mockResolvedValue({ data: { session } });
    expect(await getSession()).toBe(session);
  });

  it('returns null when no session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    expect(await getSession()).toBeNull();
  });
});

describe('signInWithMagicLink', () => {
  it('returns error: null on success', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ error: null });
    expect(await signInWithMagicLink('a@b.com')).toEqual({ error: null });
  });

  it('returns error on failure', async () => {
    const err = new Error('rate limited');
    mockAuth.signInWithOtp.mockResolvedValue({ error: err });
    expect(await signInWithMagicLink('a@b.com')).toEqual({ error: err });
  });
});

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    mockAuth.signOut.mockResolvedValue({});
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledOnce();
  });
});

describe('subscribeAuthChange', () => {
  it('registers a listener and returns unsubscribe', () => {
    const unsubscribeFn = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeFn } },
    });
    const callback = vi.fn();
    const sub = subscribeAuthChange(callback);
    expect(mockAuth.onAuthStateChange).toHaveBeenCalledOnce();
    sub.unsubscribe();
    expect(unsubscribeFn).toHaveBeenCalledOnce();
  });
});

// ── Seed detection ────────────────────────────────────────────────────────────

describe('hasSeededData', () => {
  it('returns true when trips exist', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: 3 }));
    expect(await hasSeededData('u1')).toBe(true);
  });

  it('returns false when no trips', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: 0 }));
    expect(await hasSeededData('u1')).toBe(false);
  });

  it('returns false when count is null (nullish coalescing fallback)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: undefined }));
    expect(await hasSeededData('u1')).toBe(false);
  });
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

describe('fetchTrips', () => {
  it('maps cover_hue/cover_label back to cover object', async () => {
    const row = {
      id: 'tr-1', destination: 'Rome', region: 'Lazio', country: 'Italy',
      stage: 'dreaming', categories: ['couple'], start_date: null, end_date: null,
      date_approx: null, budget_total: 5000, budget_spent: 0, budget_currency: 'USD',
      travelers: ['t1'], cover_hue: 30, cover_label: 'terra', notes: '', nights: 7,
      created_days_ago: 10, days_in_stage: 10,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const trips = await fetchTrips('u1');
    expect(trips[0].cover).toEqual({ hue: 30, label: 'terra' });
    expect(trips[0].destination).toBe('Rome');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchTrips('u1')).toEqual([]);
  });
});

describe('fetchTripDetails', () => {
  it('returns a Record keyed by trip_id', async () => {
    const row = {
      trip_id: 'tr-1', itinerary: [], bookings: [],
      budget_breakdown: [], packing: [], documents: [],
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const details = await fetchTripDetails('u1');
    expect(details['tr-1']).toBeDefined();
    expect(details['tr-1'].bookings).toEqual([]);
  });

  it('returns empty object on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchTripDetails('u1')).toEqual({});
  });
});

describe('fetchInsights', () => {
  it('returns insights array', async () => {
    const row: Insight = {
      id: 'i1', trip_id: 'tr-1', type: 'weather',
      severity: 'info', title: 'Rain likely', body: 'Pack a jacket',
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const insights = await fetchInsights('u1');
    expect(insights[0].id).toBe('i1');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchInsights('u1')).toEqual([]);
  });
});

describe('fetchInboxItems', () => {
  it('maps from_address to from field', async () => {
    const row = {
      id: 'ib1', source: 'email', vendor: 'AA', subject: 'Your flight',
      from_address: 'aa@aa.com', received_ago: '2h ago', status: 'parsed',
      parsed: null, suggested_trip: null, suggested_confidence: null, note: null,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const items = await fetchInboxItems('u1');
    expect(items[0].from).toBe('aa@aa.com');
    expect(items[0].id).toBe('ib1');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchInboxItems('u1')).toEqual([]);
  });
});

describe('fetchTravelers', () => {
  it('returns travelers array', async () => {
    const row: Traveler = { id: 't1', name: 'Quincy', relationship: 'self', initials: 'Q' };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const travelers = await fetchTravelers('u1');
    expect(travelers[0].name).toBe('Quincy');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchTravelers('u1')).toEqual([]);
  });
});

// ── Mutations ─────────────────────────────────────────────────────────────────

describe('upsertTrip', () => {
  it('flattens cover into cover_hue and cover_label', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const trip = {
      id: 'tr-1', destination: 'Rome', region: '', country: 'Italy',
      stage: 'dreaming' as const, categories: [] as import('./types').TripCategory[], start_date: null,
      end_date: null, date_approx: null, budget_total: 0, budget_spent: 0,
      budget_currency: 'USD', travelers: [], cover: { hue: 42, label: 'terracotta' },
      notes: '', nights: 0,
    };
    await upsertTrip('u1', trip);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ cover_hue: 42, cover_label: 'terracotta' }),
      expect.any(Object),
    );
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    const trip: Trip = {
      id: 'tr-1', destination: 'X', region: '', country: '', stage: 'dreaming',
      categories: [], start_date: null, end_date: null, date_approx: null,
      budget_total: 0, budget_spent: 0, budget_currency: 'USD', travelers: [],
      cover: { hue: 0, label: '' }, notes: '', nights: 0,
    };
    await expect(upsertTrip('u1', trip)).resolves.toBeUndefined();
  });
});

describe('upsertTripDetail', () => {
  it('calls upsert with jsonb fields', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const detail: TripDetail = { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [] };
    await upsertTripDetail('u1', 'tr-1', detail);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ trip_id: 'tr-1', user_id: 'u1' }),
      expect.any(Object),
    );
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    const detail: TripDetail = { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [] };
    await expect(upsertTripDetail('u1', 'tr-1', detail)).resolves.toBeUndefined();
  });
});

describe('deleteInsight', () => {
  it('calls delete with matching id and user_id', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await deleteInsight('u1', 'i1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'i1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    await expect(deleteInsight('u1', 'i1')).resolves.toBeUndefined();
  });
});

describe('deleteInboxItem', () => {
  it('calls delete with matching id and user_id', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await deleteInboxItem('u1', 'ib1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'ib1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    await expect(deleteInboxItem('u1', 'ib1')).resolves.toBeUndefined();
  });
});

// ── Seed ──────────────────────────────────────────────────────────────────────

describe('seedFromFixtures', () => {
  const sampleTrip: Trip = {
    id: 'tr-1', destination: 'Rome', region: 'Lazio', country: 'Italy',
    stage: 'dreaming', categories: ['couple'], start_date: null, end_date: null,
    date_approx: null, budget_total: 5000, budget_spent: 0, budget_currency: 'USD',
    travelers: ['t1'], cover: { hue: 30, label: 'terra' }, notes: '', nights: 7,
  };
  const sampleDetail: TripDetail = {
    itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [],
  };
  const sampleInsight: Insight = {
    id: 'i1', trip_id: 'tr-1', type: 'weather', severity: 'info', title: 'Rain', body: 'Pack coat',
  };
  const sampleInboxItem: InboxItem = {
    id: 'ib1', source: 'email', vendor: 'AA', subject: 'Flight', from: 'aa@aa.com',
    received_ago: '1h', status: 'parsed', parsed: null,
    suggested_trip: 'tr-1', suggested_confidence: 0.9, note: 'auto-parsed',
  };
  const sampleTraveler: Traveler = { id: 't1', name: 'Quincy', relationship: 'self', initials: 'Q' };

  const seedData = {
    trips: [sampleTrip],
    tripDetails: { 'tr-1': sampleDetail },
    insights: [sampleInsight],
    inbox: [sampleInboxItem],
    travelers: [sampleTraveler],
  };

  it('upserts all tables when no seed data exists', async () => {
    // hasSeededData returns false (count=0), then upserts succeed
    const chain = makeChain({ data: null, error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    await seedFromFixtures('u1', seedData);
    // from() called multiple times: once for hasSeededData check + once per table
    expect(mockFrom).toHaveBeenCalled();
    expect(chain.upsert).toHaveBeenCalled();
  });

  it('skips upserts when data already seeded', async () => {
    // hasSeededData returns true (count=3)
    const chain = makeChain({ data: null, error: null, count: 3 });
    mockFrom.mockReturnValue(chain);
    await seedFromFixtures('u1', seedData);
    // from() only called once (the hasSeededData check) — no upserts
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});
