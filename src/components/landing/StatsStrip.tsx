import { Reveal } from '@/components/common/Reveal';
import { stats, testimonial } from '@/content/landing';

export function StatsStrip() {
  return (
    <section className="px-4 pb-24" aria-label="Results">
      <Reveal className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-surface-5 bg-surface-2 p-6">
            <p className="heading-4">{s.value}</p>
            <p className="body-6 text-fg-muted">{s.label}</p>
          </div>
        ))}
        <figure className="flex flex-col gap-2 rounded-2xl border border-surface-5 bg-surface-2 p-6">
          <blockquote className="body-6">{testimonial.quote}</blockquote>
          <figcaption className="caption-2 text-fg-muted">{testimonial.name}, {testimonial.role}</figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
