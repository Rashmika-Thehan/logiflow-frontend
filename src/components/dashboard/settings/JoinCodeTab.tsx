import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowClockwise, Check, Copy, Prohibit, QrCode } from '@phosphor-icons/react';
import { joinCodeApi } from '@/api/org.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function JoinCodeTab() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [rotateModalOpen, setRotateModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const { data: codeData, isPending } = useQuery({
    queryKey: ['join-code'],
    queryFn: joinCodeApi.get,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['join-code'] });

  const rotateMutation = useMutation({
    mutationFn: joinCodeApi.rotate,
    onSuccess: (data) => {
      setRotateModalOpen(false);
      setNotice({ tone: 'ok', text: `New join code generated: ${data.joinCode}` });
      void invalidate();
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to rotate code.') }),
  });

  const disableMutation = useMutation({
    mutationFn: joinCodeApi.disable,
    onSuccess: () => {
      setDisableModalOpen(false);
      setNotice({ tone: 'ok', text: 'Organization join code has been disabled.' });
      void invalidate();
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to disable code.') }),
  });

  const handleCopy = () => {
    if (!codeData?.joinCode) return;
    void navigator.clipboard.writeText(codeData.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isEnabled = codeData?.enabled && !!codeData?.joinCode;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="heading-5">Organization Join Code</h2>
        <p className="body-6 text-fg-muted">
          Give this 8-character code to your drivers and dispatchers so they can register through the public /join portal.
        </p>
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
        <div className="h-44 w-full rounded-2xl border border-surface-5 bg-surface-2 animate-pulse" />
      ) : (
        <div className="flex flex-col gap-6 rounded-2xl border border-surface-5 bg-surface-2 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-5 bg-surface-3">
                <QrCode size={22} className="text-fg" />
              </div>
              <div>
                <p className="caption-1 text-fg-muted">Active Join Code</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-status-available' : 'bg-fg-muted'}`} />
                  <span className="caption-2 font-medium">{isEnabled ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            {isEnabled && (
              <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? <Check size={16} className="text-status-available" /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Code'}
              </Button>
            )}
          </div>

          {isEnabled ? (
            <div className="flex items-center justify-center rounded-xl border border-surface-5 bg-surface-1 p-6 font-mono tracking-widest text-3xl font-semibold text-fg">
              {codeData.joinCode}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-5 p-8 text-center">
              <Prohibit size={32} className="text-fg-muted" />
              <p className="title-3">No active join code</p>
              <p className="caption-1 text-fg-muted">
                Public applicants cannot submit requests until a join code is generated.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-5 pt-4">
            <p className="caption-1 text-fg-muted">
              Applicants using this code will appear in your <strong>Team &gt; Pending Join Requests</strong> queue for admin approval.
            </p>

            <div className="flex items-center gap-2">
              {isEnabled ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisableModalOpen(true)}
                    className="text-status-urgent hover:bg-status-urgent/10"
                  >
                    Disable Code
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRotateModalOpen(true)}
                    className="gap-1.5"
                  >
                    <ArrowClockwise size={16} />
                    Rotate Code
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => rotateMutation.mutate()}
                  disabled={rotateMutation.isPending}
                  className="gap-1.5"
                >
                  <ArrowClockwise size={16} />
                  {rotateMutation.isPending ? 'Generating...' : 'Generate Join Code'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rotate Confirmation Modal */}
      <Modal
        open={rotateModalOpen}
        onClose={() => setRotateModalOpen(false)}
        title="Rotate Organization Join Code"
      >
        <div className="flex flex-col gap-4">
          <p className="body-5">
            Generating a new join code will <strong className="text-status-urgent">immediately invalidate</strong> the current code ({codeData?.joinCode}).
          </p>
          <p className="body-6 text-fg-muted">
            Any unverified applicants with the old code will need to be provided with the new code.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRotateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={rotateMutation.isPending}
              onClick={() => rotateMutation.mutate()}
            >
              {rotateMutation.isPending ? 'Rotating...' : 'Confirm & Rotate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disable Confirmation Modal */}
      <Modal
        open={disableModalOpen}
        onClose={() => setDisableModalOpen(false)}
        title="Disable Join Code"
      >
        <div className="flex flex-col gap-4">
          <p className="body-5">
            Are you sure you want to disable the join code? New applicants will not be able to apply to your organization via the join portal until you re-enable it.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDisableModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10"
              disabled={disableMutation.isPending}
              onClick={() => disableMutation.mutate()}
            >
              {disableMutation.isPending ? 'Disabling...' : 'Disable Code'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
