"use client";

import { Loader2, Megaphone, Share2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export function isSandboxEnvironment(env?: string) {
  const normalized = (env || process.env.NEXT_PUBLIC_CASHFREE_ENV || "SANDBOX").toLowerCase();
  return normalized !== "production";
}

type Props = {
  amount: number;
  loading?: boolean;
  paymentEnvironment?: string;
  variant?: "inline" | "modal";
  onPromote: () => void;
  onSubmitWithoutPromotion: () => void;
};

export default function PromotionChoiceOptions({
  amount,
  loading = false,
  paymentEnvironment,
  variant = "inline",
  onPromote,
  onSubmitWithoutPromotion,
}: Props) {
  const { t } = useLanguage();
  const showSandboxHint = isSandboxEnvironment(paymentEnvironment);
  const isModal = variant === "modal";

  return (
    <div
      className={
        isModal
          ? ""
          : "mt-4 rounded-2xl border border-[#22409a]/15 bg-white p-4 shadow-[0_8px_24px_rgba(34,64,154,0.08)]"
      }
    >
      <div className={`flex items-start gap-3 ${isModal ? "mx-auto mb-4 justify-center" : ""}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#22409a]/10">
          <Megaphone className="h-5 w-5 text-[#22409a]" />
        </div>
        <div className={isModal ? "text-center" : "min-w-0 flex-1"}>
          <h3 className="text-base font-extrabold text-[#16264f]">
            {t("promotionModalTitle", "Boost Your Work Post")}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {t(
              "promotionModalSubtitle",
              "Reach more workers faster with Apna Rojgar promotion.",
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-3 rounded-xl border border-[#22409a]/15 bg-[#f0f7ff] p-3">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[#22409a]" />
        <p className="text-left text-sm leading-relaxed text-slate-600">
          {t(
            "promotionModalBenefit",
            "We will promote your work requirement on our official social media pages, Facebook groups, WhatsApp communities, and other platforms to help you find workers quickly.",
          )}
        </p>
      </div>

      {showSandboxHint ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-relaxed text-amber-950">
          <p className="font-bold">{t("cashfreeSandboxTitle", "Test mode — sandbox payments")}</p>
          <p className="mt-1.5">
            {t(
              "cashfreeSandboxUpiHint",
              "Real UPI IDs and QR scans do not work in sandbox. On the Cashfree page, open Pay by UPI ID and use:",
            )}
          </p>
          <p className="mt-2 font-mono font-semibold text-emerald-800">testsuccess@gocash</p>
          <p className="mt-2 text-amber-900/90">
            {t(
              "cashfreeSandboxCardHint",
              "Or choose Cards and use test card 4706131211212123, expiry 03/2028, CVV 123, OTP 111000.",
            )}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onPromote}
        disabled={loading}
        className="mt-4 w-full rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100/80 disabled:opacity-70"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200">
            <Share2 className="h-4 w-4 text-emerald-800" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[#16264f]">
              {t("promotionOptionPromoteTitle", "Yes, Promote My Work")}
            </span>
            <span className="mt-1 block text-xs text-slate-600">
              {t(
                "promotionOptionPromoteDesc",
                "Get featured on Apna Rojgar social media, Facebook groups & more.",
              )}
            </span>
            <span className="mt-2 inline-flex rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
              ₹{amount}
            </span>
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={onSubmitWithoutPromotion}
        disabled={loading}
        className="mt-3 w-full rounded-xl border border-[#22409a]/15 bg-[#f8faff] p-4 text-left transition hover:bg-[#eef3ff] disabled:opacity-70"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#22409a]/10">
            <span className="text-sm font-bold text-[#22409a]">✓</span>
          </span>
          <span>
            <span className="block text-sm font-extrabold text-[#16264f]">
              {t("promotionOptionSkipTitle", "Post Without Promotion")}
            </span>
            <span className="mt-1 block text-xs text-slate-600">
              {t(
                "promotionOptionSkipDesc",
                "Submit your work now. You can promote it later from My Works.",
              )}
            </span>
          </span>
        </div>
      </button>

      {loading ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("promotionProcessing", "Processing payment...")}
        </div>
      ) : null}
    </div>
  );
}
