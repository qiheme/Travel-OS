import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProvider } from './AppContext';
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

  return render(<AppProvider><RouterProvider router={router} /></AppProvider>);
};

describe('route components', () => {
  it('renders pipeline with count', async () => {
    renderAt('/app/pipeline');
    expect(await screen.findByText('Travel OS')).toBeInTheDocument();
    expect(screen.getByText('Dreaming')).toBeInTheDocument();
    expect(screen.getByText('Quincy')).toBeInTheDocument();
  });

  it('renders static sections', async () => {
    renderAt('/app/inbox');
    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();

    renderAt('/app/calendar');
    expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeInTheDocument();

    renderAt('/app/archive');
    expect(await screen.findByText('Archive (3)')).toBeInTheDocument();
  });

  it('sidebar and topbar interactions work', async () => {
    renderAt('/app/pipeline');
    await screen.findByText('Travel OS');

    fireEvent.click(screen.getByRole('button', { name: /Family/i }));
    fireEvent.change(screen.getByPlaceholderText('Search destinations…'), { target: { value: 'k' } });
    fireEvent.click(screen.getByRole('button', { name: /New trip/i }));
    fireEvent.click(screen.getByRole('button', { name: /Integrations/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tweaks/i }));

    expect(screen.getByText('Travel OS')).toBeInTheDocument();
  });

  it('renders trip detail and not found state', async () => {
    renderAt('/app/trip/tr-kyoto');
    expect(await screen.findByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();

    renderAt('/app/trip/nope');
    expect(await screen.findByText('Trip not found.')).toBeInTheDocument();
  });
});
