// Main app — Travel OS
const { useState: uS, useEffect: uE, useMemo: uM } = React;

function App() {
  const { TRIPS, INSIGHTS: initialInsights, INBOX: initialInbox } = window.TravelOSData;

  // State
  const [trips, setTrips] = uS(TRIPS);
  const [tripDetails, setTripDetails] = uS(window.TravelOSData.TRIP_DETAILS);
  const [insights, setInsights] = uS(initialInsights);
  const [inbox, setInbox] = uS(initialInbox);
  const [showIntegrations, setShowIntegrations] = uS(false);
  const [view, setView] = uS(() => localStorage.getItem('travelos:view') || 'pipeline');
  const [openTripId, setOpenTripId] = uS(() => localStorage.getItem('travelos:openTrip') || null);
  const [showModal, setShowModal] = uS(false);
  const [search, setSearch] = uS('');
  const [categoryFilter, setCategoryFilter] = uS([]);

  // Theme + tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "accent": "orange",
    "density": "normal",
    "showInsights": true
  }/*EDITMODE-END*/;

  const [theme, setTheme] = uS(TWEAK_DEFAULTS.theme);
  const [accent, setAccent] = uS(TWEAK_DEFAULTS.accent);
  const [density, setDensity] = uS(TWEAK_DEFAULTS.density);
  const [showInsights, setShowInsights] = uS(TWEAK_DEFAULTS.showInsights);
  const [tweaksOpen, setTweaksOpen] = uS(false);

  uE(() => { localStorage.setItem('travelos:view', view); }, [view]);
  uE(() => {
    if (openTripId) localStorage.setItem('travelos:openTrip', openTripId);
    else localStorage.removeItem('travelos:openTrip');
  }, [openTripId]);

  uE(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  uE(() => {
    const accents = {
      orange: { val: 'oklch(62% 0.15 50)', soft: 'oklch(92% 0.04 60)', ink: 'oklch(35% 0.1 50)' },
      olive:  { val: 'oklch(55% 0.1 130)', soft: 'oklch(92% 0.03 130)', ink: 'oklch(32% 0.08 130)' },
      blue:   { val: 'oklch(55% 0.12 250)', soft: 'oklch(92% 0.04 250)', ink: 'oklch(32% 0.1 250)' },
      plum:   { val: 'oklch(55% 0.12 330)', soft: 'oklch(92% 0.04 330)', ink: 'oklch(32% 0.1 330)' },
      sand:   { val: 'oklch(55% 0.05 60)',  soft: 'oklch(92% 0.02 60)',  ink: 'oklch(32% 0.04 60)' },
    };
    const a = accents[accent] || accents.orange;
    document.documentElement.style.setProperty('--accent', a.val);
    document.documentElement.style.setProperty('--accent-soft', a.soft);
    document.documentElement.style.setProperty('--accent-ink', a.ink);
  }, [accent]);
  uE(() => {
    const m = { compact: '0.88', normal: '1', roomy: '1.15' };
    document.documentElement.style.fontSize = `${14 * Number(m[density] || 1)}px`;
  }, [density]);

  // Edit-mode integration (Tweaks toggle in the toolbar)
  uE(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const persistTweaks = (patch) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  };

  // Filtered trips by search
  const searched = uM(() => {
    if (!search) return trips;
    const q = search.toLowerCase();
    return trips.filter(t =>
      t.destination.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      (t.region || '').toLowerCase().includes(q)
    );
  }, [trips, search]);

  // Handlers
  const moveStage = (tripId, newStage) => {
    setTrips(ts => ts.map(t => t.id === tripId ? { ...t, stage: newStage } : t));
  };
  const updateTrip = (tripId, patch) => {
    setTrips(ts => ts.map(t => t.id === tripId ? { ...t, ...patch } : t));
  };
  const addTrip = (trip) => {
    setTrips(ts => [...ts, trip]);
  };
  const togglePacked = (tripId, idx) => {
    setTripDetails(d => ({
      ...d,
      [tripId]: {
        ...d[tripId],
        packing: d[tripId].packing.map((p, i) => i === idx ? { ...p, packed: !p.packed } : p)
      }
    }));
  };
  const toggleBookingStatus = (tripId, idx, newStatus) => {
    setTripDetails(d => ({
      ...d,
      [tripId]: {
        ...d[tripId],
        bookings: d[tripId].bookings.map((b, i) => i === idx ? { ...b, status: newStatus } : b)
      }
    }));
  };
  const dismissInsight = (id) => setInsights(ii => ii.filter(i => i.id !== id));
  const dismissInboxItem = (id) => setInbox(ii => ii.filter(i => i.id !== id));
  const assignInboxItem = (id, tripId) => {
    setInbox(ii => ii.filter(i => i.id !== id));
  };

  const toggleCategoryFilter = (k) => {
    setCategoryFilter(f => f.includes(k) ? f.filter(x => x !== k) : [...f, k]);
  };

  const openTrip = (id) => {
    setOpenTripId(id);
    setView('detail');
  };
  const backToPipeline = () => {
    setOpenTripId(null);
    setView('pipeline');
  };

  // If openTripId exists on load, ensure view is detail
  uE(() => {
    if (openTripId && view !== 'detail') {
      // keep whatever they had; but if view restored is not a known one, default
    }
    if (!openTripId && view === 'detail') {
      setView('pipeline');
    }
  }, []);

  const counts = uM(() => {
    const m = { pipeline: 0, calendar: 0, archive: 0 };
    trips.forEach(t => {
      if (t.stage !== 'archived') m.pipeline++;
      else m.archive++;
    });
    return m;
  }, [trips]);

  const activeTrip = trips.find(t => t.id === openTripId);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div className="brand-name">Travel<em>OS</em></div>
        </div>

        <div className="nav-section">Views</div>
        <button className={`nav-item${view === 'pipeline' ? ' active' : ''}`} onClick={() => { setView('pipeline'); setOpenTripId(null); }}>
          <Icon.Pipeline/> Pipeline <span className="count">{counts.pipeline}</span>
        </button>
        <button className={`nav-item${view === 'inbox' ? ' active' : ''}`} onClick={() => { setView('inbox'); setOpenTripId(null); }}>
          <Icon.Notes/> Inbox <span className="count">{inbox.length}</span>
        </button>
        <button className={`nav-item${view === 'calendar' ? ' active' : ''}`} onClick={() => { setView('calendar'); setOpenTripId(null); }}>
          <Icon.Calendar/> Calendar
        </button>
        <button className={`nav-item${view === 'archive' ? ' active' : ''}`} onClick={() => { setView('archive'); setOpenTripId(null); }}>
          <Icon.Archive/> Archive <span className="count">{counts.archive}</span>
        </button>

        <div className="nav-section">Categories</div>
        {CATEGORIES.map(c => {
          const n = trips.filter(t => t.categories.includes(c.key) && t.stage !== 'archived').length;
          if (n === 0) return null;
          return (
            <button key={c.key} className="nav-item" onClick={() => toggleCategoryFilter(c.key)}
              style={{ background: categoryFilter.includes(c.key) ? 'var(--divider)' : undefined }}>
              <span className="cat-pip" style={{ background: c.color, width: 10, height: 10 }}/>
              {c.label}
              <span className="count">{n}</span>
            </button>
          );
        })}

        <div className="nav-section">Tools</div>
        <button className="nav-item" onClick={() => setShowIntegrations(true)}>
          <Icon.Sparkle/> Integrations
        </button>
        <button className="nav-item" onClick={() => setTweaksOpen(v => !v)}>
          <Icon.Sliders/> Tweaks
        </button>
        <button className="nav-item">
          <Icon.Settings/> Settings
        </button>

        <div className="sidebar-footer">
          <div className="avatar">Q</div>
          <div>
            <div style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 12.5 }}>Quincy</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Cherry Hill, NJ</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {view !== 'detail' && (
          <div className="topbar">
            <div>
              {view === 'pipeline' && <>
                <h1>Good afternoon, Quincy<em>.</em></h1>
                <div className="subtitle">April 18, 2026 · {trips.filter(t => t.start_date && daysBetween(window.TravelOSData.TODAY, t.start_date) >= 0 && daysBetween(window.TravelOSData.TODAY, t.start_date) <= 30).length} trips within 30 days</div>
              </>}
              {view === 'inbox' && <>
                <h1>Inbox<em>.</em></h1>
                <div className="subtitle">Forwarded confirmations · {inbox.length} items</div>
              </>}
              {view === 'calendar' && <>
                <h1>Calendar<em>.</em></h1>
                <div className="subtitle">Everything in motion on one page</div>
              </>}
              {view === 'archive' && <>
                <h1>Archive<em>.</em></h1>
                <div className="subtitle">Every trip you've completed</div>
              </>}
            </div>
            <div className="spacer"/>
            <div className="search">
              <Icon.Search/>
              <input placeholder="Search destinations…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className="btn primary" onClick={() => setShowModal(true)}>
              <Icon.Plus/> New trip
            </button>
          </div>
        )}

        {view === 'pipeline' && (
          <div className="dashboard">
            <Metrics trips={trips}/>
            <YearRibbon trips={trips.filter(t => t.stage !== 'archived')} onOpen={openTrip}/>

            <div className="pipeline-head">
              <h3>Pipeline <em>· {searched.filter(t => t.stage !== 'archived').length} trips in motion</em></h3>
              {categoryFilter.length > 0 && (
                <div className="filter-chips">
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Filter:</span>
                  {categoryFilter.map(k => (
                    <button key={k} className="chip on" onClick={() => toggleCategoryFilter(k)}>
                      <span className="sw" style={{ background: CAT_MAP[k].color }}/>
                      {CAT_MAP[k].label}
                      <Icon.Close style={{ width: 10, height: 10 }}/>
                    </button>
                  ))}
                  <button className="chip" onClick={() => setCategoryFilter([])}>Clear</button>
                </div>
              )}
            </div>

            <Pipeline
              trips={searched.filter(t => t.stage !== 'archived')}
              onOpen={openTrip}
              onMove={moveStage}
              categoryFilter={categoryFilter}
            />

            {showInsights && (
              <InsightsStrip insights={insights} onOpen={openTrip} onDismiss={dismissInsight}/>
            )}
          </div>
        )}

        {view === 'inbox' && (
          <div className="dashboard">
            <InboxView trips={trips} inbox={inbox} onAssign={assignInboxItem} onOpen={openTrip} onDismiss={dismissInboxItem}/>
          </div>
        )}

        {view === 'calendar' && <CalendarView trips={trips} onOpen={openTrip}/>}

        {view === 'archive' && <ArchiveView trips={trips} onOpen={openTrip}/>}

        {view === 'detail' && activeTrip && (
          <TripDetail
            tripId={openTripId}
            onBack={backToPipeline}
            onUpdateTrip={updateTrip}
            onTogglePacked={togglePacked}
            onToggleBookingStatus={toggleBookingStatus}
          />
        )}
      </main>

      {showModal && <AddTripModal onClose={() => setShowModal(false)} onAdd={addTrip}/>}
      {showIntegrations && <IntegrationsModal onClose={() => setShowIntegrations(false)}/>}
      {tweaksOpen && (
        <TweaksPanel
          theme={theme} setTheme={(v) => { setTheme(v); persistTweaks({ theme: v }); }}
          accent={accent} setAccent={(v) => { setAccent(v); persistTweaks({ accent: v }); }}
          density={density} setDensity={(v) => { setDensity(v); persistTweaks({ density: v }); }}
          onClose={() => setTweaksOpen(false)}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
