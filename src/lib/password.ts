export const passwordRules = [
    { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { id: 'lower', label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
    { id: 'digit', label: 'One number', test: (v: string) => /\d/.test(v) },
] as const;

export const passwordScore = (value: string) => passwordRules.filter((r) => r.test(value)).length;
export const isStrongPassword = (value: string) => passwordScore(value) === passwordRules.length;