import { ArrowLeft } from '@phosphor-icons/react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import authSideImage from '@/assets/login-register-side-image.png';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="relative hidden isolate overflow-hidden border-r border-surface-5 bg-surface-1 md:block">
        <img
          src={authSideImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[30%_65%]"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Link to="/">
            <Logo />
          </Link>
          <p className="heading-4 max-w-[680px]">Every parcel finds the right driver.</p>
        </div>
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
