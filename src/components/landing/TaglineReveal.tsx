import { useEffect, useRef } from 'react';
import { tagline } from '@/content/landing';

/** Words go from muted to full colour one at a time as they cross a trigger line (SKILL B11). */
export function TaglineReveal() {
  const root = useRef<HTMLParagraphElement>(null);
  const words = tagline.split(' ');

  useEffect(() => {
    const spans = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-word]') ?? []);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((s) => (s.dataset.on = 'true'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.on = 'true';
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -40% 0px' },
    );
    spans.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <section className="px-4 py-24" aria-label="Our promise">
      <p ref={root} className="heading-2 mx-auto max-w-[680px]">
        {words.map((w, i) => (
          <span
            key={i}
            data-word
            className="text-fg/30 transition-colors duration-500 ease-brand data-[on=true]:text-fg"
          >
            {w}{' '}
          </span>
        ))}
      </p>
    </section>
  );
}
