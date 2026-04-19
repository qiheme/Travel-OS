import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from './router';

describe('app router', () => {
  it('renders pipeline route and active nav link', () => {
    const router = createMemoryRouter(routes as unknown as Parameters<typeof createMemoryRouter>[0], {
      initialEntries: ['/app/pipeline']
    });

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: 'Travel OS' })).toBeInTheDocument();
    expect(screen.getByLabelText('pipeline')).toHaveTextContent('Pipeline view scaffold');
    expect(screen.getByRole('link', { name: 'Pipeline' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Inbox' })).not.toHaveClass('active');
  });

  it('renders inbox route and active nav link', () => {
    const router = createMemoryRouter(routes as unknown as Parameters<typeof createMemoryRouter>[0], {
      initialEntries: ['/app/inbox']
    });

    render(<RouterProvider router={router} />);

    expect(screen.getByLabelText('inbox')).toHaveTextContent('Inbox view scaffold');
    expect(screen.getByRole('link', { name: 'Inbox' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Pipeline' })).not.toHaveClass('active');
  });

  it('renders not found route outside app shell', () => {
    const router = createMemoryRouter(routes as unknown as Parameters<typeof createMemoryRouter>[0], {
      initialEntries: ['/nope']
    });

    render(<RouterProvider router={router} />);

    expect(screen.getByLabelText('not-found')).toHaveTextContent('Route not found.');
    expect(screen.getByRole('link', { name: 'Go to pipeline' })).toHaveAttribute('href', '/app/pipeline');
  });

  it('redirects root to pipeline', async () => {
    const router = createMemoryRouter(routes as unknown as Parameters<typeof createMemoryRouter>[0], {
      initialEntries: ['/']
    });

    render(<RouterProvider router={router} />);

    await screen.findByLabelText('pipeline');
    expect(router.state.location.pathname).toBe('/app/pipeline');
  });

  it('redirects /app to /app/pipeline', async () => {
    const router = createMemoryRouter(routes as unknown as Parameters<typeof createMemoryRouter>[0], {
      initialEntries: ['/app']
    });

    render(<RouterProvider router={router} />);

    await screen.findByLabelText('pipeline');
    expect(router.state.location.pathname).toBe('/app/pipeline');
  });
});
