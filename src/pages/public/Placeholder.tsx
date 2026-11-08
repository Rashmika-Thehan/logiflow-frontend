import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Placeholder({ title, note }: { title: string; note: string }) {
  const { trackingCode } = useParams();
  return (
    <section className="px-4 pb-24 pt-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4">
        <h1 className="heading-3">{title}</h1>
        {trackingCode && <p className="body-2">Tracking code {trackingCode}</p>}
        <p className="body-3 text-fg-muted">{note}</p>
        <Button asChild variant="secondary"><Link to="/">Back to home</Link></Button>
      </div>
    </section>
  );
}
