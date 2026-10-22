"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Send, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  openWhatsappUserChat,
  whatsappChatUrl,
} from "@/lib/newUserWhatsappWelcome";

export type WhatsappComposerTemplate = {
  id: string;
  label: string;
  /** Returns the message text (WhatsApp markup such as *bold* is fine). */
  build: () => string;
};

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Admin WhatsApp composer: pick a pre-written template, tweak the text,
 * then open the recipient's chat with the message pre-filled (or copy it).
 */
export default function WhatsappComposerDialog({
  recipientName,
  countryCode,
  mobile,
  templates,
  initialTemplateId,
  onClose,
}: {
  recipientName?: string;
  countryCode?: string;
  mobile?: string;
  templates: WhatsappComposerTemplate[];
  initialTemplateId?: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const firstId =
    templates.find((item) => item.id === initialTemplateId)?.id ||
    templates[0]?.id ||
    "";
  const [templateId, setTemplateId] = useState(firstId);
  const [message, setMessage] = useState(
    () => templates.find((item) => item.id === firstId)?.build() ?? "",
  );
  const [copied, setCopied] = useState(false);

  const chat = useMemo(
    () => whatsappChatUrl(countryCode, mobile, message),
    [countryCode, mobile, message],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    setMessage(templates.find((item) => item.id === id)?.build() ?? "");
  };

  const handleCopy = async () => {
    if (!(await copyToClipboard(message))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    if (openWhatsappUserChat(countryCode, mobile, message)) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("sendWhatsappMessage", "Send WhatsApp message")}
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#128C7E] to-[#25D366] px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <MessageCircle size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold">
                {t("sendWhatsappMessage", "Send WhatsApp message")}
              </p>
              <p className="truncate text-xs text-emerald-50">
                {recipientName || t("unknownUser", "Unknown user")}
                {chat ? ` · +${chat.phone}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close", "Close")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {!chat ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t(
                "recipientNoMobile",
                "No valid mobile number is available, so WhatsApp can't be opened. You can still copy the message.",
              )}
            </p>
          ) : null}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("messageTemplate", "Message template")}
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => pickTemplate(template.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    templateId === template.id
                      ? "bg-[#128C7E] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("messagePreview", "Message (editable)")}
              </p>
              <span className="text-[11px] text-slate-400">
                {message.length} chars
              </span>
            </div>
            <div className="rounded-2xl bg-[#e7ddd3] p-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="w-full resize-y rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3 text-sm leading-relaxed text-slate-900 shadow-sm outline-none ring-[#128C7E] focus:ring-2"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? (
              <Check size={16} className="text-emerald-600" />
            ) : (
              <Copy size={16} />
            )}
            {copied ? t("copied", "Copied") : t("copyMessage", "Copy message")}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!chat || !message.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1fb857] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            {t("sendOnWhatsapp", "Send on WhatsApp")}
          </button>
        </div>
      </div>
    </div>
  );
}
