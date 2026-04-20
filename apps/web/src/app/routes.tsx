import { NavLink, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { CATEGORIES } from '../lib/utils';
import { findTripById } from '../lib/trips';
import { useApp } from './AppContext';
import { Icon } from '../components/Icon';
import type { Trip } from '../lib/types';

type OutletCtx = { trips: Trip[] };

// No-op kept for router.tsx compatibility; AppLayout reads from AppContext instead.
export const tripsLoader = () => ({});

export function AppLayout() {
  const {
    trips, inbox, search, setSearch,
    toggleCategoryFilter,
    tweaksOpen, setShowModal, setShowIntegrations, setTweaksOpen,
  } = useApp();

  const { pathname } = useLocation();
  const segment = pathname.split('/')[2];

  const pipelineCount = trips.filter((t) => t.stage !== 'archived').length;
  const archiveCount  = trips.filter((t) => t.stage === 'archived').length;

  const topbarContent: Record<string, { title: string; subtitle: string }> = {
    pipeline: { title: 'Good afternoon, Quincy.', subtitle: 'Your travel pipeline at a glance' },
    inbox:    { title: 'Inbox.',                  subtitle: `Forwarded confirmations · ${inbox.length} items` },
    calendar: { title: 'Calendar.',               subtitle: 'Everything in motion on one page' },
    archive:  { title: 'Archive.',                subtitle: "Every trip you've completed" },
  };
  const topbar = topbarContent[segment];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div className="brand-name">Travel OS</div>
        </div>

        <div className="nav-section">Views</div>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="pipeline">
          <Icon.Pipeline /> Pipeline <span className="count">{pipelineCount}</span>
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="inbox">
          <Icon.Notes /> Inbox <span className="count">{inbox.length}</span>
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="calendar">
          <Icon.Calendar /> Calendar
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="archive">
          <Icon.Archive /> Archive <span className="count">{archiveCount}</span>
        </NavLink>

        <div className="nav-section">Categories</div>
        {CATEGORIES.map((c) => {
          const n = trips.filter((t) => t.categories.includes(c.key) && t.stage !== 'archived').length;
          if (n === 0) return null;
          return (
            <button key={c.key} className="nav-item" onClick={() => toggleCategoryFilter(c.key)}>
              <span className="cat-pip" style={{ background: c.color, width: 10, height: 10 }} />
              {c.label} <span className="count">{n}</span>
            </button>
          );
        })}

        <div className="nav-section">Tools</div>
        <button className="nav-item" onClick={() => setShowIntegrations(true)}>
          <Icon.Sparkle /> Integrations
        </button>
        <button className="nav-item" onClick={() => setTweaksOpen(!tweaksOpen)}>
          <Icon.Sliders /> Tweaks
        </button>

        <div className="sidebar-footer">
          <div className="avatar">Q</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 12.5 }}>Quincy</div>
            <div style={{ fontSize: 11 }}>Cherry Hill, NJ</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {topbar && (
          <div className="topbar">
            <div>
              <h1>{topbar.title}</h1>
              <div className="subtitle">{topbar.subtitle}</div>
            </div>
            <div className="spacer" />
            <div className="search">
              <Icon.Search />
              <input
                placeholder="Search destinations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn primary" onClick={() => setShowModal(true)}>
              <Icon.Plus /> New trip
            </button>
          </div>
        )}
        <Outlet context={{ trips } satisfies OutletCtx} />
      </main>
    </div>
  );
}

export function PipelinePage() {
  const { trips } = useOutletContext<OutletCtx>();
  return <h2>Pipeline ({trips.filter((trip) => trip.stage !== 'archived').length})</h2>;
}

export function InboxPage() {
  return <h2>Inbox</h2>;
}

export function CalendarPage() {
  return <h2>Calendar</h2>;
}

export function ArchivePage() {
  const { trips } = useOutletContext<OutletCtx>();
  const archivedTrips = trips.filter((trip) => trip.stage === 'archived');
  return <h2>Archive ({archivedTrips.length})</h2>;
}

export function TripDetailPage() {
  const { trips } = useOutletContext<OutletCtx>();
  const { tripId } = useParams() as { tripId: string };
  const trip = findTripById(trips, tripId);

  if (!trip) {
    return <p>Trip not found.</p>;
  }

  return (
    <section>
      <h2>{trip.destination}</h2>
      <p>{trip.country}</p>
      <p>Stage: {trip.stage}</p>
    </section>
  );
}
