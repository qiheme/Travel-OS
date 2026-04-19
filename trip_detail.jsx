// Trip detail view with tabs
function TripDetail({ tripId, onBack, onUpdateTrip, onTogglePacked, onToggleBookingStatus }) {
  const { TRIPS, TRIP_DETAILS, TODAY, TRAVELERS } = window.TravelOSData;
  const trip = TRIPS.find(t => t.id === tripId);
  const detail = TRIP_DETAILS[tripId] || {
    itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: []
  };

  const [tab, setTab] = useState(() => localStorage.getItem('travelos:tab:' + tripId) || 'overview');
  useEffect(() => { localStorage.setItem('travelos:tab:' + tripId, tab); }, [tab, tripId]);

  if (!trip) return <div style={{ padding: 40 }}>Trip not found.</div>;

  const countdown = trip.start_date ? daysBetween(TODAY, trip.start_date) : null;
  const nights = trip.nights || (trip.start_date && trip.end_date ? daysBetween(trip.start_date, trip.end_date) : null);

  const travelers = trip.travelers.map(id => TRAVELERS.find(t => t.id === id)).filter(Boolean);

  // Distance stub (varies by country)
  const distances = {
    'Japan': '6,820 mi · ~14h flight',
    'Chile': '5,080 mi · ~11h flight',
    'Portugal': '3,380 mi · ~7h flight',
    'Morocco': '3,660 mi · ~8h flight',
    'Iceland': '2,590 mi · ~5.5h flight',
    'Germany': '3,980 mi · ~8h flight',
    'Mexico': '2,400 mi · ~6h flight',
    'USA': '90 mi · 2h drive',
    'Italy': '4,290 mi · ~9h flight',
    'Canada': '2,280 mi · ~5h flight',
  };

  const statusLabels = {
    dreaming: 'Capturing',
    planning: 'In progress',
    booked: 'On track',
    upcoming: 'Prep mode',
    active: 'Live',
    archived: 'Archived',
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'itinerary', label: 'Itinerary', num: detail.itinerary?.length },
    { key: 'bookings', label: 'Bookings', num: detail.bookings?.length },
    { key: 'budget', label: 'Budget' },
    { key: 'packing', label: 'Packing', num: detail.packing ? `${detail.packing.filter(p => p.packed).length}/${detail.packing.length}` : null },
    { key: 'documents', label: 'Documents', num: detail.documents?.length },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="trip-detail">
      <div className="trip-hero">
        <div className="trip-hero-bg" style={coverStyle(trip.cover)}/>
        <div className="trip-hero-content">
          <button className="back" onClick={onBack}>
            <Icon.ChevronLeft/> All trips
          </button>
          <div className="trip-hero-row">
            <div>
              <h1>{trip.destination}</h1>
              <div className="sub">
                <span style={{ opacity: 0.9 }}>{trip.region}, {trip.country}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{trip.date_approx || fmtDateRange(trip.start_date, trip.end_date)}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}>
                  {trip.stage}
                </span>
              </div>
            </div>
            {countdown !== null && countdown >= 0 && countdown <= 365 && (
              <div className="countdown">
                <div className="n">{countdown}</div>
                <div className="u">{countdown === 1 ? 'day to go' : 'days to go'}</div>
              </div>
            )}
            {trip.stage === 'dreaming' && (
              <div className="countdown">
                <div className="n" style={{ fontSize: 38 }}>someday</div>
                <div className="u">{trip.date_approx}</div>
              </div>
            )}
            {trip.stage === 'archived' && (
              <div className="countdown">
                <div className="n" style={{ fontSize: 38 }}>completed</div>
                <div className="u">{fmtDate(trip.end_date, { month: 'short', year: 'numeric' })}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="trip-stats">
        <div className="trip-stat">
          <div className="l">Distance</div>
          <div className="v">{distances[trip.country] || '—'}</div>
        </div>
        <div className="trip-stat">
          <div className="l">Budget</div>
          <div className="v">
            {fmtMoney(trip.budget_spent)} <em>/ {fmtMoney(trip.budget_total)}</em>
          </div>
          <div className="progressbar"><div className="f" style={{ width: Math.min(100, (trip.budget_spent / trip.budget_total) * 100) + '%' }}/></div>
        </div>
        <div className="trip-stat">
          <div className="l">Travelers</div>
          <div className="v">{travelers.length} <em>· {travelers.map(t => t.name.split(' ')[0]).join(', ')}</em></div>
        </div>
        <div className="trip-stat status">
          <div className="l">Status</div>
          <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StageDot stage={trip.stage}/>
            {statusLabels[trip.stage]}
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.num != null && <span className="num">{t.num}</span>}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'overview' && <OverviewTab trip={trip} detail={detail} setTab={setTab}/>}
        {tab === 'itinerary' && <ItineraryTab itinerary={detail.itinerary}/>}
        {tab === 'bookings' && <BookingsTab bookings={detail.bookings} tripId={tripId} onToggle={onToggleBookingStatus}/>}
        {tab === 'budget' && <BudgetTab trip={trip} breakdown={detail.budget_breakdown}/>}
        {tab === 'packing' && <PackingTab items={detail.packing} tripId={tripId} onToggle={onTogglePacked}/>}
        {tab === 'documents' && <DocumentsTab docs={detail.documents}/>}
        {tab === 'notes' && <NotesTab trip={trip} onUpdate={onUpdateTrip}/>}
      </div>
    </div>
  );
}

// OVERVIEW — scannable summary
function OverviewTab({ trip, detail, setTab }) {
  const doneBookings = (detail.bookings || []).filter(b => b.status === 'done').length;
  const totalBookings = (detail.bookings || []).length;
  const packedCount = (detail.packing || []).filter(p => p.packed).length;
  const packingTotal = (detail.packing || []).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 28, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>About this trip</em>
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 580 }}>
          {trip.notes}
        </p>

        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: '32px 0 14px', letterSpacing: '-0.01em' }}>
          <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>What's next</em>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NextUpRow
            label="Complete bookings"
            progress={`${doneBookings} of ${totalBookings} done`}
            pct={totalBookings ? (doneBookings / totalBookings) * 100 : 0}
            onClick={() => setTab('bookings')}
          />
          <NextUpRow
            label="Pack your bags"
            progress={`${packedCount} of ${packingTotal} packed`}
            pct={packingTotal ? (packedCount / packingTotal) * 100 : 0}
            onClick={() => setTab('packing')}
          />
          <NextUpRow
            label="Build out itinerary"
            progress={`${(detail.itinerary || []).filter(d => d.activities?.length).length} of ${(detail.itinerary || []).length} days planned`}
            pct={(detail.itinerary || []).length ? ((detail.itinerary || []).filter(d => d.activities?.length).length / (detail.itinerary || []).length) * 100 : 0}
            onClick={() => setTab('itinerary')}
          />
        </div>
      </div>

      <aside>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--divider)',
          borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600 }}>
            Categories
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {trip.categories.map(k => (
              <span key={k} className="cat-chip" style={{ padding: '4px 10px', fontSize: 12 }}>
                <span className="cat-pip" style={{ background: CAT_MAP[k]?.color }}/>
                {CAT_MAP[k]?.label}
              </span>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--divider)', marginTop: 16, paddingTop: 14 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 8 }}>
              Quick actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn ghost" style={{ justifyContent: 'flex-start' }}><Icon.Plus/> Add booking</button>
              <button className="btn ghost" style={{ justifyContent: 'flex-start' }}><Icon.Calendar/> Export to calendar</button>
              <button className="btn ghost" style={{ justifyContent: 'flex-start' }}><Icon.Sparkle/> Duplicate trip</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function NextUpRow({ label, progress, pct, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
      padding: '12px 14px', border: '1px solid var(--divider)', borderRadius: 10,
      background: 'var(--surface)', textAlign: 'left', cursor: 'pointer',
      transition: 'background 120ms'
    }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
       onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{progress}</div>
      </div>
      <div style={{ width: 80, height: 4, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)' }}/>
      </div>
      <Icon.ChevronRight/>
    </button>
  );
}

// ITINERARY tab
function ItineraryTab({ itinerary }) {
  if (!itinerary || !itinerary.length) {
    return <EmptyState title="No itinerary yet" body="Sketch a day-by-day skeleton — titles only is fine." cta="Add a day"/>;
  }
  return (
    <div>
      {itinerary.map((day, i) => (
        <div key={day.day} className="day">
          <div className="day-col-left">
            <div className="day-num">Day {day.day}</div>
            <div className="day-date">{fmtDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
          <div>
            {day.summary && <div className="day-summary">{day.summary}</div>}
            {day.activities?.length > 0 ? (
              day.activities.map((a, j) => (
                <div key={j} className="activity">
                  <div className="a-time">{a.time || '—'}</div>
                  <div style={{ flex: 1 }}>
                    <div className="a-title">{a.title}</div>
                    {(a.location || a.duration) && (
                      <div className="a-meta">
                        {a.location}
                        {a.location && a.duration ? ' · ' : ''}
                        {a.duration ? `${Math.round(a.duration / 60 * 10)/10}h` : ''}
                      </div>
                    )}
                  </div>
                  {a.cost > 0 && <div className="a-cost">{fmtMoney(a.cost)}</div>}
                </div>
              ))
            ) : (
              <div className="activity-empty">Open — nothing planned yet</div>
            )}
            <button className="activity-add">+ Add activity</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// BOOKINGS
function BookingsTab({ bookings, tripId, onToggle }) {
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  if (!bookings || !bookings.length) {
    return <EmptyState title="No bookings yet" body="Track flights, hotels, and reservations as you book them." cta="Add booking"/>;
  }

  const filtered = bookings.filter(b =>
    (filter === 'all' || b.status === filter) &&
    (catFilter === 'all' || b.category === catFilter)
  );

  const counts = { all: bookings.length };
  ['flight','lodging','transport','activity','dining','other'].forEach(c => {
    counts[c] = bookings.filter(b => b.category === c).length;
  });

  const totalCost = bookings.reduce((s, b) => s + (b.cost || 0), 0);
  const doneCost = bookings.filter(b => b.status === 'done').reduce((s, b) => s + (b.cost || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="booking-categories">
            <button className={`chip${catFilter === 'all' ? ' on' : ''}`} onClick={() => setCatFilter('all')}>All <span style={{ marginLeft: 4, opacity: 0.6 }}>{counts.all}</span></button>
            {Object.keys(BOOKING_ICONS).filter(c => counts[c] > 0).map(c => {
              const I = BOOKING_ICONS[c];
              return (
                <button key={c} className={`chip${catFilter === c ? ' on' : ''}`} onClick={() => setCatFilter(c)}>
                  <I/> {c.charAt(0).toUpperCase() + c.slice(1)} <span style={{ marginLeft: 2, opacity: 0.6 }}>{counts[c]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {fmtMoney(doneCost)} paid · {fmtMoney(totalCost - doneCost)} pending
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['all','All'],['todo','To do'],['pending','Pending'],['done','Done']].map(([k,l]) => (
          <button key={k} className={`chip${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div className="booking-table">
        {tripId === 'tr-lisbon' && filter === 'all' && catFilter === 'all' && (
          <div className="booking-row parsing-row">
            <div className="parse-dot"/>
            <div>
              <div className="booking-title">
                <span style={{ color: 'var(--ink-3)' }}><Icon.Plane/></span>
                <span style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>Parsing United confirmation…</span>
              </div>
              <div className="booking-sub">from Gmail · 2 minutes ago</div>
            </div>
            <div className="booking-vendor"><SourceChip source="gmail"/></div>
            <div className="booking-conf" style={{ color: 'var(--ink-4)' }}>pending</div>
            <div className="booking-cost" style={{ color: 'var(--ink-4)' }}>—</div>
            <div/>
          </div>
        )}
        {filtered.map((b, i) => {
          const Ico = BOOKING_ICONS[b.category] || Icon.MoreH;
          const nextStatus = b.status === 'todo' ? 'pending' : b.status === 'pending' ? 'done' : 'todo';
          return (
            <div key={i} className="booking-row">
              <button
                className={`booking-status ${b.status}`}
                onClick={() => onToggle(tripId, i, nextStatus)}
                title={`Mark as ${nextStatus}`}
              >
                {b.status === 'done' && <Icon.Check/>}
                {b.status === 'pending' && <Icon.Clock style={{ width: 10, height: 10 }}/>}
              </button>
              <div>
                <div className="booking-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--ink-3)' }}><Ico/></span>
                  {b.title}
                </div>
                {b.notes && <div className="booking-sub">{b.notes}</div>}
                {b.travel_date && !b.notes && <div className="booking-sub">{fmtDate(b.travel_date, { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
              </div>
              <div className="booking-vendor">
                {b.vendor}
                {b.source && <div style={{ marginTop: 2 }}><SourceChip source={b.source}/></div>}
              </div>
              <div className="booking-conf">{b.confirmation || '—'}</div>
              <div className="booking-cost">{b.cost > 0 ? fmtMoney(b.cost) : '—'}</div>
              <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon.MoreH/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// BUDGET
function BudgetTab({ trip, breakdown }) {
  const pct = Math.min(100, (trip.budget_spent / trip.budget_total) * 100);
  const perPerson = Math.round(trip.budget_total / trip.travelers.length);

  const rad = 78, cx = 90, cy = 90;
  const circ = 2 * Math.PI * rad;
  const offset = circ - (pct / 100) * circ;

  return (
    <div>
      <div className="budget-top">
        <div className="budget-big">
          <div className="l">Budget</div>
          <div className="big">{fmtMoney(trip.budget_spent)}</div>
          <div className="small">of {fmtMoney(trip.budget_total)} · {fmtMoney(perPerson)} per person</div>
          <div className="donut">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx={cx} cy={cy} r={rad} fill="none" stroke="var(--bg-sunken)" strokeWidth="14"/>
              <circle cx={cx} cy={cy} r={rad} fill="none"
                stroke="var(--accent)" strokeWidth="14"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
              <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Instrument Serif" fontSize="32" fill="var(--ink)">
                {pct.toFixed(0)}%
              </text>
              <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="var(--ink-3)" letterSpacing="1.5" style={{ textTransform: 'uppercase' }}>
                SPENT
              </text>
            </svg>
          </div>
        </div>

        <div className="budget-breakdown">
          <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.01em' }}>
            <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>Breakdown</em>
          </h3>
          {breakdown && breakdown.length ? breakdown.map((row, i) => {
            const rowPct = (row.spent / row.total) * 100;
            return (
              <div key={i} className="budget-row">
                <div className="cat">{row.category}</div>
                <div className="bar-wrap">
                  <div className="bar" style={{ width: Math.min(100, rowPct) + '%', background: rowPct > 100 ? 'oklch(60% 0.18 25)' : 'var(--accent)' }}/>
                </div>
                <div className="fig">{fmtMoney(row.spent)} <span style={{ color: 'var(--ink-4)' }}>/ {fmtMoney(row.total)}</span></div>
              </div>
            );
          }) : <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>No categories yet.</div>}
        </div>
      </div>
    </div>
  );
}

// PACKING
function PackingTab({ items, tripId, onToggle }) {
  if (!items || !items.length) {
    return <EmptyState title="No packing list yet" body="Pick a template or start adding items." cta="Add from template"/>;
  }

  const grouped = {};
  items.forEach((it, idx) => {
    if (!grouped[it.category]) grouped[it.category] = [];
    grouped[it.category].push({ ...it, idx });
  });

  const catOrder = ['clothing', 'documents', 'electronics', 'toiletries', 'other'];
  const catLabels = {
    clothing: 'Clothing',
    documents: 'Documents',
    electronics: 'Electronics',
    toiletries: 'Toiletries',
    other: 'Other',
  };

  const packed = items.filter(i => i.packed).length;
  const total = items.length;

  return (
    <div>
      <div className="packing-head">
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 26, letterSpacing: '-0.01em' }}>
            {packed} <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>of {total} packed</em>
          </h3>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Check items off as you pack</div>
        </div>
        <div style={{ width: 180 }}>
          <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: (packed / total * 100) + '%', height: '100%', background: 'var(--accent)' }}/>
          </div>
        </div>
      </div>

      <div className="packing-categories">
        {catOrder.filter(c => grouped[c]).map(c => (
          <div key={c} className="packing-cat">
            <h4>{catLabels[c]}</h4>
            {grouped[c].map(it => (
              <div
                key={it.idx}
                className={`packing-item${it.packed ? ' done' : ''}`}
                onClick={() => onToggle(tripId, it.idx)}
              >
                <span className="box">{it.packed && <Icon.Check style={{ width: 11, height: 11 }}/>}</span>
                <span className="name">{it.item}</span>
                {it.qty > 1 && <span className="qty">×{it.qty}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// DOCUMENTS
function DocumentsTab({ docs }) {
  const { TODAY } = window.TravelOSData;
  if (!docs || !docs.length) return <EmptyState title="No documents yet" body="Upload passports, tickets, and confirmations."/>;
  return (
    <div className="docs-grid">
      {docs.map((d, i) => {
        let expiry = null;
        let warn = false;
        if (d.expiry) {
          const months = daysBetween(TODAY, d.expiry) / 30;
          expiry = fmtDate(d.expiry, { month: 'short', year: 'numeric' });
          if (months < 6) warn = true;
        }
        return (
          <div key={i} className="doc">
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.type}</div>
            <div className="t">{d.title}</div>
            {expiry && (
              <div className={`s${warn ? ' warn' : ''}`} style={{ fontStyle: warn ? 'italic' : 'normal' }}>
                {warn ? '⚠ ' : ''}Expires {expiry}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// NOTES
function NotesTab({ trip, onUpdate }) {
  const [text, setText] = useState(trip.notes || '');
  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => onUpdate(trip.id, { notes: text })}
        placeholder="Thoughts, ideas, links, research notes…"
        style={{
          width: '100%', minHeight: 300,
          padding: 20,
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          resize: 'vertical',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          lineHeight: 1.65,
          outline: 'none',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--ink)',
        }}
      />
    </div>
  );
}

function EmptyState({ title, body, cta }) {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 20px',
      color: 'var(--ink-3)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink-2)', marginBottom: 6, fontStyle: 'italic' }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, marginBottom: 16 }}>{body}</div>
      {cta && <button className="btn primary"><Icon.Plus/> {cta}</button>}
    </div>
  );
}

Object.assign(window, { TripDetail });
