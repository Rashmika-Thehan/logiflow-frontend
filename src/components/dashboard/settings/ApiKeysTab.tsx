import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Copy, Key, Plus, ShieldCheck, Warning } from '@phosphor-icons/react';
import { apiKeysApi } from '@/api/org.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/format';
import type { ApiKeyItem, CreatedApiKey } from '@/types';

const keySchema = z.object({
  name: z.string().trim().min(2, 'Enter a recognizable name for this key.'),
  readScope: z.boolean(),
  writeScope: z.boolean(),
  allowedIps: z.string().optional(),
});
type FormValues = z.infer<typeof keySchema>;

export function ApiKeysTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [revokingKey, setRevokingKey] = useState<ApiKeyItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const { data: apiKeys = [], isPending } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['api-keys'] });

  const revokeMutation = useMutation({
    mutationFn: apiKeysApi.revoke,
    onSuccess: () => {
      setRevokingKey(null);
      setNotice({ tone: 'ok', text: 'API key revoked.' });
      void invalidate();
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to revoke key.') }),
  });

  const handleCopyNewKey = () => {
    if (!createdKey?.apiKey) return;
    void navigator.clipboard.writeText(createdKey.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-5">Developer API Keys</h2>
          <p className="body-6 text-fg-muted">
            Programmatically ingest orders, create shipments, and query fleet tracking via REST.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          Create API Key
        </Button>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-xl border p-3 body-6 ${
            notice.tone === 'ok'
              ? 'border-status-available/40 bg-status-available/10 text-status-available'
              : 'border-status-urgent/40 bg-status-urgent/10 text-status-urgent'
          }`}
        >
          {notice.text}
        </div>
      )}

      {isPending ? (
        <div className="h-36 rounded-2xl border border-surface-5 bg-surface-2 animate-pulse" />
      ) : apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-5 p-12 text-center">
          <Key size={36} className="text-fg-muted" aria-hidden="true" />
          <div>
            <p className="title-2">No API keys created yet</p>
            <p className="body-6 text-fg-muted">
              Generate credentials to connect your ERP, Shopify store, or custom warehouse software.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} variant="secondary" className="gap-2">
            <Plus size={16} />
            Create API Key
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-surface-5 bg-surface-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-5 bg-surface-3/50 caption-1 text-fg-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Key Prefix</th>
                  <th className="px-4 py-3 font-medium">Scopes</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Last Used</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-5 body-6">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-surface-3/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-fg">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-fg-muted">
                      {k.keyPrefix}••••••••
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span key={s} className="caption-2 rounded-md border border-surface-5 bg-surface-3 px-2 py-0.5">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{formatDate(k.createdAt)}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      {k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!k.revokedAt ? (
                        <button
                          type="button"
                          onClick={() => setRevokingKey(k)}
                          className="caption-1 text-status-urgent hover:underline"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="caption-2 text-fg-muted italic">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      <CreateKeyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(key) => {
          setCreateOpen(false);
          setCreatedKey(key);
          void invalidate();
        }}
      />

      {/* Secret Key Revealed Modal */}
      <Modal
        open={!!createdKey}
        onClose={() => setCreatedKey(null)}
        title="API Key Created"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-status-break/40 bg-status-break/10 p-4 text-status-break">
            <Warning size={22} className="shrink-0" />
            <p className="caption-1">
              Please copy your API key now. For security purposes, <strong>you will not be able to see it again</strong> after closing this dialog.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="caption-1 text-fg-muted">Raw Secret Key</span>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-surface-5 bg-surface-1 p-3 font-mono text-sm break-all">
              <span>{createdKey?.apiKey}</span>
              <Button size="sm" variant="secondary" onClick={handleCopyNewKey} className="shrink-0 gap-1.5">
                {copied ? <Check size={16} className="text-status-available" /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setCreatedKey(null)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal
        open={!!revokingKey}
        onClose={() => setRevokingKey(null)}
        title="Revoke API Key"
      >
        <div className="flex flex-col gap-4">
          <p className="body-5">
            Are you sure you want to revoke <strong className="text-fg">{revokingKey?.name}</strong>?
            New token exchanges with this key will be rejected. Access tokens already issued remain valid for up to one hour.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRevokingKey(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10"
              disabled={revokeMutation.isPending}
              onClick={() => revokingKey && revokeMutation.mutate(revokingKey.id)}
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CreateKeyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (key: CreatedApiKey) => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(keySchema),
    defaultValues: {
      name: '',
      readScope: true,
      writeScope: true,
      allowedIps: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMsg('');
    const scopes: string[] = [];
    if (values.readScope) scopes.push('shipments:read');
    if (values.writeScope) scopes.push('shipments:write');

    if (scopes.length === 0) {
      setErrorMsg('Please select at least one permission scope.');
      return;
    }

    const allowedIps = values.allowedIps
      ? values.allowedIps
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      const res = await apiKeysApi.create({
        name: values.name,
        scopes,
        allowedIps,
      });
      reset();
      onCreated(res);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create API key.'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create API Key">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {errorMsg && (
          <p role="alert" className="caption-2 text-status-urgent">
            {errorMsg}
          </p>
        )}

        <Field label="Key Name / Identifier" error={errors.name?.message}>
          <Input placeholder="e.g. ERP Order Ingestion" {...register('name')} />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="caption-1">Permission Scopes</span>
          <div className="flex flex-col gap-2 rounded-xl border border-surface-5 bg-surface-3/40 p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="rounded border-surface-5" {...register('readScope')} />
              <div>
                <p className="caption-1 font-medium">shipments:read</p>
                <p className="caption-2 text-fg-muted">Read parcel states and view trip tracking.</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="rounded border-surface-5" {...register('writeScope')} />
              <div>
                <p className="caption-1 font-medium">shipments:write</p>
                <p className="caption-2 text-fg-muted">Create parcels and look up pickup depots.</p>
              </div>
            </label>
          </div>
        </div>

        <Field label="IP Allowlist (optional)">
          <Input
            placeholder="Comma separated IPs, e.g. 192.168.1.1, 10.0.0.1"
            {...register('allowedIps')}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <ShieldCheck size={18} />
            {isSubmitting ? 'Creating...' : 'Create Key'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
