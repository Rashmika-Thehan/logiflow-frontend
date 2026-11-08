import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Shared easing for every transition (SKILL B7). */
export const EASE_BRAND = [0.22, 1, 0.36, 1] as const;
