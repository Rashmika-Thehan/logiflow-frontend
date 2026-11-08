import { CaretDown } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Reveal } from '@/components/common/Reveal';
import { faqs } from '@/content/landing';
import { EASE_BRAND } from '@/lib/utils';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-24 px-4 pb-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
        <Reveal><h2 className="heading-2">Questions teams ask before they start</h2></Reveal>
        <div className="flex flex-col gap-2">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="rounded-2xl border border-surface-5 bg-surface-2">
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="title-3 flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left">
                    {f.q}
                    <CaretDown size={20} aria-hidden="true" className={`shrink-0 transition-transform duration-500 ease-brand ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`faq-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE_BRAND }}>
                      <p className="body-3 px-4 pb-4 text-fg-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
