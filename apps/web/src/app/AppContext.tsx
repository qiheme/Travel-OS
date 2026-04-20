import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INBOX, INSIGHTS, TRIP_DETAILS, TRIPS } from '../lib/data';
import type { InboxItem, Insight, Trip, TripDetail, TripStage } from '../lib/types';

type AccentKey = 'orange' | 'olive' | 'blue' | 'plum' | 'sand';
type DensityKey = 'compact' | 'normal' | 'roomy';

const ACCENTS: Record<AccentKey, { val: string; soft: string; ink: string }> = {
  orange: { val: 'oklch(62% 0.15 50)',  soft: 'oklch(92% 0.04 60)',  ink: 'oklch(35% 0.1 50)'  },
  olive:  { val: 'oklch(55% 0.1 130)',  soft: 'oklch(92% 0.03 130)', ink: 'oklch(32% 0.08 130)' },
  blue:   { val: 'oklch(55% 0.12 250)', soft: 'oklch(92% 0.04 250)', ink: 'oklch(32% 0.1 250)'  },
  plum:   { val: 'oklch(55% 0.12 330)', soft: 'oklch(92% 0.04 330)', ink: 'oklch(32% 0.1 330)'  },
  sand:   { val: 'oklch(55% 0.05 60)',  soft: 'oklch(92% 0.02 60)',  ink: 'oklch(32% 0.04 60)'  },
};

type AppState = {
  trips: Trip[];
  tripDetails: Record<string, TripDetail>;
  insights: Insight[];
  inbox: InboxItem[];
  search: string;
  categoryFilter: string[];
  theme: 'light' | 'dark';
  accent: AccentKey;
  density: DensityKey;
  showInsights: boolean;
  tweaksOpen: boolean;
  showModal: boolean;
  showIntegrations: boolean;
};

type AppActions = {
  moveStage: (tripId: string, stage: TripStage) => void;
  updateTrip: (tripId: string, patch: Partial<Trip>) => void;
  addTrip: (trip: Trip) => void;
  togglePacked: (tripId: string, idx: number) => void;
  toggleBookingStatus: (tripId: string, idx: number, status: string) => void;
  dismissInsight: (id: string) => void;
  dismissInboxItem: (id: string) => void;
  assignInboxItem: (id: string) => void;
  setSearch: (q: string) => void;
  toggleCategoryFilter: (key: string) => void;
  setTheme: (v: 'light' | 'dark') => void;
  setAccent: (v: AccentKey) => void;
  setDensity: (v: DensityKey) => void;
  setShowInsights: (v: boolean) => void;
  setTweaksOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowModal: (v: boolean) => void;
  setShowIntegrations: (v: boolean) => void;
  searchedTrips: Trip[];
};

const Ctx = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(TRIPS);
  const [tripDetails, setTripDetails] = useState<Record<string, TripDetail>>(TRIP_DETAILS);
  const [insights, setInsights] = useState<Insight[]>(INSIGHTS);
  const [inbox, setInbox] = useState<InboxItem[]>(INBOX);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accent, setAccent] = useState<AccentKey>('orange');
  const [density, setDensity] = useState<DensityKey>('normal');
  const [showInsights, setShowInsights] = useState(true);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => {
    const a = ACCENTS[accent];
    document.documentElement.style.setProperty('--accent', a.val);
    document.documentElement.style.setProperty('--accent-soft', a.soft);
    document.documentElement.style.setProperty('--accent-ink', a.ink);
  }, [accent]);
  useEffect(() => {
    const m: Record<DensityKey, string> = { compact: '0.88', normal: '1', roomy: '1.15' };
    document.documentElement.style.fontSize = `${14 * Number(m[density])}px`;
  }, [density]);

  const searchedTrips = useMemo(() => {
    if (!search) return trips;
    const q = search.toLowerCase();
    return trips.filter(
      (t) =>
        t.destination.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q),
    );
  }, [trips, search]);

  const moveStage = (tripId: string, stage: TripStage) =>
    setTrips((ts) => ts.map((t) => (t.id === tripId ? { ...t, stage } : t)));

  const updateTrip = (tripId: string, patch: Partial<Trip>) =>
    setTrips((ts) => ts.map((t) => (t.id === tripId ? { ...t, ...patch } : t)));

  const addTrip = (trip: Trip) => setTrips((ts) => [...ts, trip]);

  const togglePacked = (tripId: string, idx: number) =>
    setTripDetails((d) => ({
      ...d,
      [tripId]: {
        ...d[tripId],
        packing: d[tripId].packing.map((p, i) => (i === idx ? { ...p, packed: !p.packed } : p)),
      },
    }));

  const toggleBookingStatus = (tripId: string, idx: number, status: string) =>
    setTripDetails((d) => ({
      ...d,
      [tripId]: {
        ...d[tripId],
        bookings: d[tripId].bookings.map((b, i) =>
          i === idx ? { ...b, status: status as import('../lib/types').BookingStatus } : b,
        ),
      },
    }));

  const dismissInsight = (id: string) => setInsights((ii) => ii.filter((i) => i.id !== id));
  const dismissInboxItem = (id: string) => setInbox((ii) => ii.filter((i) => i.id !== id));
  const assignInboxItem = (id: string) => setInbox((ii) => ii.filter((i) => i.id !== id));

  const toggleCategoryFilter = (key: string) =>
    setCategoryFilter((f) => (f.includes(key) ? f.filter((x) => x !== key) : [...f, key]));

  return (
    <Ctx.Provider
      value={{
        trips, tripDetails, insights, inbox, search, categoryFilter,
        theme, accent, density, showInsights, tweaksOpen, showModal, showIntegrations,
        searchedTrips,
        moveStage, updateTrip, addTrip, togglePacked, toggleBookingStatus,
        dismissInsight, dismissInboxItem, assignInboxItem,
        setSearch, toggleCategoryFilter,
        setTheme, setAccent, setDensity, setShowInsights,
        setTweaksOpen, setShowModal, setShowIntegrations,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
