import gsap from 'gsap';
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DispatchPreview } from './DispatchPreview';

const CODE = /^LF-[A-Z0-9]+$/i;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-elem', { y: 32, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'expo.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  const onTrack = (e: FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!CODE.test(value)) {
      setError('Tracking codes start with LF and a dash, followed by letters and numbers.');
      return;
    }
    navigate(`/track/${value.toUpperCase()}`);
  };

  return (
    <section ref={root} className="px-4 pb-24 pt-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="flex flex-col gap-6">
          <h1
            className="hero-elem heading-1 max-w-[680px] bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #FFFFFF, #9B9B9B)' }}
          >
            Match every parcel
            <br className="hidden md:inline" /> to the right driver
            <br className="hidden md:inline" /> in seconds
          </h1>
          <p className="hero-elem body-3 max-w-[680px] text-fg-muted">
            LogiFlow scores every available driver on distance, vehicle capacity and shift status, offers the job, and
            follows the parcel until the recipient confirms with a four digit code.
          </p>
          <div className="hero-elem flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">Start free trial</Link>
            </Button>
            <p className="caption-2 text-fg-muted">14 day trial for logistics teams</p>
          </div>
          <form onSubmit={onTrack} noValidate className="hero-elem flex max-w-md flex-col gap-2">
            <label htmlFor="hero-track" className="caption-1 text-fg-muted">
              Have a tracking code?
            </label>
            <div className="flex gap-2">
              <Input
                id="hero-track"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="Enter your tracking code"
                aria-invalid={!!error}
                aria-describedby={error ? 'hero-track-error' : undefined}
              />
              <Button type="submit" variant="secondary" size="sm">
                Track
              </Button>
            </div>
            {error && (
              <p id="hero-track-error" role="alert" className="caption-2 text-status-urgent">
                {error}
              </p>
            )}
          </form>
        </div>
        <div className="hero-elem">
          <DispatchPreview />
        </div>
      </div>
    </section>
  );
}
