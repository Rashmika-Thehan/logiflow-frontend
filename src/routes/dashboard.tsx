import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Soon } from '@/pages/public/Placeholder';

// Owned by Track B (dispatcher and admin). Nest new screens under `dashboard`.
export const dashboardRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute roles={['BUSINESS_ADMIN', 'DISPATCHER', 'SUPER_ADMIN']} />,
    children: [{ path: 'dashboard/*', element: <Soon title="Control tower" /> }],
  },
];
