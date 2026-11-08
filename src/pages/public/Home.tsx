import { Benefits } from '@/components/landing/Benefits';
import { Faq } from '@/components/landing/Faq';
import { FinalCta } from '@/components/landing/FinalCta';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { StatsStrip } from '@/components/landing/StatsStrip';
import { TaglineReveal } from '@/components/landing/TaglineReveal';

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <Benefits />
      <TaglineReveal />
      <HowItWorks />
      <Faq />
      <FinalCta />
    </>
  );
}
