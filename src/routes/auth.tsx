import type { RouteObject } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import Login from '@/pages/auth/Login';
import { Soon } from '@/pages/public/Placeholder';

// Owned by Track A (public and auth).
export const authRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Soon title="Create an organization" /> },
      { path: 'join', element: <Soon title="Join an organization" /> },
    ],
  },
];
