import { LockKey, Password, Target, UsersThree } from '@phosphor-icons/react';
import { Reveal } from '@/components/common/Reveal';
import { benefits } from '@/content/landing';

const icons = { target: Target, lock: LockKey, password: Password, users: UsersThree };

export function Benefits() {
  return (
    <section id="features" className="scroll-mt-24 px-4 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <Reveal className="flex max-w-[680px] flex-col gap-3">
          <h2 className="heading-2">Dispatch decisions made in the time it takes to read them</h2>
          <p className="body-3 text-fg-muted">
            Four parts of the platform that remove manual phone calls from your delivery day.
          </p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((b, i) => {
            const Icon = icons[b.icon];
            return (
              <Reveal key={b.title} delay={i * 0.06}>
                <article className="flex h-full flex-col gap-4 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                  <span className="w-fit rounded-lg bg-surface-4 p-2">
                    <Icon size={24} weight="regular" aria-hidden="true" />
                  </span>
                  <h3 className="heading-6">{b.title}</h3>
                  <p className="body-3 text-fg-muted">{b.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
