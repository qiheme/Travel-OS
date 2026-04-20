import { CAT_MAP } from '../lib/utils';
import type { TripCategory } from '../lib/types';

export function CategoryPips({ cats }: { cats: TripCategory[] }) {
  return (
    <div className="tcard-cats">
      {cats.map((k) => (
        <span key={k} className="cat-chip" title={CAT_MAP[k]?.label}>
          <span className="cat-pip" style={{ background: CAT_MAP[k]?.color }} />
          {CAT_MAP[k]?.label}
        </span>
      ))}
    </div>
  );
}
