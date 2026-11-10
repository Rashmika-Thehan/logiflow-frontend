import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Onboarding from '@/pages/onboarding/Onboarding';
import AcceptInvite from '@/pages/auth/AcceptInvite';
import Join from '@/pages/auth/Join';

// Owned by Track A (public and auth).
export const authRoutes: RouteObject[] = [
    {
        element: <AuthLayout />,
        children: [
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'join', element: <Join /> },
            { path: 'invite/accept', element: <AcceptInvite /> },
        ],
    },
    {
        element: <ProtectedRoute roles={['BUSINESS_ADMIN']} />,
        children: [{ path: 'onboarding', element: <Onboarding /> }],
    },
];