import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import DriverDashboard from '@/pages/driver/DriverDashboard';
import DriverLogin from '@/pages/driver/DriverLogin';
import DriverApply from '@/pages/driver/DriverApply';

// Owned by Track C (driver PWA). Nest new screens under `driver`.
export const driverRoutes: RouteObject[] = [
  { path: 'driver/login', element: <DriverLogin /> },
  { path: 'driver/apply', element: <DriverApply /> },
  {
    element: <ProtectedRoute roles={['DRIVER']} />,
    children: [
      { path: 'driver', element: <DriverDashboard /> },
      { path: 'driver/*', element: <Navigate to="/driver" replace /> },
    ],
  },
];
