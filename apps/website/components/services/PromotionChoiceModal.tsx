"use client";

import { X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PromotionChoiceOptions from "@/components/services/PromotionChoiceOptions";

type Props = {
  open: boolean;
  amount: number;
  loading?: boolean;
  paymentEnvironment?: string;
  onClose: () => void;
  onPromote: () => void;
  onSubmitWithoutPromotion: () => void;
};

export default function PromotionChoiceModal({
  open,
  amount,
  loading = false,
  paymentEnvironment,
  onClose,
  onPromote,
  onSubmitWithoutPromotion,
}: Props) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/50 bg-white p-6 shadow-[0_40px_120px_rgba(15,23,42,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          aria-label={t("close", "Close")}
        >
          <X className="h-5 w-5" />
        </button>

        <PromotionChoiceOptions
          amount={amount}
          loading={loading}
          paymentEnvironment={paymentEnvironment}
          variant="modal"
          onPromote={onPromote}
          onSubmitWithoutPromotion={onSubmitWithoutPromotion}
        />
      </div>
    </div>
  );
}
