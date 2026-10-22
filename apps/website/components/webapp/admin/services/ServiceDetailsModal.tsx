"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Ban,
  Braces,
  Briefcase,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  Images,
  IndianRupee,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Star,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import { isListingFeatureActive } from "@/lib/serviceListingFeature";
import WhatsappComposerDialog from "@/components/webapp/admin/WhatsappComposerDialog";
import {
  EMPLOYER_WHATSAPP_TEMPLATES,
  buildEmployerWhatsappMessage,
  defaultEmployerWhatsappTemplate,
  type EmployerWhatsappTemplateId,
} from "@/lib/serviceEmployerWhatsapp";
import {
  copyText,
  getApplicants,
  isPaidService,
  localizedLabel,
  localizedSkillList,
  resolveEmployer,
  resolveWorker,
  statusClass,
  stringValue,
  type AdminPerson,
  type AdminService,
} from "./adminServiceShared";

type Translate = (key: string, fallback?: string) => string;
type TabId = "overview" | "applicants" | "promotion" | "technical";

const FEATURE_DAY_PRESETS = [3, 7, 15, 30] as const;

const STATUS_DOT: Record<string, string> = {
  HIRING: "bg-emerald-400",
  COMPLETED: "bg-sky-400",
  CANCELLED: "bg-red-400",
  PENDING: "bg-amber-400",
  REJECTED: "bg-slate-400",
};

function formatDay(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialOf(name?: string, fallback = "?") {
  return (name || fallback).trim().slice(0, 1).toUpperCase() || fallback;
}

function payRange(service: AdminService) {
  const pays = (service.requirements || [])
    .map((req) => Number(req?.payPerDay))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (pays.length === 0) return "-";
  const min = Math.min(...pays);
  const max = Math.max(...pays);
  return min === max ? `₹${min}/day` : `₹${min} – ₹${max}/day`;
}

function totalWorkersNeeded(service: AdminService) {
  return (service.requirements || []).reduce(
    (sum, req) => sum + (Number(req?.count) || 0),
    0,
  );
}

function mapsUrl(geo: unknown) {
  const coords = (geo as { coordinates?: unknown } | null | undefined)
    ?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function ServiceDetailsModal({
  service,
  onClose,
  onListingFeatureUpdated,
  onStatusUpdated,
  t,
}: {
  service: AdminService;
  onClose: () => void;
  onListingFeatureUpdated: (
    listingFeature: AdminService["listingFeature"],
  ) => void;
  onStatusUpdated: (status: string) => void;
  t: Translate;
}) {
  const employer = resolveEmployer(service);
  const worker = resolveWorker(service);
  const applicants = useMemo(() => getApplicants(service), [service]);
  const paid = isPaidService(service);
  const featured = isListingFeatureActive(service);
  const status = String(service.status || "").toUpperCase();

  const [tab, setTab] = useState<TabId>("overview");
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "reactivate" | null
  >(null);
  const [actionError, setActionError] = useState("");
  const [actionDone, setActionDone] = useState<
    "cancelled" | "reactivated" | null
  >(null);
  const [composer, setComposer] = useState<{
    open: boolean;
    template: EmployerWhatsappTemplateId;
  }>({ open: false, template: "follow_up" });

  const canCancel = status === "HIRING" || status === "PENDING";
  const canReactivate = status === "CANCELLED" && service.bookingType !== "direct";
  const dialogBusy = confirmAction !== null || composer.open;

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

  const changeStatus = async (next: "CANCELLED" | "HIRING") => {
    setActionError("");
    try {
      await apiRequest(`/admin/services/${service._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      onStatusUpdated(next);
      setActionDone(next === "CANCELLED" ? "cancelled" : "reactivated");
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : t("serviceStatusUpdateFailed", "Could not update the service."),
      );
    }
  };

  const openComposer = (template?: EmployerWhatsappTemplateId) =>
    setComposer({
      open: true,
      template:
        template ||
        defaultEmployerWhatsappTemplate(service.status, applicants.length),
    });

  const workTitle = [
    localizedLabel(t, service.type),
    service.subType ? localizedLabel(t, service.subType) : "",
  ]
    .filter((part) => part && part !== "-")
    .join(" · ");

  const whatsappTemplates = useMemo(() => {
    const ctx = {
      employerName: employer?.name,
      workTitle: workTitle || "Work",
      jobId: service.jobID,
      address: service.address,
      applicantCount: applicants.length,
    };
    return EMPLOYER_WHATSAPP_TEMPLATES.map((template) => ({
      id: template.id,
      label: template.label,
      build: () => buildEmployerWhatsappMessage(template.id, ctx),
    }));
  }, [employer?.name, workTitle, service.jobID, service.address, applicants.length]);

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "overview", label: t("overview", "Overview") },
    {
      id: "applicants",
      label: t("applicantsShort", "Applicants"),
      count: applicants.length,
    },
    { id: "promotion", label: t("promotionAndFeaturing", "Promotion & Featuring") },
    { id: "technical", label: t("technicalDetails", "Technical") },
  ];

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
        aria-label={t("registeredServicesDetails", "Service details")}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-[#16264f] via-[#1e3a8a] to-[#2a4fb8] px-5 pb-4 pt-5 text-white sm:px-7">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close", "Close")}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 sm:flex">
              <Briefcase size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold ${statusClass(service.status).split(" ").filter((c) => c.startsWith("text-")).join(" ") || "text-slate-700"}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_DOT[status] || "bg-slate-400"}`}
                  />
                  {localizedLabel(t, service.status)}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                  {localizedLabel(t, service.bookingType)}
                </span>
                {paid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/40">
                    <IndianRupee size={12} strokeWidth={2.5} />
                    {t("paidService", "Paid service")}
                    {service.socialMediaPromotion?.amount
                      ? ` · ₹${service.socialMediaPromotion.amount}`
                      : ""}
                  </span>
                ) : null}
                {featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/25 px-2.5 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-200/40">
                    <Star size={12} className="fill-amber-300 text-amber-300" />
                    {t("featuredBadge", "Featured")}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-xl font-bold leading-tight sm:text-2xl">
                {workTitle || t("registeredServicesDetails", "Service details")}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100">
                <span className="inline-flex items-center gap-1.5">
                  {t("jobId", "Job ID")}:
                  <span className="font-semibold text-white">
                    {service.jobID || "-"}
                  </span>
                  {service.jobID ? (
                    <CopyIconButton
                      value={service.jobID}
                      label="job id"
                      tone="dark"
                    />
                  ) : null}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={12} />
                  {t("createdAt", "Created")}: {formatDateTime(service.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openComposer()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1fb857]"
            >
              <MessageCircle size={16} />
              {t("whatsappEmployer", "WhatsApp employer")}
            </button>
            {canCancel ? (
              <button
                type="button"
                onClick={() => setConfirmAction("cancel")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-red-500 hover:ring-red-400"
              >
                <Ban size={16} />
                {t("cancelService", "Cancel service")}
              </button>
            ) : null}
            {canReactivate ? (
              <button
                type="button"
                onClick={() => setConfirmAction("reactivate")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-[#1e3a8a] shadow-sm transition hover:bg-blue-50"
              >
                <RotateCcw size={16} />
                {t("reactivateService", "Re-activate service")}
              </button>
            ) : null}
            {status === "CANCELLED" && service.bookingType === "direct" ? (
              <span className="text-xs text-blue-100">
                {t(
                  "directCannotReactivate",
                  "Direct bookings can't be re-activated.",
                )}
              </span>
            ) : null}
          </div>
        </div>

        {/* Feedback banners */}
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
        {actionDone ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm text-emerald-800 sm:px-7">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Check size={16} />
              {actionDone === "cancelled"
                ? t("serviceCancelledDone", "Service cancelled.")
                : t("serviceReactivatedDone", "Service re-activated.")}
            </span>
            <button
              type="button"
              onClick={() =>
                openComposer(
                  actionDone === "cancelled" ? "cancelled" : "reactivated",
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1fb857]"
            >
              <MessageCircle size={14} />
              {t("notifyEmployerWhatsapp", "Notify employer on WhatsApp")}
            </button>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 sm:px-6">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? "text-[#1e3a8a]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
              {item.count != null ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    tab === item.id
                      ? "bg-[#1e3a8a] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
              {tab === item.id ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1e3a8a]" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === "overview" ? (
            <OverviewTab
              service={service}
              employer={employer}
              worker={worker}
              onWhatsapp={() => openComposer()}
              t={t}
            />
          ) : null}
          {tab === "applicants" ? (
            <ApplicantsTab applicants={applicants} t={t} />
          ) : null}
          {tab === "promotion" ? (
            <div className="space-y-4">
              <ListingFeaturePanel
                service={service}
                onUpdated={onListingFeatureUpdated}
                t={t}
              />
              <Card
                title={t("socialMediaPromotion", "Social media promotion")}
                icon={IndianRupee}
              >
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <InfoRow
                    label={t("status", "Status")}
                    value={localizedLabel(
                      t,
                      service.socialMediaPromotion?.status,
                    )}
                  />
                  <InfoRow
                    label={t("amount", "Amount")}
                    value={
                      service.socialMediaPromotion?.amount
                        ? `₹${service.socialMediaPromotion.amount}`
                        : "-"
                    }
                  />
                  <InfoRow
                    label={t("paidAt", "Paid at")}
                    value={formatDateTime(service.socialMediaPromotion?.paidAt)}
                  />
                  <InfoRow
                    label={t("orderId", "Order ID")}
                    value={stringValue(service.socialMediaPromotion?.orderId)}
                    copy
                  />
                </div>
              </Card>
            </div>
          ) : null}
          {tab === "technical" ? (
            <TechnicalTab service={service} employer={employer} worker={worker} t={t} />
          ) : null}
        </div>
      </div>

      {/* ConfirmDialog is portalled, but React events still bubble to the backdrop. */}
      <div onClick={(e) => e.stopPropagation()}>
      <ConfirmDialog
        open={confirmAction === "cancel"}
        onClose={() => setConfirmAction(null)}
        variant="danger"
        title={t("cancelServiceConfirmTitle", "Cancel this service?")}
        description={t(
          "cancelServiceConfirmBody",
          `${workTitle || "This work"} (${service.jobID || "-"}) will be marked as Cancelled and stop receiving applications. You can re-activate it later.`,
        )}
        confirmLabel={t("cancelService", "Cancel service")}
        cancelLabel={t("keepService", "Keep it")}
        pendingLabel={t("cancelling", "Cancelling…")}
        onConfirm={() => changeStatus("CANCELLED")}
      />
      <ConfirmDialog
        open={confirmAction === "reactivate"}
        onClose={() => setConfirmAction(null)}
        title={t("reactivateServiceConfirmTitle", "Re-activate this service?")}
        description={t(
          "reactivateServiceConfirmBody",
          `${workTitle || "This work"} (${service.jobID || "-"}) will go back to Hiring and become visible to workers again.`,
        )}
        confirmLabel={t("reactivateService", "Re-activate service")}
        cancelLabel={t("cancel", "Cancel")}
        pendingLabel={t("reactivating", "Re-activating…")}
        onConfirm={() => changeStatus("HIRING")}
      />
      </div>

      {composer.open ? (
        <WhatsappComposerDialog
          key={composer.template}
          recipientName={employer?.name}
          countryCode={employer?.countryCode}
          mobile={employer?.mobile}
          templates={whatsappTemplates}
          initialTemplateId={composer.template}
          onClose={() => setComposer((prev) => ({ ...prev, open: false }))}
        />
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Overview ───────────────────────────── */

function OverviewTab({
  service,
  employer,
  worker,
  onWhatsapp,
  t,
}: {
  service: AdminService;
  employer: AdminPerson | null;
  worker: AdminPerson | null;
  onWhatsapp: () => void;
  t: Translate;
}) {
  const facilities = service.facilities || {};
  const requirements = Array.isArray(service.requirements)
    ? service.requirements
    : [];
  const mapLink = mapsUrl(service.geoLocation);
  const workersNeeded = totalWorkersNeeded(service);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          icon={Users}
          label={t("applicantsShort", "Applicants")}
          value={String(service.appliedUsers?.length ?? 0)}
          tone="blue"
        />
        <StatTile
          icon={UserCheck}
          label={t("selected", "Selected")}
          value={String(service.selectedUsers?.length ?? 0)}
          tone="emerald"
        />
        <StatTile
          icon={Briefcase}
          label={t("workersNeeded", "Workers needed")}
          value={workersNeeded ? String(workersNeeded) : "-"}
          tone="violet"
        />
        <StatTile
          icon={IndianRupee}
          label={t("payPerDay", "Pay")}
          value={payRange(service)}
          tone="amber"
          small
        />
        <StatTile
          icon={Heart}
          label={t("likedBy", "Liked by")}
          value={String(service.likedBy?.length ?? 0)}
          tone="rose"
        />
        <StatTile
          icon={Images}
          label={t("images", "Images")}
          value={String(service.images?.length ?? 0)}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card title={t("serviceInformation", "Work information")} icon={Briefcase}>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <InfoRow label={t("workType", "Work type")} value={localizedLabel(t, service.type)} />
              <InfoRow label={t("workSubType", "Work subtype")} value={localizedLabel(t, service.subType)} />
              <InfoRow label={t("bookingType", "Booking type")} value={localizedLabel(t, service.bookingType)} />
              <InfoRow label={t("duration", "Duration (days)")} value={stringValue(service.duration)} />
            </div>
            {service.description ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                {service.description}
              </div>
            ) : null}
          </Card>

          <Card title={t("requirements", "Requirements")} icon={Users}>
            {requirements.length === 0 ? (
              <EmptyNote text={t("noRequirements", "No requirements added.")} />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="pb-2 pr-3">{t("skill", "Skill")}</th>
                      <th className="pb-2 pr-3">{t("count", "Count")}</th>
                      <th className="pb-2 pr-3">{t("payPerDay", "Pay / day")}</th>
                      <th className="pb-2">{t("perks", "Perks")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((req, index) => {
                      const perks = [
                        req.food ? t("food", "Food") : "",
                        req.living ? t("living", "Stay") : "",
                        req.pf ? "PF" : "",
                        req.insurance ? t("insurance", "Insurance") : "",
                      ].filter(Boolean);
                      return (
                        <tr key={String(req._id || index)} className="border-t border-slate-100">
                          <td className="py-2.5 pr-3 font-semibold text-slate-800">
                            {localizedSkillList(t, String(req.name || "-"))}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-700">{stringValue(req.count)}</td>
                          <td className="py-2.5 pr-3 font-semibold text-emerald-700">
                            {req.payPerDay ? `₹${String(req.payPerDay)}` : "-"}
                          </td>
                          <td className="py-2.5">
                            {perks.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {perks.map((perk) => (
                                  <span key={perk} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    {perk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={t("facilities", "Facilities")} icon={Check}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["food", t("food", "Food"), facilities.food],
                  ["living", t("living", "Stay / Room"), facilities.living],
                  ["travelling", t("travelling", "Travelling"), facilities.travelling],
                  ["esi_pf", t("esi_pf", "ESI / PF"), facilities.esi_pf],
                ] as const
              ).map(([key, label, on]) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                    on
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {on ? <Check size={15} /> : <X size={15} />}
                  {label}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card title={t("employerDetails", "Employer details")} icon={Briefcase}>
            {employer ? (
              <div>
                <div className="flex items-center gap-3">
                  {employer.profilePicture ? (
                    <img
                      src={employer.profilePicture}
                      alt={employer.name || "Employer"}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#22409a] to-[#4a6fe0] text-lg font-bold text-white shadow">
                      {initialOf(employer.name, "E")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-900">
                      {employer.name || t("unknownUser", "Unknown user")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-[11px] font-semibold text-[#22409a]">
                        {localizedLabel(t, employer.role)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(employer.status)}`}>
                        {localizedLabel(t, employer.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onWhatsapp}
                    disabled={!employer.mobile}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#1fb857] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </button>
                  {employer.mobile ? (
                    <a
                      href={`tel:+${String(employer.countryCode || "91").replace(/\D/g, "")}${employer.mobile}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Phone size={15} />
                      {t("call", "Call")}
                    </a>
                  ) : null}
                </div>

                <div className="mt-3">
                  <InfoRow label={t("mobileNumber", "Mobile")} value={stringValue(employer.mobile)} copy />
                  <InfoRow label={t("email", "Email")} value={stringValue(employer.email?.value)} copy />
                  <InfoRow label={t("registrationSource", "Registration source")} value={localizedLabel(t, employer.registrationSource)} />
                  <InfoRow label={t("address", "Address")} value={stringValue(employer.address)} copy />
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {typeof service.employer === "string"
                  ? `${t("employerId", "Employer ID")}: ${service.employer}`
                  : t("unknownUser", "Unknown user")}
              </p>
            )}
          </Card>

          {worker ? (
            <Card title={t("bookedWorker", "Booked worker")} icon={UserCheck}>
              <InfoRow label={t("name", "Name")} value={stringValue(worker.name)} />
              <InfoRow label={t("mobileNumber", "Mobile")} value={stringValue(worker.mobile)} copy />
              <InfoRow label={t("role", "Role")} value={localizedLabel(t, worker.role)} />
              <InfoRow label={t("address", "Address")} value={stringValue(worker.address)} copy />
            </Card>
          ) : null}

          <Card title={t("workLocation", "Work location")} icon={MapPin}>
            <p className="text-sm leading-relaxed text-slate-700">
              {stringValue(service.address)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {service.address ? (
                <CopyChip value={service.address} label={t("copyAddress", "Copy address")} />
              ) : null}
              {mapLink ? (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#22409a] transition hover:bg-[#eef3ff]"
                >
                  <ExternalLink size={13} />
                  {t("openInMaps", "Open in Maps")}
                </a>
              ) : null}
            </div>
          </Card>

          <Card title={t("timeline", "Timeline")} icon={Clock}>
            <ol className="relative space-y-3 border-l-2 border-slate-100 pl-4">
              {(
                [
                  [t("createdAt", "Created"), formatDateTime(service.createdAt)],
                  [t("startDate", "Start date"), formatDay(service.startDate)],
                  [t("endDate", "End date"), formatDay(service.endDate)],
                  [t("updatedAt", "Last updated"), formatDateTime(service.updatedAt)],
                ] as const
              ).map(([label, value]) => (
                <li key={label} className="relative">
                  <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22409a] ring-1 ring-[#22409a]/40" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-slate-800">{value}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Applicants ─────────────────────────── */

function ApplicantsTab({
  applicants,
  t,
}: {
  applicants: ReturnType<typeof getApplicants>;
  t: Translate;
}) {
  if (applicants.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Users size={22} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">
          {t("noApplicants", "No workers or mediators have applied yet.")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {applicants.map((row) => (
        <div
          key={row.key}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            {row.profilePicture ? (
              <img
                src={row.profilePicture}
                alt={row.name}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#22409a] to-[#4a6fe0] text-sm font-bold text-white">
                {initialOf(row.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate font-bold text-slate-900">{row.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                  {localizedLabel(t, row.status)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-[11px] font-semibold text-[#22409a]">
                  {localizedLabel(t, row.role)}
                </span>
                {row.viaMediator ? (
                  <span className="text-[11px] text-slate-500">via {row.viaMediator}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <InfoRow label={t("skill", "Skill")} value={localizedSkillList(t, row.skill)} />
            <InfoRow label={t("mobileNumber", "Mobile")} value={row.mobile} copy />
            <InfoRow label={t("address", "Address")} value={row.address} copy />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────── Technical ──────────────────────────── */

function TechnicalTab({
  service,
  employer,
  worker,
  t,
}: {
  service: AdminService;
  employer: AdminPerson | null;
  worker: AdminPerson | null;
  t: Translate;
}) {
  const raw = useMemo(() => JSON.stringify(service, null, 2), [service]);
  return (
    <div className="space-y-4">
      <Card title={t("identifiers", "Identifiers")} icon={Braces}>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <InfoRow label={t("serviceId", "Work ID")} value={stringValue(service._id)} copy mono />
          <InfoRow label={t("jobId", "Job ID")} value={stringValue(service.jobID)} copy mono />
          <InfoRow
            label={t("employerId", "Employer ID")}
            value={stringValue(employer?._id ?? (typeof service.employer === "string" ? service.employer : undefined))}
            copy
            mono
          />
          <InfoRow label={t("bookedWorkerId", "Booked worker ID")} value={stringValue(worker?._id)} copy mono />
          <InfoRow label={t("uploadStatus", "Upload status")} value={localizedLabel(t, service.uploadStatus)} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <JsonCard title={t("geoLocation", "Geo location")} data={service.geoLocation} />
        <JsonCard title={t("appliedSkill", "Applied skill")} data={service.appliedSkill} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            {t("fullRawRecord", "Full raw database record")}
          </p>
          <CopyIconButton value={raw} label="raw record" tone="dark" />
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-emerald-200">
          {raw}
        </pre>
      </div>
    </div>
  );
}

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
        {data == null ? "-" : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

/* ───────────────────────── Listing feature ────────────────────────── */

function ListingFeaturePanel({
  service,
  onUpdated,
  t,
}: {
  service: AdminService;
  onUpdated: (listingFeature: AdminService["listingFeature"]) => void;
  t: Translate;
}) {
  const currentlyActive = isListingFeatureActive(service);
  const [enabled, setEnabled] = useState(currentlyActive);
  const [days, setDays] = useState(
    Number(service.listingFeature?.days) > 0
      ? Number(service.listingFeature?.days)
      : 7,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEnabled(isListingFeatureActive(service));
    setDays(
      Number(service.listingFeature?.days) > 0
        ? Number(service.listingFeature?.days)
        : 7,
    );
    setError("");
    setMessage("");
  }, [
    service._id,
    service.listingFeature?.enabled,
    service.listingFeature?.days,
    service.listingFeature?.expiresAt,
  ]);

  const expiresLabel = service.listingFeature?.expiresAt
    ? formatDateTime(service.listingFeature.expiresAt)
    : "-";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    const nDays = Math.floor(Number(days));
    if (enabled && (!Number.isInteger(nDays) || nDays < 1 || nDays > 90)) {
      setSaving(false);
      setError(
        t("listingFeatureDaysInvalid", "Enter a whole number of days from 1 to 90."),
      );
      return;
    }
    try {
      const res = await apiRequest<{
        data?: { listingFeature?: AdminService["listingFeature"] };
      }>(`/admin/services/${service._id}/listing-feature`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled,
          days: enabled ? nDays : undefined,
        }),
      });
      if (!res?.data?.listingFeature) {
        setError(t("listingFeatureSaveFailed", "Could not update featuring."));
        return;
      }
      onUpdated(res.data.listingFeature);
      setMessage(
        enabled
          ? t("listingFeatureSaved", "This work is now featured on the list.")
          : t("listingFeatureDisabled", "Featuring was turned off."),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("listingFeatureSaveFailed", "Could not update featuring."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Star size={16} className="fill-amber-400" />
            </span>
            <p className="text-sm font-bold text-slate-900">
              {t("listingFeatureTitle", "Feature on work list")}
            </p>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {t(
              "listingFeatureHelp",
              "Pin this work at the top of the mobile services list with a Featured badge. Choose how many days it should stay featured.",
            )}
          </p>
        </div>
        {currentlyActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            {t("featuredActive", "Currently featured")}
          </span>
        ) : null}
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
        />
        <span className="text-sm font-semibold text-slate-800">
          {t("listingFeatureEnable", "Enable featuring")}
        </span>
      </label>

      <div className={`mt-3 ${enabled ? "" : "opacity-50"}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {t("listingFeatureDays", "Feature for (days)")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {FEATURE_DAY_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!enabled || saving}
              onClick={() => setDays(preset)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                days === preset
                  ? "bg-amber-500 text-white"
                  : "border border-amber-200 bg-white text-amber-900 hover:bg-amber-100"
              }`}
            >
              {preset} {t("days", "days")}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={90}
            disabled={!enabled || saving}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none ring-amber-400 focus:ring-2"
            aria-label={t("listingFeatureDays", "Feature for (days)")}
          />
        </div>
        {currentlyActive ? (
          <p className="mt-2 text-xs text-slate-500">
            {t("listingFeatureExpires", "Expires")}: {expiresLabel}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-[#22409a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a327c] disabled:opacity-60"
        >
          {saving ? t("saving", "Saving…") : t("listingFeatureSave", "Save featuring")}
        </button>
        {message ? (
          <p className="text-sm font-medium text-emerald-700">{message}</p>
        ) : null}
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}

/* ───────────────────────── Shared UI pieces ───────────────────────── */

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef3ff] text-[#22409a]">
          <Icon size={15} />
        </span>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      </div>
      {children}
    </section>
  );
}

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  small,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: keyof typeof TONES;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className={`truncate font-bold text-slate-900 ${small ? "text-sm" : "text-xl"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  copy,
  mono,
}: {
  label: string;
  value: string;
  copy?: boolean;
  mono?: boolean;
}) {
  const canCopy = Boolean(copy && value && value !== "-");
  return (
    <div className="group flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <p className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="flex min-w-0 items-start gap-1.5">
        <p
          className={`break-words text-right text-sm font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
        {canCopy ? (
          <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <CopyIconButton value={value} label={label} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500">
      {text}
    </p>
  );
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (!(await copyText(value))) return;
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function CopyIconButton({
  value,
  label,
  tone = "light",
}: {
  value: string;
  label: string;
  tone?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={copied ? "Copied" : "Copy to clipboard"}
      aria-label={`Copy ${label}`}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
        tone === "dark"
          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
          : "border-slate-200 bg-white text-slate-500 hover:border-[#22409a]/30 hover:text-[#22409a]"
      }`}
    >
      {copied ? (
        <Check size={12} className={tone === "dark" ? "text-emerald-300" : "text-emerald-600"} />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}
