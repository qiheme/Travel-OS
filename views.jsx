// Calendar view, Archive view, Add Trip modal, Insights, Tweaks
function CalendarView({ trips, onOpen }) {
  const { TODAY } = window.TravelOSData;
  const [cursor, setCursor] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) {
    const d = new Date(year, month, -firstDow + i + 1);
    cells.push({ date: d, dim: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), dim: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, dim: true });
  }

  const tripsForCell = (d) => {
    return trips.filter(t => {
      if (!t.start_date || !t.end_date) return false;
      const s = new Date(t.start_date + 'T00:00:00');
      const e = new Date(t.end_date + 'T00:00:00');
      return d >= s && d <= e;
    });
  };

  const iso = (d) => d.toISOString().slice(0, 10);
  const todayIso = iso(TODAY);

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div className="calendar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
          {first.toLocaleDateString('en-US', { month: 'long' })} <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>{year}</em>
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" onClick={goPrev}><Icon.ChevronLeft/></button>
          <button className="icon-btn" onClick={goNext}><Icon.ChevronRight/></button>
        </div>
        <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => setCursor(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))}>Today</button>
      </div>

      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((c, i) => {
          const dayTrips = tripsForCell(c.date);
          const isToday = iso(c.date) === todayIso;
          return (
            <div key={i} className={`cal-cell${c.dim ? ' dim' : ''}${isToday ? ' today' : ''}`}>
              <div className="cal-day">{c.date.getDate()}</div>
              {dayTrips.slice(0, 2).map(t => (
                <div key={t.id} className="cal-trip"
                  style={{ background: `oklch(48% 0.14 ${t.cover?.hue || 30})` }}
                  onClick={() => onOpen(t.id)}
                >{t.destination}</div>
              ))}
              {dayTrips.length > 2 && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>+{dayTrips.length - 2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArchiveView({ trips, onOpen }) {
  const archived = trips.filter(t => t.stage === 'archived')
    .sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));

  const byYear = {};
  archived.forEach(t => {
    const y = new Date(t.start_date + 'T00:00:00').getFullYear();
    (byYear[y] = byYear[y] || []).push(t);
  });

  const allCountries = new Set(archived.map(t => t.country));
  const allDays = archived.reduce((s, t) => s + (t.nights || daysBetween(t.start_date, t.end_date)), 0);
  const totalSpend = archived.reduce((s, t) => s + (t.budget_spent || 0), 0);

  return (
    <div className="archive">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16, marginBottom: 20 }}>
        <div className="metric">
          <div className="label">Lifetime trips</div>
          <div className="value">{archived.length}</div>
          <div className="hint">completed and logged</div>
        </div>
        <div className="metric">
          <div className="label">Countries</div>
          <div className="value">{allCountries.size}</div>
          <div className="hint">{[...allCountries].slice(0,3).join(', ')}{allCountries.size > 3 ? '…' : ''}</div>
        </div>
        <div className="metric">
          <div className="label">Days traveled</div>
          <div className="value">{allDays}</div>
          <div className="hint">across all archived trips</div>
        </div>
        <div className="metric">
          <div className="label">Lifetime spend</div>
          <div className="value">{fmtMoney(totalSpend)}</div>
          <div className="hint">avg {fmtMoney(totalSpend / archived.length)}/trip</div>
        </div>
      </div>

      {Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map(y => {
        const yearTrips = byYear[y];
        const ySpend = yearTrips.reduce((s, t) => s + (t.budget_spent || 0), 0);
        const yDays = yearTrips.reduce((s, t) => s + (t.nights || 0), 0);
        return (
          <div key={y} className="archive-year">
            <div>
              <h2>{y}</h2>
              <div className="archive-year-stats">
                {yearTrips.length} {yearTrips.length === 1 ? 'trip' : 'trips'}<br/>
                {yDays} days<br/>
                {fmtMoney(ySpend)}
              </div>
            </div>
            <div className="archive-trips">
              {yearTrips.map(t => (
                <TripCard key={t.id} trip={t} onClick={() => onOpen(t.id)} onDragStart={() => {}} onDragEnd={() => {}}/>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Add Trip modal
function AddTripModal({ onClose, onAdd }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    destination: '',
    region: '',
    country: '',
    date_approx: '',
    start_date: '',
    end_date: '',
    categories: [],
    travelers: ['t1'],
    budget_total: '',
  });

  const { TRAVELERS } = window.TravelOSData;

  const toggleCat = (k) => {
    setData(d => ({
      ...d,
      categories: d.categories.includes(k) ? d.categories.filter(c => c !== k) : [...d.categories, k]
    }));
  };
  const toggleTrav = (id) => {
    setData(d => ({
      ...d,
      travelers: d.travelers.includes(id) ? d.travelers.filter(t => t !== id) : [...d.travelers, id]
    }));
  };

  const canProceed = () => {
    if (step === 0) return data.destination.trim() && data.country.trim();
    if (step === 1) return data.categories.length > 0 && data.travelers.length > 0;
    return true;
  };

  const submit = () => {
    const hue = [20, 180, 350, 260, 60, 110, 300][Math.floor(Math.random() * 7)];
    const trip = {
      id: 'tr-' + Math.random().toString(36).slice(2, 8),
      destination: data.destination.trim(),
      region: data.region.trim(),
      country: data.country.trim(),
      stage: 'dreaming',
      categories: data.categories,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      date_approx: data.date_approx || null,
      budget_total: Number(data.budget_total) || 0,
      budget_spent: 0,
      budget_currency: 'USD',
      travelers: data.travelers,
      cover: { hue, label: 'new·' + data.country.toLowerCase().slice(0, 4) },
      notes: '',
      nights: 0,
    };
    onAdd(trip);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2>New trip <em>· {['the idea', 'who and what', 'first details'][step]}</em></h2>
            <button className="icon-btn" onClick={onClose}><Icon.Close/></button>
          </div>
          <div className="modal-steps">
            {[0,1,2].map(i => <div key={i} className={`s${i <= step ? ' on' : ''}`}/>)}
          </div>
        </div>

        <div className="modal-body">
          {step === 0 && <>
            <div className="field">
              <label>Destination</label>
              <input autoFocus value={data.destination} onChange={e => setData(d => ({ ...d, destination: e.target.value }))} placeholder="Kyoto, Patagonia, Lisbon…"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label>Region / venue</label>
                <input value={data.region} onChange={e => setData(d => ({ ...d, region: e.target.value }))} placeholder="Optional"/>
              </div>
              <div className="field">
                <label>Country</label>
                <input value={data.country} onChange={e => setData(d => ({ ...d, country: e.target.value }))} placeholder="Japan"/>
              </div>
            </div>
            <div className="field">
              <label>When? <span style={{ textTransform: 'none', color: 'var(--ink-4)', fontWeight: 400, letterSpacing: 0 }}>— exact dates or a vibe</span></label>
              <input value={data.date_approx} onChange={e => setData(d => ({ ...d, date_approx: e.target.value }))} placeholder="Spring 2027, or leave blank"/>
            </div>
          </>}

          {step === 1 && <>
            <div className="field">
              <label>Categories <span style={{ textTransform: 'none', color: 'var(--ink-4)', fontWeight: 400, letterSpacing: 0 }}>— pick any that apply</span></label>
              <div className="cat-pick">
                {CATEGORIES.map(c => (
                  <button key={c.key} className={`c${data.categories.includes(c.key) ? ' on' : ''}`} onClick={() => toggleCat(c.key)}>
                    <span className="cat-pip" style={{ background: c.color }}/>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Travelers</label>
              <div className="cat-pick">
                {TRAVELERS.map(t => (
                  <button key={t.id} className={`c${data.travelers.includes(t.id) ? ' on' : ''}`} onClick={() => toggleTrav(t.id)}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </>}

          {step === 2 && <>
            <div className="field">
              <label>Rough budget <span style={{ textTransform: 'none', color: 'var(--ink-4)', fontWeight: 400, letterSpacing: 0 }}>— optional, USD</span></label>
              <input type="number" value={data.budget_total} onChange={e => setData(d => ({ ...d, budget_total: e.target.value }))} placeholder="8000"/>
            </div>
            <div style={{
              background: 'var(--bg-sunken)', padding: 16, borderRadius: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 4 }}>
                Great — we'll drop <em style={{ fontStyle: 'italic' }}>{data.destination || 'this trip'}</em> into Dreaming.
              </div>
              Add flights, lodging, itinerary later as things firm up. No rush.
            </div>
          </>}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <button
            className="btn primary"
            disabled={!canProceed()}
            style={{ opacity: canProceed() ? 1 : 0.5 }}
            onClick={() => step < 2 ? setStep(s => s + 1) : submit()}
          >
            {step < 2 ? 'Next →' : 'Add trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Insights strip
function InsightsStrip({ insights, onOpen, onDismiss }) {
  if (!insights.length) return null;
  return (
    <div className="insights">
      <h3>Nudges <em>· gentle, dismissible</em></h3>
      <div className="insights-scroller">
        {insights.map(i => (
          <div key={i.id} className={`insight ${i.severity}`}>
            <div className="sev"/>
            <div className="body" onClick={() => i.trip_id && onOpen(i.trip_id)} style={{ cursor: i.trip_id ? 'pointer' : 'default' }}>
              <div className="t">{i.title}</div>
              <div className="b">{i.body}</div>
            </div>
            <button className="x" onClick={() => onDismiss(i.id)}><Icon.Close/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tweaks panel
function TweaksPanel({ theme, setTheme, accent, setAccent, density, setDensity, onClose }) {
  const accents = [
    { key: 'orange', val: 'oklch(62% 0.15 50)', label: 'Clay' },
    { key: 'olive',  val: 'oklch(55% 0.1 130)', label: 'Olive' },
    { key: 'blue',   val: 'oklch(55% 0.12 250)', label: 'Ink' },
    { key: 'plum',   val: 'oklch(55% 0.12 330)', label: 'Plum' },
    { key: 'sand',   val: 'oklch(60% 0.04 60)',  label: 'Sand' },
  ];
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        Tweaks <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>· preview</em>
        <button className="icon-btn" onClick={onClose}><Icon.Close/></button>
      </div>
      <div className="tweaks-body">
        <div className="tweak-row">
          <div className="l">Theme</div>
          <div className="opts">
            {['light', 'dark'].map(t => (
              <button key={t} className={`o${theme === t ? ' on' : ''}`} onClick={() => setTheme(t)}>
                {t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="l">Accent</div>
          <div className="swatches">
            {accents.map(a => (
              <button key={a.key} className={`sw${accent === a.key ? ' on' : ''}`}
                style={{ background: a.val }} title={a.label} onClick={() => setAccent(a.key)}/>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="l">Density</div>
          <div className="opts">
            {['compact', 'normal', 'roomy'].map(d => (
              <button key={d} className={`o${density === d ? ' on' : ''}`} onClick={() => setDensity(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarView, ArchiveView, AddTripModal, InsightsStrip, TweaksPanel });

// Source metadata
const SOURCE_META = {
  email:     { label: 'Forwarded',  color: 'oklch(60% 0.08 200)', icon: '✉' },
  gmail:     { label: 'Gmail',      color: 'oklch(58% 0.14 25)',  icon: 'G' },
  extension: { label: 'Extension',  color: 'oklch(60% 0.1 280)',  icon: '⎘' },
  manual:    { label: 'Manual',     color: 'oklch(55% 0.02 80)',  icon: '✎' },
  api:       { label: 'API',        color: 'oklch(55% 0.12 150)', icon: '⚡' },
  viator:    { label: 'Viator',     color: 'oklch(55% 0.14 25)',  icon: 'V' },
};

const VENDOR_GLYPH = {
  'Airbnb':          { c: 'oklch(60% 0.17 20)',  g: 'A' },
  'United Airlines': { c: 'oklch(45% 0.12 255)', g: 'U' },
  'Viator':          { c: 'oklch(55% 0.14 25)',  g: 'V' },
  'OpenTable':       { c: 'oklch(55% 0.14 30)',  g: 'O' },
  'Expedia':         { c: 'oklch(52% 0.15 260)', g: 'E' },
  'TAP Portugal':    { c: 'oklch(55% 0.14 150)', g: 'T' },
  'Icelandair':      { c: 'oklch(50% 0.13 230)', g: 'I' },
};

function SourceChip({ source }) {
  if (!source) return null;
  const m = SOURCE_META[source] || SOURCE_META.manual;
  return (
    <span className="src-chip" title={`From ${m.label}`}>
      <span className="src-glyph" style={{ background: m.color }}>{m.icon}</span>
      {m.label}
    </span>
  );
}

// INBOX VIEW
function InboxView({ trips, onAssign, onOpen, inbox, onDismiss }) {
  const trip = (id) => trips.find(t => t.id === id);
  const sourceCounts = inbox.reduce((m, i) => { m[i.source] = (m[i.source]||0)+1; return m; }, {});

  return (
    <div className="inbox-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, margin: '8px 0 24px' }}>
        <div className="metric">
          <div className="label">In the inbox</div>
          <div className="value">{inbox.length}</div>
          <div className="hint">awaiting attach or review</div>
        </div>
        <div className="metric">
          <div className="label">Parsed</div>
          <div className="value">{inbox.filter(i => i.status === 'parsed').length}</div>
          <div className="hint">auto-matched to a trip</div>
        </div>
        <div className="metric">
          <div className="label">Parsing now</div>
          <div className="value">{inbox.filter(i => i.status === 'parsing').length}</div>
          <div className="hint">running through the LLM</div>
        </div>
        <div className="metric">
          <div className="label">Needs review</div>
          <div className="value">{inbox.filter(i => i.status === 'needs_review' || i.status === 'pending_trip').length}</div>
          <div className="hint">ambiguous or duplicate</div>
        </div>
      </div>

      <div className="forward-card">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em' }}>
            Forward anything to <em style={{ fontStyle: 'italic' }}>quincy+trips@travelos.app</em>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5 }}>
            Hotel confirms, Viator receipts, OpenTable reservations, flight emails — anything.
            We extract the details and suggest a trip.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="src-chip"><span className="src-glyph" style={{ background: SOURCE_META.email.color }}>✉</span>Forwarded · {sourceCounts.email||0}</span>
            <span className="src-chip"><span className="src-glyph" style={{ background: SOURCE_META.gmail.color }}>G</span>Gmail · {sourceCounts.gmail||0}</span>
            <span className="src-chip"><span className="src-glyph" style={{ background: SOURCE_META.extension.color }}>⎘</span>Extension · {sourceCounts.extension||0}</span>
          </div>
        </div>
        <button className="btn">Copy address</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {inbox.map(item => {
          const st = trip(item.suggested_trip);
          const vg = VENDOR_GLYPH[item.vendor] || { c: 'var(--ink-3)', g: item.vendor[0] };
          return (
            <div key={item.id} className={`inbox-row ${item.status}`}>
              <div className="vendor-mark" style={{ background: vg.c }}>{vg.g}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.subject}</div>
                  <SourceChip source={item.source}/>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                  {item.from} · {item.received_ago}
                </div>
                {item.status === 'parsing' && (
                  <div className="parse-shim" style={{ marginTop: 10 }}>
                    <div className="bar"/>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Parsing confirmation…</span>
                  </div>
                )}
                {item.parsed && (
                  <div className="parsed-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(() => { const I = BOOKING_ICONS[item.parsed.type] || Icon.MoreH; return <I/>; })()}
                      <strong style={{ fontSize: 13.5 }}>{item.parsed.title}</strong>
                      {item.parsed.cost > 0 && <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-2)' }}>{fmtMoney(item.parsed.cost)}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
                      <span>{item.parsed.dates}</span>
                      {item.parsed.confirmation && <span style={{ fontFamily: 'var(--font-mono)' }}>{item.parsed.confirmation}</span>}
                    </div>
                    {item.parsed.note && (
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, fontStyle: 'italic' }}>{item.parsed.note}</div>
                    )}
                  </div>
                )}
                {item.note && (
                  <div style={{ fontSize: 12, color: 'oklch(58% 0.15 50)', marginTop: 6 }}>⚠ {item.note}</div>
                )}
              </div>
              <div className="inbox-actions">
                {item.suggested_trip && st && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      Suggest
                      <span style={{ marginLeft: 6, color: 'var(--ink-4)' }}>{Math.round(item.suggested_confidence*100)}%</span>
                    </div>
                    <button className="inbox-suggest" onClick={() => onOpen(st.id)}>
                      <span className="cat-pip" style={{ background: `oklch(48% 0.14 ${st.cover?.hue||30})`, width: 8, height: 8 }}/>
                      {st.destination}
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn primary" style={{ padding: '6px 12px' }} onClick={() => onAssign(item.id, st.id)} disabled={item.status === 'parsing'}>
                        Attach
                      </button>
                      <button className="btn" style={{ padding: '6px 12px' }} onClick={() => onDismiss(item.id)}>Dismiss</button>
                    </div>
                  </>
                )}
                {!item.suggested_trip && (
                  <button className="btn" style={{ padding: '6px 12px' }}>Pick trip…</button>
                )}
              </div>
            </div>
          );
        })}
        {inbox.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--ink-2)' }}>Inbox zero.</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>New confirmations will show up here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function IntegrationsModal({ onClose }) {
  const { INTEGRATIONS } = window.TravelOSData;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Integrations <em>· how bookings get here</em></h2>
            <button className="icon-btn" onClick={onClose}><Icon.Close/></button>
          </div>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {INTEGRATIONS.map(it => (
            <div key={it.key} className="integ-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{it.name}</strong>
                  <span className={`integ-status ${it.status}`}>
                    {it.status === 'active' && '● Connected'}
                    {it.status === 'email-only' && '◐ Via forwarding'}
                    {it.status === 'available' && '○ Available'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
                {it.meta && (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {it.meta}{it.count ? ' · ' + it.count : ''}
                  </div>
                )}
              </div>
              <button className="btn" style={{ padding: '6px 12px' }}>
                {it.status === 'active' ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Everything here is read-only or email-based. Your inbox stays yours.</span>
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InboxView, IntegrationsModal, SourceChip, SOURCE_META });
