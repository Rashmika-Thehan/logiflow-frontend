import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="heading-3">This route is off the map</h1>
      <p className="body-3 max-w-[680px] text-fg-muted">
        The page you asked for does not exist or has moved. Head back to the start and try again.
      </p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </main>
  );
}
