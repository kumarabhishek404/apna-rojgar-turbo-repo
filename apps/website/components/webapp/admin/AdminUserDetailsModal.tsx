"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CalendarDays,
  Copy,
  MessageCircle,
  Phone,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import VerifiedBadge from "@/components/commons/VerifiedBadge";
import WhatsappComposerDialog from "@/components/webapp/admin/WhatsappComposerDialog";
import AdminUserDetailsView, {
  ROLE_LABELS,
  SOURCE_LABELS,
  formatDate,
  text,
  type AdminUserRecord,
  type UserDetailsTab,
} from "@/components/webapp/admin/AdminUserDetailsView";
import { normalizeVerification, type VerificationStatus } from "@/lib/userVerification";
import {
  USER_WHATSAPP_TEMPLATES,
  buildUserWhatsappMessage,
  defaultUserWhatsappTemplate,
  type UserWhatsappTemplateId,
} from "@/lib/userWhatsappTemplates";

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  ACTIVE: { dot: "bg-emerald-400", text: "text-emerald-700" },
  PENDING: { dot: "bg-amber-400", text: "text-amber-700" },
  SUSPENDED: { dot: "bg-red-400", text: "text-red-700" },
  DISABLED: { dot: "bg-slate-400", text: "text-slate-600" },
  DELETED: { dot: "bg-slate-400", text: "text-slate-600" },
};

const TABS: Array<{ id: UserDetailsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "verification", label: "Verification" },
  { id: "account", label: "Account" },
];

export default function AdminUserDetailsModal({
  user,
  onClose,
  onVerificationChange,
  verificationSaving,
  message,
  onDismissMessage,
  onStatusUpdated,
}: {
  user: AdminUserRecord;
  onClose: () => void;
  onVerificationChange: (verification: VerificationStatus) => void;
  verificationSaving: boolean;
  message: string;
  onDismissMessage: () => void;
  onStatusUpdated: (status: string) => void;
}) {
  const role = String(user.role || "").toUpperCase();
  const status = String(user.status || "").toUpperCase();
  const verification = normalizeVerification(user.verification);
  const source = String(user.registrationSource || "").toLowerCase();
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.DISABLED;

  const [tab, setTab] = useState<UserDetailsTab>("overview");
  const [confirmAction, setConfirmAction] = useState<
    "suspend" | "activate" | null
  >(null);
  const [actionError, setActionError] = useState("");
  const [actionDone, setActionDone] = useState<
    "suspended" | "activated" | null
  >(null);
  const [composer, setComposer] = useState<{
    open: boolean;
    template: UserWhatsappTemplateId;
  }>({ open: false, template: "welcome" });

  // Admins can't be suspended from here; deleted/disabled accounts stay untouched.
  const canSuspend = role !== "ADMIN" && status === "ACTIVE";
  const canActivate =
    role !== "ADMIN" && (status === "SUSPENDED" || status === "PENDING");
  const dialogBusy = confirmAction !== null || composer.open;
  const displayName = text(user.name, "Unnamed user");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (dialogBusy) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogBusy, onClose]);

  const changeStatus = async (next: "SUSPENDED" | "ACTIVE") => {
    setActionError("");
    try {
      if (next === "SUSPENDED") {
        await apiRequest(`/admin/suspend-user/${user._id}`, { method: "DELETE" });
      } else {
        await apiRequest("/admin/activate-user", {
          method: "POST",
          body: JSON.stringify({ userId: user._id }),
        });
      }
      onStatusUpdated(next);
      setActionDone(next === "SUSPENDED" ? "suspended" : "activated");
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Could not update the account.",
      );
    }
  };

  const openComposer = (template?: UserWhatsappTemplateId) =>
    setComposer({
      open: true,
      template: template || defaultUserWhatsappTemplate(user),
    });

  const whatsappTemplates = useMemo(
    () =>
      USER_WHATSAPP_TEMPLATES.map((template) => ({
        id: template.id,
        label: template.label,
        build: () =>
          buildUserWhatsappMessage(template.id, {
            name: user.name,
            role: user.role,
          }),
      })),
    [user.name, user.role],
  );

  const callHref = user.mobile
    ? `tel:+${String(user.countryCode || "91").replace(/\D/g, "")}${user.mobile}`
    : null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-[0_24px_90px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="User details"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#16264f] via-[#1e3a8a] to-[#2a4fb8] px-5 pb-4 pt-5 text-white sm:px-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-10">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={displayName}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/40"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold ring-2 ring-white/25">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {ROLE_LABELS[role] || text(user.role, "Role not set")}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold ${statusStyle.text}`}
                >
                  <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                  {text(status, "Unknown")}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  Verification · {verification}
                </span>
              </div>
              <h3 className="mt-2 flex items-center gap-2 text-xl font-bold leading-tight sm:text-2xl">
                <span className="truncate">{displayName}</span>
                <VerifiedBadge user={user} size="lg" tone="onDark" />
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100">
                {user.mobile ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={12} />
                    <span className="font-semibold text-white">
                      +{text(user.countryCode, "91")} {user.mobile}
                    </span>
                    <HeaderCopy value={user.mobile} />
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={12} />
                  Joined {formatDate(user.createdAt)} ·{" "}
                  {SOURCE_LABELS[source] || text(user.registrationSource, "unknown source")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openComposer()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1fb857]"
            >
              <MessageCircle size={16} />
              WhatsApp user
            </button>
            {callHref ? (
              <a
                href={callHref}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
              >
                <Phone size={16} />
                Call
              </a>
            ) : null}
            {canSuspend ? (
              <button
                type="button"
                onClick={() => setConfirmAction("suspend")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-red-500 hover:ring-red-400"
              >
                <UserX size={16} />
                Suspend account
              </button>
            ) : null}
            {canActivate ? (
              <button
                type="button"
                onClick={() => setConfirmAction("activate")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-[#1e3a8a] shadow-sm transition hover:bg-blue-50"
              >
                <UserCheck size={16} />
                {status === "SUSPENDED" ? "Re-activate account" : "Activate account"}
              </button>
            ) : null}
          </div>
        </div>

        {/* Banners */}
        {actionError ? (
          <div className="flex items-start justify-between gap-3 border-b border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 sm:px-7">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Dismiss"
              className="shrink-0 text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}
        {message ? (
          <div className="flex items-start justify-between gap-3 border-b border-[#22409a]/15 bg-[#f1f5ff] px-5 py-2.5 text-sm font-medium text-[#22409a] sm:px-7">
            <span>{message}</span>
            <button
              type="button"
              onClick={onDismissMessage}
              aria-label="Dismiss"
              className="shrink-0 text-[#22409a]/70 hover:text-[#22409a]"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}
        {actionDone ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm text-emerald-800 sm:px-7">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Check size={16} />
              {actionDone === "suspended"
                ? "Account suspended."
                : "Account activated."}
            </span>
            <button
              type="button"
              onClick={() =>
                openComposer(actionDone === "suspended" ? "suspended" : "reactivated")
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1fb857]"
            >
              <MessageCircle size={14} />
              Notify user on WhatsApp
            </button>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 sm:px-6">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative shrink-0 px-3 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? "text-[#1e3a8a]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
              {tab === item.id ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1e3a8a]" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <AdminUserDetailsView
            user={user}
            tab={tab}
            onVerificationChange={onVerificationChange}
            verificationSaving={verificationSaving}
            onWhatsapp={(templateId) => openComposer(templateId)}
          />
        </div>
      </div>

      {/* ConfirmDialog is portalled, but React events still bubble to the backdrop. */}
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDialog
          open={confirmAction === "suspend"}
          onClose={() => setConfirmAction(null)}
          variant="danger"
          title="Suspend this account?"
          description={`${displayName} will be blocked from using the app and will get a suspension notification. You can re-activate the account later.`}
          confirmLabel="Suspend account"
          pendingLabel="Suspending…"
          onConfirm={() => changeStatus("SUSPENDED")}
        />
        <ConfirmDialog
          open={confirmAction === "activate"}
          onClose={() => setConfirmAction(null)}
          title={
            status === "SUSPENDED"
              ? "Re-activate this account?"
              : "Activate this account?"
          }
          description={`${displayName} will be able to use the app again and will get a notification.`}
          confirmLabel={status === "SUSPENDED" ? "Re-activate" : "Activate"}
          pendingLabel="Activating…"
          onConfirm={() => changeStatus("ACTIVE")}
        />
      </div>

      {composer.open ? (
        <WhatsappComposerDialog
          key={composer.template}
          recipientName={user.name}
          countryCode={user.countryCode}
          mobile={user.mobile}
          templates={whatsappTemplates}
          initialTemplateId={composer.template}
          onClose={() => setComposer((prev) => ({ ...prev, open: false }))}
        />
      ) : null}
    </div>
  );
}

function HeaderCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={copied ? "Copied" : "Copy mobile"}
      aria-label="Copy mobile"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
    >
      {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
    </button>
  );
}
