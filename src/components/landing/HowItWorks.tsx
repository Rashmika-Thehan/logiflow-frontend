import { Reveal } from '@/components/common/Reveal';
import { steps } from '@/content/landing';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <Reveal>
          <h2 className="heading-2 max-w-[680px]">From new shipment to signed delivery in three steps</h2>
        </Reveal>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="flex h-full flex-col gap-2 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                  <p className="caption-1 text-fg-muted">Step {i + 1}</p>
                  <h3 className="heading-6">{s.title}</h3>
                  <p className="body-3 text-fg-muted">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
