import { Link, Outlet, useLoaderData, useParams } from 'react-router-dom';
import { findTripById, tripsFixture, type Trip } from '../lib/trips';

type TripsLoaderData = {
  trips: Trip[];
};

export const tripsLoader = (): TripsLoaderData => ({ trips: tripsFixture });

export function AppLayout() {
  const { trips } = useLoaderData() as TripsLoaderData;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Travel OS</h1>
        <nav>
          <Link to="pipeline">Pipeline</Link>
          <Link to="inbox">Inbox</Link>
          <Link to="calendar">Calendar</Link>
          <Link to="archive">Archive</Link>
        </nav>
        <p>Total trips: {trips.length}</p>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export function PipelinePage() {
  const { trips } = useLoaderData() as TripsLoaderData;
  return <h2>Pipeline ({trips.filter((trip) => trip.stage !== 'archived').length})</h2>;
}

export function InboxPage() {
  return <h2>Inbox</h2>;
}

export function CalendarPage() {
  return <h2>Calendar</h2>;
}

export function ArchivePage() {
  const { trips } = useLoaderData() as TripsLoaderData;
  const archivedTrips = trips.filter((trip) => trip.stage === 'archived');
  return <h2>Archive ({archivedTrips.length})</h2>;
}

export function TripDetailPage() {
  const { trips } = useLoaderData() as TripsLoaderData;
  const { tripId } = useParams();
  const trip = tripId ? findTripById(trips, tripId) : undefined;

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
