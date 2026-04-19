import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <header>
        <h1>Travel OS</h1>
        <nav aria-label="Primary">
          <NavLink to="/app/pipeline" className={({ isActive }) => (isActive ? 'active' : '')}>
            Pipeline
          </NavLink>
          <NavLink to="/app/inbox" className={({ isActive }) => (isActive ? 'active' : '')}>
            Inbox
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
