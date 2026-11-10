import { PageShell } from '@/components/dashboard/PageShell';

/** Placeholder for dashboard sections that ship in their own branch. */
export default function SectionStub({ title }: { title: string }) {
    return (
        <PageShell title={title}>
            <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6">
                <p className="title-3">This screen is the next build step</p>
                <p className="body-6 text-fg-muted">The layout, navigation and live alerts around it are ready.</p>
            </div>
        </PageShell>
    );
}