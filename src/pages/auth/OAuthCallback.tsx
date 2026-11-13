import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTokens } from '@/api/client';
import { homePathForRole, useAuthStore } from '@/stores/authStore';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken) {
      setTokens(accessToken, refreshToken || undefined);
    }

    void bootstrap();
  }, [params, bootstrap]);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate(homePathForRole(user.role), { replace: true });
    } else if (status === 'anonymous') {
      navigate('/login', { replace: true });
    }
  }, [status, user, navigate]);

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 p-6" aria-busy="true" aria-label="Authenticating session">
      <div className="h-8 w-48 rounded-lg bg-surface-3 animate-pulse" />
      <p className="caption-1 text-fg-muted">Signing in with Google...</p>
    </div>
  );
}
