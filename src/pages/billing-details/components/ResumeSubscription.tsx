import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/GlobalModal/ConfirmationModal';
import { RESUME_RESULT, useResumeSubscription } from '../../../modules/billings';
import { refreshSubscription } from '../../../lib/auth/auth';

/** What the borrower is told before resuming. */
export const RESUME_CONFIRM_MESSAGE =
  'Billing continues on your current plan. If your billing period has already ended, you will be asked to pay the next invoice first.';

type Props = {
  /** Reload the page's billing data once the subscription is active again. */
  onResumed: () => void;
};

/**
 * BUG-069: Resume a cancelled subscription. Active again at once, or - once
 * the period has ended - the invoice to pay first, which reactivates it.
 */
export default function ResumeSubscription({ onResumed }: Props) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const resume = useResumeSubscription();

  const handleConfirm = () => {
    resume.mutate(undefined, {
      onSuccess: async (result) => {
        setConfirming(false);

        if (result.status === RESUME_RESULT.PAYMENT_REQUIRED && result.invoice_id) {
          toast.info(result.message);
          navigate(`/invoices/${result.invoice_id}`);
          return;
        }

        toast.success(result.message);
        // The guard and the menu read the stored status: unlock them now.
        await refreshSubscription();
        onResumed();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to resume the subscription.');
      },
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-soft-success px-3 py-1.5 fs-12 fw-semibold d-inline-flex align-items-center gap-1"
        onClick={() => setConfirming(true)}
      >
        <i className="ri-refresh-line"></i> Resume Subscription
      </button>

      <ConfirmationModal
        show={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        title="Resume Subscription?"
        message={RESUME_CONFIRM_MESSAGE}
        confirmText="Yes, Resume"
        cancelText="Not Now"
        loading={resume.isPending}
        loadingText="Resuming..."
        iconClass="ri-refresh-line"
        iconBgClass="bg-success-subtle"
        iconTextClass="text-success"
        confirmBtnClass="btn-success"
      />
    </>
  );
}
