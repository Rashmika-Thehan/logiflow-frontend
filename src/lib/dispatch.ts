import type { PriorityTier } from '@/types';

const rank: Record<PriorityTier, number> = { URGENT: 0, EXPRESS: 1, STANDARD: 2 };
export const priorityRank = (p: PriorityTier) => rank[p];

/** Scores may arrive as 0 to 1 or 0 to 100. Show everything on a 0 to 100 scale. */
export const toPercent = (value: number) => Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));