import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  AppLayout,
  ArchivePage,
  CalendarPage,
  InboxPage,
  PipelinePage,
  TripDetailPage,
  authGuardLoader,
} from './routes';
import { Login } from './Login';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/pipeline" replace />
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    loader: authGuardLoader,
    children: [
      {
        index: true,
        element: <Navigate to="pipeline" replace />
      },
      {
        path: 'pipeline',
        element: <PipelinePage />
      },
      {
        path: 'inbox',
        element: <InboxPage />
      },
      {
        path: 'calendar',
        element: <CalendarPage />
      },
      {
        path: 'archive',
        element: <ArchivePage />
      },
      {
        path: 'trip/:tripId',
        element: <TripDetailPage />
      }
    ]
  }
]);
