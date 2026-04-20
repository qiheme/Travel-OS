import { TRAVELERS } from '../lib/data';

export function Avatars({ ids, max = 4 }: { ids: string[]; max?: number }) {
  const items = ids.map((id) => TRAVELERS.find((t) => t.id === id)).filter(Boolean) as typeof TRAVELERS;
  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;
  return (
    <div className="tcard-avatars">
      {shown.map((p) => (
        <div key={p.id} className="av" title={p.name}>{p.initials}</div>
      ))}
      {hidden > 0 && <div className="av" style={{ background: 'var(--ink-3)' }}>+{hidden}</div>}
    </div>
  );
}
