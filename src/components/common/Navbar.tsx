import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';
import { navLinks } from '@/content/landing';
import { EASE_BRAND } from '@/lib/utils';

function MenuToggle({ open }: { open: boolean }) {
  const t = { duration: 0.5, ease: EASE_BRAND };
  return (
    <span className="relative block h-6 w-6" aria-hidden="true">
      <motion.span
        className="absolute left-0 top-1/2 block h-0.5 w-6 bg-fg"
        animate={{ y: open ? 0 : -4, rotate: open ? 45 : 0 }}
        transition={t}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-0.5 w-6 bg-fg"
        animate={{ y: open ? 0 : 4, rotate: open ? -45 : 0 }}
        transition={t}
      />
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <nav
        aria-label="Main"
        className="flex w-full max-w-4xl items-center justify-between gap-4 rounded-2xl border border-surface-5 bg-surface-2/70 p-2 backdrop-blur-md"
      >
        <Link
          to="/"
          className="rounded-lg px-2 py-1"
          aria-label="LogiFlow home"
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.href.startsWith('/#') ? (
                <a
                  href={link.href}
                  className="body-5 rounded-lg px-3 py-2 text-fg-muted transition-colors duration-300 ease-brand hover:text-fg"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  to={link.href}
                  className={({ isActive }) =>
                    `body-5 rounded-lg px-3 py-2 transition-colors duration-300 ease-brand hover:text-fg ${isActive ? 'bg-surface-4 text-fg' : 'text-fg-muted'}`
                  }
                >
                  {link.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Get started</Link>
          </Button>
          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuToggle open={open} />
          </button>
        </div>
      </nav>

      {open && (
        <motion.div
          id="mobile-menu"
          className="fixed inset-0 -z-10 flex flex-col gap-2 bg-surface-0/95 px-4 pt-24 backdrop-blur-xl md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE_BRAND }}
        >
          {[...navLinks, { label: 'Sign in', href: '/login' }].map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_BRAND, delay: Math.min(i * 0.06, 0.4) }}
            >
              <a href={link.href} onClick={() => setOpen(false)} className="heading-5 block rounded-lg py-3">
                {link.label}
              </a>
            </motion.div>
          ))}
        </motion.div>
      )}
    </header>
  );
}
