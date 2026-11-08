import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import Home from '@/pages/public/Home';
import Placeholder, { Soon } from '@/pages/public/Placeholder';

// Owned by Track A (public and auth). Add public pages here only.
export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'track', element: <Soon title="Track a parcel" /> },
      { path: 'track/:trackingCode', element: <Soon title="Track a parcel" /> },
      { path: 'privacy', element: <Placeholder title="Privacy policy" note="{{privacy policy}}" /> },
      { path: 'terms', element: <Placeholder title="Terms" note="{{terms of service}}" /> },
    ],
  },
];
