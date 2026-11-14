import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Check, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (otp: string) => Promise<void>;
  recipientName?: string;
}

export function DeliveryOtpModal({ open, onClose, onConfirm, recipientName }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '']);
      setError('');
      setSubmitting(false);
      setTimeout(() => inputsRef.current[0]?.focus(), 150);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    const char = value.slice(-1).replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    if (char && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const fullOtp = digits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullOtp.length < 4) {
      setError('Please enter the full 4-digit code.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onConfirm(fullOtp);
      onClose();
    } catch {
      setError('Invalid delivery OTP. Please verify the code with the customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Verify Customer Delivery">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-2xl border border-surface-5 bg-surface-3/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-available/10 text-status-available">
            <ShieldCheck size={24} weight="fill" />
          </div>
          <div>
            <p className="body-6 font-semibold text-fg">
              {recipientName ? `Recipient: ${recipientName}` : 'Customer Signature'}
            </p>
            <p className="caption-2 text-fg-muted">
              Ask the recipient for their 4-digit verification code to complete the dropoff.
            </p>
          </div>
        </div>

        {/* 4 PIN Boxes */}
        <div className="flex justify-center gap-3 py-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-14 w-12 rounded-xl border border-surface-5 bg-surface-3 text-center text-2xl font-bold font-mono text-fg focus:border-fg focus:outline-none focus:ring-2 focus:ring-fg/20 transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-status-urgent/40 bg-status-urgent/10 p-3 text-xs text-status-urgent">
            <Warning size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || fullOtp.length < 4}
            className="flex-1 gap-1.5 font-semibold"
          >
            <Check size={16} weight="bold" />
            {submitting ? 'Verifying...' : 'Complete Dropoff'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
