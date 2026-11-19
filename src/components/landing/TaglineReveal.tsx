import { useEffect, useRef } from 'react';
import { tagline } from '@/content/landing';
import { motion, useReducedMotion } from 'framer-motion';

/** Words go from muted to full colour one at a time as they cross a trigger line (SKILL B11). */
export function TaglineReveal() {
  const root = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const words = tagline.split(' ');
  let characterIndex = 0;

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
      <p ref={root} className="heading-2 mx-auto max-w-[980px]" aria-label={tagline}>
        {words.map((w, i) => (
          <span
            key={i}
            data-word
            aria-hidden="true"
            className={`inline-block whitespace-nowrap text-fg/30 transition-colors duration-500 ease-brand data-[on=true]:text-fg ${
              i < words.length - 1 ? 'mr-[0.25em]' : ''
            }`}
          >
            {Array.from(w).map((character) => {
              const seed = characterIndex++;
              const x = ((seed * 17) % 18) - 9;
              const y = ((seed * 11) % 16) - 8;
              const rotate = ((seed * 7) % 20) - 10;

              return (
                <motion.span
                  key={`${i}-${seed}`}
                  className="inline-block"
                  whileHover={reduceMotion ? undefined : { x, y, rotate, scale: 1.28 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  {character}
                </motion.span>
              );
            })}
          </span>
        ))}
      </p>
    </section>
  );
}
