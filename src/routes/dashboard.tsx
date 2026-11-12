import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import FleetMap from '@/pages/dashboard/FleetMap';
import SectionStub from '@/pages/dashboard/SectionStub';
import Shipments from '@/pages/dashboard/Shipments';
import Dispatch from '@/pages/dashboard/Dispatch';
import Vehicles from '@/pages/dashboard/Vehicles';

// Owned by Track B (dispatcher and admin). Replace a SectionStub with the real page in each branch.
export const dashboardRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute roles={['BUSINESS_ADMIN', 'DISPATCHER', 'SUPER_ADMIN']} />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="dispatch" replace /> },
          { path: 'dispatch', element: <Dispatch /> },
          { path: 'map', element: <FleetMap /> },
          { path: 'shipments', element: <Shipments /> },
          { path: 'vehicles', element: <Vehicles /> },
          {
            element: <ProtectedRoute roles={['BUSINESS_ADMIN']} />,
            children: [{ path: 'settings', element: <SectionStub title="Settings" /> }],
          },
          {
            element: <ProtectedRoute roles={['SUPER_ADMIN']} />,
            children: [{ path: 'platform-drivers', element: <SectionStub title="Platform drivers" /> }],
          },
        ],
      },
    ],
  },
];