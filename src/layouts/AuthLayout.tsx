import { ArrowLeft } from '@phosphor-icons/react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-surface-5 bg-surface-1 p-10 md:flex">
        <Link to="/">
          <Logo />
        </Link>
        <p className="heading-4 max-w-[680px]">Every parcel finds the right driver.</p>
      </aside>
      <main className="flex flex-col justify-center gap-6 px-4 py-12 md:px-10">
        <Link to="/" className="body-5 inline-flex w-fit items-center gap-2 text-fg-muted hover:text-fg">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
