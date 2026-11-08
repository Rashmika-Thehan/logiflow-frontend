import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Soon } from '@/pages/public/Placeholder';

// Owned by Track C (driver PWA). Nest new screens under `driver`.
export const driverRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute roles={['DRIVER']} />,
    children: [{ path: 'driver/*', element: <Soon title="Driver home" /> }],
  },
];
