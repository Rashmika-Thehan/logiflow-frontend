import { createBrowserRouter } from 'react-router-dom';
import NotFound from '@/pages/public/NotFound';
import { authRoutes } from './auth';
import { dashboardRoutes } from './dashboard';
import { driverRoutes } from './driver';
import { publicRoutes } from './public';

export const router = createBrowserRouter([
  ...publicRoutes,
  ...authRoutes,
  ...dashboardRoutes,
  ...driverRoutes,
  { path: '*', element: <NotFound /> },
]);
