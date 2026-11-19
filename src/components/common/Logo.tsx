import { motion, useReducedMotion } from 'framer-motion';
import { EASE_BRAND } from '@/lib/utils';

const SWOOSH =
  'M11.5 64C12.1 63.6 13.9 62.4 15 61.6C16.1 60.8 17.2 59.8 18.3 59C19.4 58.2 20.6 57.4 21.7 56.6C22.8 55.8 23.9 55 25 54.3C26.1 53.6 27.2 52.9 28.3 52.2C29.4 51.5 30.6 50.9 31.7 50.3C32.8 49.7 33.9 49 35 48.5C36.1 48 37.2 47.5 38.3 47C39.4 46.5 40.6 46.1 41.7 45.8C42.8 45.4 43.9 45.1 45 44.9C46.1 44.6 47.3 44.5 48.3 44.3C49.3 44.1 50.4 44 50.8 43.9L50.8 44.4C49.8 44.8 46.5 45.9 45 46.7C43.5 47.5 42.6 48.4 41.5 49.3C40.4 50.2 39.4 51.6 38.3 52.3C37.2 53 36.1 52.9 35 53.3C33.9 53.6 32.8 54 31.7 54.4C30.6 54.8 29.4 55.2 28.3 55.6C27.2 56 26.1 56.5 25 57C23.9 57.5 22.8 58 21.7 58.6C20.6 59.2 19.4 59.8 18.3 60.4C17.2 61 16.1 61.7 15 62.3C13.9 62.9 12.1 63.7 11.5 64Z';

export function Logo() {
  const reduce = useReducedMotion();

  const draw = (delay = 0, duration = 0.9) => ({
    initial: { pathLength: reduce ? 1 : 0 },
    animate: { pathLength: 1 },
    transition: { duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: EASE_BRAND },
  });

  const fade = (delay = 0, x = 0, y = 0) => ({
    initial: { opacity: reduce ? 1 : 0, x: reduce ? 0 : x, y: reduce ? 0 : y },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: EASE_BRAND },
  });

  return (
    <span className="inline-flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="logo-pin" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="86">
            <stop offset="0" stopColor="#F8BE2C" />
            <stop offset="1" stopColor="#EE9F1B" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" rx="20" fill="#090707" />

        {/* Pin: ring draws in, then the tapered base fades up */}
        <motion.path
          d="M24.5 31.5A28 28 0 0 1 76.8 32.5"
          fill="none" stroke="url(#logo-pin)" strokeWidth="4.8"
          {...draw(0, 0.9)}
        />
        <motion.path
          d="M25.4 60.1L33.75 57.2C38 63.5 44 69.5 50 72C58 69 67 63.5 75 59.1C70 68 60 79 50 87.5C40 79 31 69 25.4 60.1Z"
          fill="url(#logo-pin)"
          {...fade(0.45, 0, 4)}
        />

        {/* Speed lines */}
        <g stroke="url(#logo-pin)" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <motion.path d="M11.9 36.2H36.5" {...draw(0.6, 0.4)} />
          <motion.path d="M16.3 42.4H32.1" {...draw(0.7, 0.4)} />
          <motion.path d="M10 48.5H26.2" {...draw(0.8, 0.4)} />
        </g>

        {/* Van, tail, road */}
        <motion.g {...fade(0.5, -6)}>
          {/* body */}
          <path d="M40.4 31.5H66.4Q68.2 31.5 67.8 33.2L62.9 51.6Q62.6 52.5 61.6 52.5H51.5V41.8L48.3 42.2L45 42.8L41.7 43.6L38.3 44.8L35.2 46Z" fill="#fff" stroke="#fff" strokeWidth="0.6" strokeLinejoin="round" />
          {/* cab + window */}
          <path d="M66 52.2L70 36Q70.4 34.2 72.5 34.2H77.5Q80.5 34.2 83 36.5L89.5 43.3Q91 45 91 47.5V51Q91 52.4 89.6 52.4H67Z" fill="#fff" stroke="#fff" strokeWidth="0.6" strokeLinejoin="round" />
          <path d="M71.4 43.7L72 37.8Q72.3 36.6 73.5 36.6H77.7Q79.5 36.6 81 38L86.4 43.7Z" fill="#090707" />
          {/* trailing swoosh */}
          <path d={SWOOSH} fill="#fff" />
          {/* road */}
          <path d="M42 63.4Q56 56 70.3 54.8Q57 57.7 42 63.4Z" fill="#fff" />
          <path d="M50.4 65.7L55.2 63.4M58 60.5L61.5 59.7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          {/* wheels */}
          {[45.4, 77.5].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="52.9" r="5.9" fill="#090707" />
              <circle cx={cx} cy="52.9" r="4.5" fill="#fff" />
            </g>
          ))}
        </motion.g>
      </svg>
      <span className="title-2">LogiFlow</span>
    </span>
  );
}