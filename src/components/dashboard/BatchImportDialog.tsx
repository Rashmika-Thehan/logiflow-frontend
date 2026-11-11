import { DownloadSimple, UploadSimple } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type DragEvent } from 'react';
import { getErrorMessage } from '@/api/client';
import { shipmentsApi } from '@/api/shipments.api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { downloadTextFile, shipmentTemplateCsv, toCsv } from '@/lib/csv';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = /\.(csv|xlsx|xls)$/i;

const validate = (file: File) => {
    if (!ACCEPTED.test(file.name)) return 'Choose a CSV or Excel file (.csv, .xlsx or .xls).';
    if (file.size > MAX_BYTES) return 'The file is over 10 MB. Split it into smaller files.';
    if (file.size === 0) return 'The file is empty.';
    return '';
};

export function BatchImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [dragging, setDragging] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);

    const upload = useMutation({
        mutationFn: (f: File) => shipmentsApi.batchImport(f),
        onSuccess: (job) => setJobId(job.batchImportJobId),
        onError: (err) => setFileError(getErrorMessage(err, 'The upload failed. Check your connection and try again.')),
    });

    const job = useQuery({
        queryKey: ['batch-import', jobId],
        queryFn: () => shipmentsApi.batchStatus(jobId as string),
        enabled: !!jobId,
        refetchInterval: (q) => (q.state.data?.status === 'COMPLETED' || q.state.data?.status === 'FAILED' ? false : 2000),
    });

    const status = job.data?.status;
    const finished = status === 'COMPLETED' || status === 'FAILED';

    useEffect(() => {
        if (finished) void queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }, [finished, queryClient]);

    const pick = (f: File | undefined) => {
        if (!f) return;
        const problem = validate(f);
        setFileError(problem);
        setFile(problem ? null : f);
    };

    const onDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files[0]);
    };

    const reset = () => {
        setFile(null);
        setFileError('');
        setJobId(null);
        upload.reset();
    };

    const total = job.data?.totalRows ?? 0;
    const processed = (job.data?.successCount ?? 0) + (job.data?.failureCount ?? 0);
    const pct = total ? Math.min(100, Math.round((processed / total) * 100)) : 0;
    const errors = job.data?.errorManifest ?? [];

    const downloadErrors = () =>
        downloadTextFile('import-errors.csv', toCsv([['row', 'problems'], ...errors.map((e) => [e.row, e.errors.join('; ')])]));

    return (
        <Modal open={open} onClose={onClose} title="Batch import shipments">
            {!jobId ? (
                <div className="flex flex-col gap-4">
                    <p className="body-6 text-fg-muted">
                        Upload a CSV or Excel file with up to 5,000 rows and 10 MB. Each row becomes one shipment.
                    </p>

                    <label
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center transition-colors duration-300 ease-brand has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg ${dragging ? 'border-fg bg-surface-3' : 'border-surface-5 bg-surface-3 hover:bg-surface-4'}`}
                    >
                        <UploadSimple size={32} aria-hidden="true" />
                        <span className="body-5">{file ? file.name : 'Drop a file here, or choose one'}</span>
                        <span className="caption-2 text-fg-muted">
                            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV, XLSX or XLS'}
                        </span>
                        <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
                    </label>

                    {fileError && (
                        <p role="alert" className="caption-2 text-status-urgent">
                            {fileError}
                        </p>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit"
                        onClick={() => downloadTextFile('shipments-template.csv', shipmentTemplateCsv)}
                    >
                        <DownloadSimple size={16} aria-hidden="true" />
                        Download the sample template
                    </Button>

                    <div className="flex gap-2">
                        <Button disabled={!file || upload.isPending} onClick={() => file && upload.mutate(file)}>
                            {upload.isPending ? 'Uploading' : 'Start import'}
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {job.isError ? (
                        <p role="alert" className="body-6 text-status-urgent">
                            We lost track of this import. Check the shipments list before trying again.
                        </p>
                    ) : !finished ? (
                        <>
                            <p className="body-5" role="status">
                                {status === 'PROCESSING' ? `Processing ${processed} of ${total} rows` : 'Waiting for the import to start'}
                            </p>
                            <div
                                className="h-2 overflow-hidden rounded-full bg-surface-4"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={pct}
                                aria-label="Import progress"
                            >
                                <div
                                    className="h-full origin-left rounded-full bg-fg transition-transform duration-500 ease-brand"
                                    style={{ transform: `scaleX(${pct / 100})` }}
                                />
                            </div>
                            <p className="caption-2 text-fg-muted">You can close this window. The import keeps running.</p>
                        </>
                    ) : status === 'FAILED' && !job.data?.successCount ? (
                        <p role="alert" className="body-6 text-status-urgent">
                            The import failed. Compare your file with the sample template and try again.
                        </p>
                    ) : (
                        <p className="title-3" role="status">
                            {job.data?.successCount ?? 0} shipments created
                            {(job.data?.failureCount ?? 0) > 0 ? `, ${job.data?.failureCount} rows need attention` : ''}.
                        </p>
                    )}

                    {finished && errors.length > 0 && (
                        <>
                            <div className="max-h-56 overflow-y-auto rounded-lg border border-surface-5">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="caption-1 border-b border-surface-5 text-fg-muted">
                                            <th scope="col" className="px-3 py-2">
                                                Row
                                            </th>
                                            <th scope="col" className="px-3 py-2">
                                                Problem
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {errors.map((e) => (
                                            <tr key={e.row} className="border-b border-surface-5 last:border-b-0">
                                                <td className="body-5 px-3 py-2">{e.row}</td>
                                                <td className="body-6 px-3 py-2">{e.errors.join(', ')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Button variant="ghost" size="sm" className="w-fit" onClick={downloadErrors}>
                                <DownloadSimple size={16} aria-hidden="true" />
                                Download the error report
                            </Button>
                        </>
                    )}

                    <div className="flex gap-2">
                        {finished && <Button onClick={onClose}>Done</Button>}
                        {(finished || job.isError) && (
                            <Button variant="secondary" onClick={reset}>
                                Import another file
                            </Button>
                        )}
                        {!finished && !job.isError && (
                            <Button variant="ghost" onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}