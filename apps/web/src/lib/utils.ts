import type { TripCategory, TripStage, BookingCategory } from './types';

export const STAGES: { key: TripStage; label: string }[] = [
  { key: 'dreaming', label: 'Dreaming' },
  { key: 'planning', label: 'Planning' },
  { key: 'booked', label: 'Booked' },
  { key: 'upcoming', label: 'Upcoming' },
];

export const CATEGORIES: { key: TripCategory; label: string; color: string }[] = [
  { key: 'family',  label: 'Family',  color: 'var(--cat-family)'  },
  { key: 'couple',  label: 'Couple',  color: 'var(--cat-couple)'  },
  { key: 'solo',    label: 'Solo',    color: 'var(--cat-solo)'    },
  { key: 'race',    label: 'Race',    color: 'var(--cat-race)'    },
  { key: 'friends', label: 'Friends', color: 'var(--cat-friends)' },
  { key: 'work',    label: 'Work',    color: 'var(--cat-work)'    },
];

export const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  TripCategory, { key: TripCategory; label: string; color: string }
>;

export const BOOKING_CATEGORY_ICONS: Record<BookingCategory, string> = {
  flight: 'Plane', lodging: 'Bed', transport: 'Car',
  dining: 'Cutlery', activity: 'Ticket', other: 'MoreH',
};

export function fmtDate(d: string | null, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string | null {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', opts);
}

export function fmtDateRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const sameMonth = s.getMonth() === e.getMonth();
  const sameYear = s.getFullYear() === e.getFullYear();
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const sStr = s.toLocaleDateString('en-US', opts);
  const eStr = sameMonth ? String(e.getDate()) : e.toLocaleDateString('en-US', opts);
  const yr = sameYear ? s.getFullYear() : `${s.getFullYear()}–${e.getFullYear()}`;
  return `${sStr} – ${eStr}, ${yr}`;
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const f = from instanceof Date ? from : new Date(from + 'T00:00:00');
  const t = to instanceof Date ? to : new Date(to + 'T00:00:00');
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

export function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function coverStyle(cover: { hue: number; label: string }): React.CSSProperties {
  const h = cover?.hue ?? 30;
  return {
    background: `linear-gradient(135deg,
      oklch(52% 0.14 ${h}) 0%,
      oklch(42% 0.12 ${h + 25}) 50%,
      oklch(32% 0.08 ${h - 20}) 100%)`,
  };
}
