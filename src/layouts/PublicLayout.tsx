import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Navbar } from '@/components/common/Navbar';

export function PublicLayout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-fg focus:px-3 focus:py-2 focus:text-surface-0">Skip to content</a>
      <Navbar />
      <main id="main"><Outlet /></main>
      <footer className="border-t border-surface-5 px-4 py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <Logo />
          <ul className="body-6 flex flex-wrap gap-4 text-fg-muted">
            <li><Link to="/track" className="hover:text-fg">Track a parcel</Link></li>
            <li><Link to="/login" className="hover:text-fg">Sign in</Link></li>
            <li><Link to="/privacy" className="hover:text-fg">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-fg">Terms</Link></li>
          </ul>
          <p className="caption-2 text-fg-muted">© 2026 LogiFlow</p>
        </div>
      </footer>
    </>
  );
}
