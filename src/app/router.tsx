import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { InboxRoute } from './routes/InboxRoute';
import { NotFoundRoute } from './routes/NotFoundRoute';
import { PipelineRoute } from './routes/PipelineRoute';

export const routes = [
  {
    path: '/',
    element: <Navigate to="/app/pipeline" replace />
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="pipeline" replace />
      },
      {
        path: 'pipeline',
        element: <PipelineRoute />
      },
      {
        path: 'inbox',
        element: <InboxRoute />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundRoute />
  }
] as const;

export const appRouter = createBrowserRouter(routes);
