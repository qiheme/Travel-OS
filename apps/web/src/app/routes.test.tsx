import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  AppLayout,
  ArchivePage,
  CalendarPage,
  InboxPage,
  PipelinePage,
  TripDetailPage,
  tripsLoader
} from './routes';

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      {
        path: '/app',
        element: <AppLayout />,
        loader: tripsLoader,
        children: [
          { path: 'pipeline', element: <PipelinePage /> },
          { path: 'inbox', element: <InboxPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'archive', element: <ArchivePage /> },
          { path: 'trip/:tripId', element: <TripDetailPage /> }
        ]
      }
    ],
    { initialEntries: [path] }
  );

  return render(<RouterProvider router={router} />);
};

describe('route components', () => {
  it('renders pipeline with count', async () => {
    renderAt('/app/pipeline');
    expect(await screen.findByText('Travel OS')).toBeInTheDocument();
    expect(screen.getByText('Pipeline (8)')).toBeInTheDocument();
    expect(screen.getByText('Total trips: 11')).toBeInTheDocument();
  });

  it('renders static sections', async () => {
    renderAt('/app/inbox');
    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();

    renderAt('/app/calendar');
    expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeInTheDocument();

    renderAt('/app/archive');
    expect(await screen.findByText('Archive (3)')).toBeInTheDocument();
  });

  it('renders trip detail and not found state', async () => {
    renderAt('/app/trip/tr-kyoto');
    expect(await screen.findByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();

    renderAt('/app/trip/nope');
    expect(await screen.findByText('Trip not found.')).toBeInTheDocument();
  });
});
