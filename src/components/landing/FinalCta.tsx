import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section className="px-4 pb-24">
      <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 rounded-2xl border border-surface-5 bg-surface-2 p-6 md:p-10">
        <h2 className="heading-3 max-w-[680px]">Join our platform and start dispatching for free.!</h2>
        <p className="body-3 max-w-[680px] text-fg-muted">
          Create your organization, add a depot, and share your join code with drivers today.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/register">Start for free</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/driver/apply">Apply as driver</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
