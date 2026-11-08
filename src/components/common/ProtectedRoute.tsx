import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { status, user, bootstrap } = useAuthStore();
  const location = useLocation();

  useEffect(() => { void bootstrap(); }, [bootstrap]);

  if (status === 'idle' || status === 'loading') {
    return <div className="min-h-screen p-6" aria-busy="true" aria-label="Loading session"><div className="h-8 w-48 rounded-lg bg-surface-3" /></div>;
  }
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
