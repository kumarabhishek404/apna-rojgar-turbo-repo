"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import ServiceDetailsView, {
  type WebServiceApplyPayload,
} from "@/components/webapp/ServiceDetailsView";

const APPLY_SECTION_SCROLL_ID = "webapp-service-apply-section";

export type ServiceDetailsModalProps = {
  open: boolean;
  serviceId: string | null;
  onClose: () => void;
  canApply?: boolean;
  applying?: boolean;
  /** When true, scrolls the modal body to the apply block after details load. */
  scrollToApply?: boolean;
  onApply?: (payload: WebServiceApplyPayload) => Promise<void> | void;
  onAppliedMutation?: () => void;
};

export default function ServiceDetailsModal({
  open,
  serviceId,
  onClose,
  canApply = false,
  applying = false,
  scrollToApply = false,
  onApply,
  onAppliedMutation,
}: ServiceDetailsModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open || !scrollToApply || !serviceId) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;
    /** DOM timer handles are `number` in the browser; avoid `ReturnType<typeof setTimeout>` (Node types use `Timeout`). */
    const timeoutIds: number[] = [];

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(APPLY_SECTION_SCROLL_ID);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        timeoutIds.push(window.setTimeout(tryScroll, 80));
      }
    };

    const startId = window.requestAnimationFrame(() => {
      timeoutIds.push(window.setTimeout(tryScroll, 60));
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startId);
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [open, scrollToApply, serviceId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && serviceId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#f7f9ff] to-[#eef3ff] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#22409a]/80">
                  {t("serviceDetails", "Service Details")}
                </p>
                <h3 className="text-base font-bold text-[#16264f]">{t("viewDetails")}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("close", "Close")}
              </button>
            </div>
            <div className="max-h-[calc(92vh-4.25rem)] overflow-y-auto p-4 md:p-5">
              <ServiceDetailsView
                id={serviceId}
                canApply={canApply}
                applying={applying}
                onApply={onApply}
                onAppliedMutation={onAppliedMutation}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
