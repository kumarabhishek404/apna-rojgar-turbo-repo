"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shown on the confirm button while `onConfirm` is in flight. */
  pendingLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
};

/**
 * Reusable confirmation overlay (portal to `document.body`, above other modals).
 * Closes after `onConfirm` completes; keep errors non-throwing in `onConfirm` if the dialog should still close.
 */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const descId = useId();
  const [pending, setPending] = useState(false);

  const confirmText = confirmLabel ?? t("confirmAction", "Confirm");
  const cancelText = cancelLabel ?? t("cancel", "Cancel");
  const busyText = pendingLabel ?? t("pleaseWait", "Please wait…");

  useEffect(() => {
    if (!open) {
      setPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, pending]);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await Promise.resolve(onConfirm());
      onClose();
    } finally {
      setPending(false);
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!pending) onClose();
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-lg font-bold leading-snug text-[#16264f]">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleConfirm()}
                className={`inline-flex min-h-[44px] min-w-[7rem] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#22409a] hover:bg-[#1c3788]"
                }`}
              >
                {pending ? busyText : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
