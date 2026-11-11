import { GearSix, IdentificationBadge, MapTrifold, Package, PaperPlaneTilt, SidebarSimple, Truck, X } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Icon } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { EASE_BRAND } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
    label: string;
    to: string;
    icon: Icon;
    roles?: UserRole[];
}

const items: NavItem[] = [
    { label: 'Dispatch', to: '/dashboard/dispatch', icon: PaperPlaneTilt },
    { label: 'Live map', to: '/dashboard/map', icon: MapTrifold },
    { label: 'Shipments', to: '/dashboard/shipments', icon: Package },
    { label: 'Fleet', to: '/dashboard/vehicles', icon: Truck },
    { label: 'Settings', to: '/dashboard/settings', icon: GearSix, roles: ['BUSINESS_ADMIN'] },
    { label: 'Platform drivers', to: '/dashboard/platform-drivers', icon: IdentificationBadge, roles: ['SUPER_ADMIN'] },
];

function NavList({ role, collapsed }: { role: UserRole; collapsed: boolean }) {
    return (
        <nav aria-label="Dashboard" className="flex flex-col gap-1">
            {items
                .filter((i) => !i.roles || i.roles.includes(role))
                .map(({ label, to, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `body-5 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-300 ease-brand ${isActive ? 'bg-surface-4 text-fg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                            }`
                        }
                    >
                        <Icon size={20} aria-hidden="true" className="shrink-0" />
                        <span className={collapsed ? 'sr-only' : ''}>{label}</span>
                    </NavLink>
                ))}
        </nav>
    );
}

interface Props {
    role: UserRole;
    collapsed: boolean;
    onToggleCollapsed: () => void;
    mobileOpen: boolean;
    onCloseMobile: () => void;
}

export function Sidebar({ role, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: Props) {
    const reduce = useReducedMotion();
    return (
        <>
            <aside
                className={`hidden shrink-0 flex-col gap-6 border-r border-surface-5 bg-surface-1 p-3 md:flex ${collapsed ? 'w-16' : 'w-64'}`}
            >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
                    {!collapsed && <Logo />}
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="rounded-lg p-2 transition-colors duration-300 ease-brand hover:bg-surface-4"
                    >
                        <SidebarSimple size={20} aria-hidden="true" />
                    </button>
                </div>
                <NavList role={role} collapsed={collapsed} />
            </aside>

            <AnimatePresence>
                {mobileOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <motion.div
                            className="absolute inset-0 bg-surface-0/80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: EASE_BRAND }}
                            onClick={onCloseMobile}
                        />
                        <motion.aside
                            className="absolute inset-y-0 left-0 flex w-64 flex-col gap-6 border-r border-surface-5 bg-surface-1 p-3"
                            initial={reduce ? { opacity: 0 } : { x: '-100%' }}
                            animate={reduce ? { opacity: 1 } : { x: 0 }}
                            exit={reduce ? { opacity: 0 } : { x: '-100%' }}
                            transition={{ duration: 0.5, ease: EASE_BRAND }}
                        >
                            <div className="flex items-center justify-between px-1">
                                <Logo />
                                <button type="button" onClick={onCloseMobile} aria-label="Close menu" className="rounded-lg p-2 hover:bg-surface-4">
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>
                            <NavList role={role} collapsed={false} />
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}