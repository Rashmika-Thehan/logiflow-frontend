import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Onboarding from '@/pages/onboarding/Onboarding';
import { Soon } from '@/pages/public/Placeholder';

// Owned by Track A (public and auth).
export const authRoutes: RouteObject[] = [
    {
        element: <AuthLayout />,
        children: [
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'join', element: <Soon title="Join an organization" /> },
        ],
    },
    {
        element: <ProtectedRoute roles={['BUSINESS_ADMIN']} />,
        children: [{ path: 'onboarding', element: <Onboarding /> }],
    },
];