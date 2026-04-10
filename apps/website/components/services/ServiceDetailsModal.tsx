"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import ServiceDetailsView from "@/components/webapp/ServiceDetailsView";

export type ServiceDetailsModalProps = {
  open: boolean;
  serviceId: string | null;
  onClose: () => void;
  canApply?: boolean;
  applying?: boolean;
  selectedSkill?: string;
  onSkillChange?: (skill: string) => void;
  onApply?: (skill: string) => Promise<void> | void;
};

export default function ServiceDetailsModal({
  open,
  serviceId,
  onClose,
  canApply = false,
  applying = false,
  selectedSkill = "",
  onSkillChange,
  onApply,
}: ServiceDetailsModalProps) {
  const { t } = useLanguage();

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
                selectedSkill={selectedSkill}
                onSkillChange={onSkillChange}
                onApply={onApply}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
