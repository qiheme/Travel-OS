import { Link } from 'react-router-dom';

export function NotFoundRoute() {
  return (
    <section aria-label="not-found">
      <p>Route not found.</p>
      <Link to="/app/pipeline">Go to pipeline</Link>
    </section>
  );
}
