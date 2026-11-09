import { Check, Circle } from '@phosphor-icons/react';
import { passwordRules, passwordScore } from '@/lib/password';
import { cn } from '@/lib/utils';

const barColor = ['bg-surface-5', 'bg-status-urgent', 'bg-status-break', 'bg-status-break', 'bg-status-available'];

export function PasswordMeter({ value }: { value: string }) {
    const score = passwordScore(value);
    return (
        <div className="flex flex-col gap-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
                {passwordRules.map((rule, i) => (
                    <span
                        key={rule.id}
                        className={cn('h-1 flex-1 rounded-full transition-colors duration-300 ease-brand', i < score ? barColor[score] : 'bg-surface-5')}
                    />
                ))}
            </div>
            <ul className="grid grid-cols-2 gap-1">
                {passwordRules.map((rule) => {
                    const ok = rule.test(value);
                    const Icon = ok ? Check : Circle;
                    return (
                        <li key={rule.id} className={cn('caption-2 flex items-center gap-1', ok ? 'text-status-available' : 'text-fg-muted')}>
                            <Icon size={12} weight={ok ? 'bold' : 'regular'} aria-hidden="true" />
                            {rule.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}