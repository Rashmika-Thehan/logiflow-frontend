/** Some list endpoints return a bare array, others `{ data: [...] }`. Accept both. */
export const asArray = <T>(value: T[] | { data?: T[] } | undefined | null): T[] =>
    Array.isArray(value) ? value : (value?.data ?? []);