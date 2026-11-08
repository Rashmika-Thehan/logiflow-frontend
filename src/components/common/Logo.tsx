import { motion, useReducedMotion } from 'framer-motion';
import { EASE_BRAND } from '@/lib/utils';

export function Logo() {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#FFFFFF" />
        <motion.path
          d="M9 21V11l7 5 7-5v10"
          fill="none"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: EASE_BRAND }}
        />
      </svg>
      <span className="title-2">LogiFlow</span>
    </span>
  );
}
