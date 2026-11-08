import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

const roads = ['M20 60 H380', 'M20 130 H380', 'M20 200 H380', 'M80 20 V230', 'M200 20 V230', 'M320 20 V230'];
const dots = [
  { x: 80, y: 60, color: '#34D399', dx: 120, dy: 0 },
  { x: 320, y: 130, color: '#60A5FA', dx: -120, dy: 0 },
  { x: 200, y: 200, color: '#FBBF24', dx: 0, dy: -70 },
];
const candidates = [
  { name: 'Driver 07', meta: '2.4 km, van, 800 kg', score: '91.4' },
  { name: 'Driver 12', meta: '3.9 km, sedan, 450 kg', score: '86.2' },
  { name: 'Driver 03', meta: '5.1 km, van, 650 kg', score: '78.9' },
];

export function DispatchPreview() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGGElement>('.fleet-dot').forEach((el, i) => {
        const d = dots[i];
        gsap.to(el, { x: d.dx, y: d.dy, duration: 6 + i * 1.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
      });
      gsap.to('.fleet-ring', {
        scale: 2.6,
        opacity: 0,
        duration: 1.8,
        ease: 'expo.out',
        repeat: -1,
        transformOrigin: '50% 50%',
        stagger: 0.4,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="rounded-2xl border border-surface-5 bg-surface-2 p-2">
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-surface-5 bg-surface-0">
          <svg
            viewBox="0 0 400 250"
            className="block h-auto w-full"
            role="img"
            aria-label="Map showing three drivers moving along city streets"
          >
            {roads.map((d) => (
              <path key={d} d={d} stroke="#313131" strokeWidth="2" fill="none" />
            ))}
            {dots.map((d, i) => (
              <g key={i} transform={`translate(${d.x} ${d.y})`}>
                <g className="fleet-dot">
                  <circle className="fleet-ring" r="6" fill={d.color} opacity="0.5" />
                  <circle r="6" fill={d.color} />
                </g>
              </g>
            ))}
            <g transform="translate(260 60)">
              <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#F87171" />
            </g>
          </svg>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-surface-5 bg-surface-3 p-3">
          <p className="caption-1 text-fg-muted">Candidates for the urgent parcel</p>
          {candidates.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between gap-2 border-t border-surface-5 pt-2 first-of-type:border-t-0"
            >
              <div>
                <p className="title-4">{c.name}</p>
                <p className="caption-5 text-fg-muted">{c.meta}</p>
              </div>
              <p className="body-4 text-status-available">{c.score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
