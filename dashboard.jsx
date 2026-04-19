// Trip card + pipeline components
const { TRIPS: _tripsRef, TODAY: _todayRef } = window.TravelOSData || {};

function TripCard({ trip, onClick, onDragStart, onDragEnd, isDragging }) {
  const { TODAY } = window.TravelOSData;
  const today = TODAY;

  let countdown = null;
  let range = null;
  if (trip.start_date) {
    const days = daysBetween(today, trip.start_date);
    if (days > 0 && days <= 60) countdown = `in ${days}d`;
    else if (days > 60) countdown = `in ${Math.floor(days / 7)}w`;
    else if (days === 0) countdown = 'today';
    else if (days < 0 && daysBetween(today, trip.end_date) >= 0) countdown = 'active';
    range = fmtDateRange(trip.start_date, trip.end_date);
  }

  const budgetPct = trip.budget_total > 0 ? Math.min(100, (trip.budget_spent / trip.budget_total) * 100) : 0;

  return (
    <div
      className={`tcard${isDragging ? ' dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, trip)}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="tcard-cover" style={coverStyle(trip.cover)}>
        <div className="label">{trip.cover?.label}</div>
      </div>
      <div className="tcard-body">
        <div className="tcard-dest">{trip.destination}</div>
        <div className="tcard-region">{trip.region}, {trip.country}</div>

        <div className="tcard-meta">
          {trip.date_approx && !range ? (
            <span className="tcard-approx">{trip.date_approx}</span>
          ) : range ? (
            <span>{range}</span>
          ) : null}
          {countdown && <><span className="sep">·</span><span className="tcard-countdown">{countdown}</span></>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {trip.categories.map(k => (
              <span key={k} className="cat-pip" style={{ background: CAT_MAP[k]?.color }} title={CAT_MAP[k]?.label}/>
            ))}
          </div>
          <Avatars ids={trip.travelers} />
        </div>

        {(trip.stage === 'booked' || trip.stage === 'upcoming') && trip.budget_total > 0 && (
          <div className="tcard-progress" title={`${fmtMoney(trip.budget_spent)} of ${fmtMoney(trip.budget_total)}`}>
            <div className="bar" style={{ width: budgetPct + '%' }}/>
          </div>
        )}
      </div>
    </div>
  );
}

function Pipeline({ trips, onOpen, onMove, categoryFilter }) {
  const [dragTrip, setDragTrip] = useState(null);
  const [dropStage, setDropStage] = useState(null);

  const filtered = categoryFilter.length
    ? trips.filter(t => t.categories.some(c => categoryFilter.includes(c)))
    : trips;

  const byStage = useMemo(() => {
    const m = {};
    STAGES.forEach(s => m[s.key] = []);
    filtered.forEach(t => {
      if (m[t.stage]) m[t.stage].push(t);
    });
    // sort by start date within each column
    Object.keys(m).forEach(k => {
      m[k].sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date.localeCompare(b.start_date);
      });
    });
    return m;
  }, [filtered]);

  const onDragStart = (e, t) => {
    setDragTrip(t);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd = () => {
    setDragTrip(null);
    setDropStage(null);
  };
  const onDragOver = (e, stage) => {
    e.preventDefault();
    if (stage !== dropStage) setDropStage(stage);
  };
  const onDragLeave = (stage) => {
    if (stage === dropStage) setDropStage(null);
  };
  const onDrop = (e, stage) => {
    e.preventDefault();
    if (dragTrip && dragTrip.stage !== stage) {
      onMove(dragTrip.id, stage);
    }
    setDragTrip(null);
    setDropStage(null);
  };

  return (
    <div className="pipeline">
      {STAGES.map(stage => (
        <div
          key={stage.key}
          className={`column${dropStage === stage.key && dragTrip?.stage !== stage.key ? ' drop-target' : ''}`}
          onDragOver={(e) => onDragOver(e, stage.key)}
          onDragLeave={() => onDragLeave(stage.key)}
          onDrop={(e) => onDrop(e, stage.key)}
        >
          <div className="column-head">
            <StageDot stage={stage.key} />
            <span className="name">{stage.label}</span>
            <span className="count">{byStage[stage.key].length}</span>
            <button className="add" title="Add trip in this stage"><Icon.Plus/></button>
          </div>
          {byStage[stage.key].map(t => (
            <TripCard
              key={t.id}
              trip={t}
              onClick={() => onOpen(t.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={dragTrip?.id === t.id}
            />
          ))}
          {byStage[stage.key].length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-4)', padding: '20px 8px', textAlign: 'center', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: 15 }}>
              nothing here yet
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Year ribbon — a timeline of trips across this year
function YearRibbon({ trips, onOpen }) {
  const { TODAY } = window.TravelOSData;
  const year = TODAY.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const total = daysBetween(start, end);
  const todayPct = (daysBetween(start, TODAY) / total) * 100;

  const bars = trips
    .filter(t => t.start_date && t.end_date)
    .filter(t => {
      const s = new Date(t.start_date + 'T00:00:00');
      const e = new Date(t.end_date + 'T00:00:00');
      return e >= start && s <= end;
    })
    .map(t => {
      const s = new Date(t.start_date + 'T00:00:00');
      const e = new Date(t.end_date + 'T00:00:00');
      const left = Math.max(0, (daysBetween(start, s) / total) * 100);
      const width = Math.max(1.2, (daysBetween(s, e) / total) * 100);
      return { t, left, width };
    })
    .sort((a, b) => a.left - b.left);

  // Two rows for overlap avoidance
  const rows = [[], []];
  bars.forEach(b => {
    let placed = false;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const conflict = row.some(x => !(b.left + b.width < x.left || x.left + x.width < b.left));
      if (!conflict) { row.push(b); b.row = r; placed = true; break; }
    }
    if (!placed) { b.row = 0; rows[0].push(b); }
  });

  return (
    <div className="year-ribbon">
      <div className="year-ribbon-head">
        <h3>{year} <em>· year at a glance</em></h3>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{bars.length} trips across 12 months</div>
      </div>
      <div className="ribbon" style={{ ['--today']: todayPct.toFixed(1) }}>
        {bars.map(({ t, left, width, row }) => (
          <div
            key={t.id}
            className="ribbon-trip"
            style={{
              left: left + '%',
              width: width + '%',
              top: row === 0 ? 6 : 20,
              background: `oklch(48% 0.14 ${t.cover?.hue || 30})`,
            }}
            onClick={() => onOpen(t.id)}
            title={`${t.destination} · ${fmtDateRange(t.start_date, t.end_date)}`}
          >
            {t.destination}
          </div>
        ))}
        <div className="ribbon-today" style={{ left: todayPct + '%' }}>
          <div className="ribbon-today-label">Today</div>
        </div>
      </div>
      <div className="ribbon-months">
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

// Metrics row
function Metrics({ trips }) {
  const { TODAY } = window.TravelOSData;
  const upcoming = trips
    .filter(t => t.start_date && daysBetween(TODAY, t.start_date) >= 0)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const next = upcoming[0];
  const nextDays = next ? daysBetween(TODAY, next.start_date) : null;

  const active = trips.filter(t => ['planning', 'booked', 'upcoming'].includes(t.stage)).length;

  const thisYear = TODAY.getFullYear();
  const ytdTrips = trips.filter(t => {
    if (!t.start_date) return false;
    return new Date(t.start_date + 'T00:00:00').getFullYear() === thisYear;
  });
  const ytdSpend = ytdTrips.reduce((s, t) => s + (t.budget_spent || 0), 0);
  const annualBudget = 30000;
  const ytdPct = Math.min(100, (ytdSpend / annualBudget) * 100);

  const totalTrips = trips.filter(t => t.stage !== 'archived').length;

  return (
    <div className="metrics">
      <div className="metric pop">
        <div className="label">Next trip</div>
        {next ? (
          <>
            <div className="value">{nextDays}<span className="suffix">{nextDays === 1 ? 'day' : 'days'}</span></div>
            <div className="hint">{next.destination} · {fmtDate(next.start_date)}</div>
          </>
        ) : (
          <><div className="value"><em>—</em></div><div className="hint">nothing booked</div></>
        )}
      </div>
      <div className="metric">
        <div className="label">Active plans</div>
        <div className="value">{active}</div>
        <div className="hint">across Planning, Booked, Upcoming</div>
      </div>
      <div className="metric">
        <div className="label">{thisYear} spend</div>
        <div className="value">{fmtMoney(ytdSpend)}<span className="suffix">/ {fmtMoney(annualBudget)}</span></div>
        <div className="hint" style={{ marginTop: 8 }}>
          <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: ytdPct + '%', height: '100%', background: 'var(--accent)' }}/>
          </div>
          <div style={{ marginTop: 4 }}>{ytdPct.toFixed(0)}% of annual</div>
        </div>
      </div>
      <div className="metric">
        <div className="label">Trips in motion</div>
        <div className="value">{totalTrips}</div>
        <div className="hint">{trips.filter(t => t.stage === 'dreaming').length} dreaming · {trips.filter(t => t.stage === 'archived').length} archived</div>
      </div>
    </div>
  );
}

Object.assign(window, { TripCard, Pipeline, YearRibbon, Metrics });
