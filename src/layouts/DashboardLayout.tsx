import { List, SignOut } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertBell } from '@/components/dashboard/AlertBell';
import { Sidebar } from '@/components/dashboard/SideBar';
import { Button } from '@/components/ui/button';
import { useAlertsSSE } from '@/hooks/useAlertsSSE';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const roleLabel: Record<UserRole, string> = {
    SUPER_ADMIN: 'Platform admin',
    BUSINESS_ADMIN: 'Administrator',
    DISPATCHER: 'Dispatcher',
    DRIVER: 'Driver',
};

const COLLAPSE_KEY = 'logiflow.sidebarCollapsed';
const readCollapsed = () => {
    try {
        return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
        return false;
    }
};

export function DashboardLayout() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const stream = useAlertsSSE();
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => setMobileOpen(false), [pathname]);

    const toggleCollapsed = () =>
        setCollapsed((c) => {
            try {
                localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
            } catch {
                /* storage unavailable, keep the in memory value */
            }
            return !c;
        });

    const signOut = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-surface-0">
            <a
                href="#dashboard-main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-fg focus:px-3 focus:py-2 focus:text-surface-0"
            >
                Skip to content
            </a>
            <Sidebar
                role={user.role}
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between gap-3 border-b border-surface-5 bg-surface-1 px-4 py-2">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                        className="rounded-lg p-2 hover:bg-surface-4 md:hidden"
                    >
                        <List size={24} aria-hidden="true" />
                    </button>
                    <p className="caption-2 hidden text-fg-muted md:block" role="status">
                        {stream === 'open' ? 'Alerts live' : stream === 'retrying' ? 'Alerts reconnecting' : 'Connecting to alerts'}
                    </p>
                    <div className="flex items-center gap-2">
                        <AlertBell />
                        <span className="body-5 hidden rounded-lg border border-surface-5 bg-surface-3 px-3 py-2 sm:block">
                            {roleLabel[user.role]}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                            <SignOut size={16} aria-hidden="true" />
                            Sign out
                        </Button>
                    </div>
                </header>
                <main id="dashboard-main" className="min-h-0 flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}