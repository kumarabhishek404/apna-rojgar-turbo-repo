"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, IndianRupee } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";

type AdminPerson = {
  _id?: string;
  name?: string;
  mobile?: string;
  role?: string;
  address?: string;
  profilePicture?: string;
  status?: string;
  registrationSource?: string;
  email?: { value?: string; isVerified?: boolean };
};

type AdminEmployer = AdminPerson;

type AppliedWorkerEntry = {
  worker?: AdminPerson | string;
  skill?: string;
  status?: string;
};

type AppliedUserEntry = {
  user?: AdminPerson | string;
  skill?: string;
  appliedSkills?: string[];
  applicantType?: string;
  status?: string;
  workers?: AppliedWorkerEntry[];
};

type ApplicantRow = {
  key: string;
  name: string;
  role: string;
  skill: string;
  address: string;
  mobile: string;
  status: string;
  profilePicture?: string;
  viaMediator?: string;
};

type AdminService = {
  _id: string;
  jobID?: string;
  bookingType?: string;
  status?: string;
  type?: string;
  subType?: string;
  description?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  images?: string[];
  facilities?: Record<string, boolean>;
  requirements?: Array<Record<string, unknown>>;
  appliedUsers?: AppliedUserEntry[];
  selectedUsers?: unknown[];
  likedBy?: unknown[];
  uploadStatus?: string;
  socialMediaPromotion?: {
    enabled?: boolean;
    status?: string;
    orderId?: string;
    amount?: number;
    paidAt?: string;
  };
  geoLocation?: unknown;
  appliedSkill?: unknown;
  employer?: AdminEmployer | string;
  bookedWorker?: AdminEmployer | string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ServiceStats = {
  total?: number;
  hiring?: number;
  completed?: number;
  cancelled?: number;
  pending?: number;
  rejected?: number;
  promoted?: number;
};

const STATUS_FILTERS = [
  "ALL",
  "HIRING",
  "COMPLETED",
  "CANCELLED",
  "PENDING",
  "REJECTED",
] as const;

const BOOKING_FILTERS = ["ALL", "byService", "direct"] as const;

function statusClass(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "HIRING":
      return "bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function stringValue(value: unknown) {
  if (value == null) return "-";
  const normalized = String(value).trim();
  return normalized || "-";
}

/** CamelCase / snake_case → Title Case when no locale entry exists. */
function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Resolve i18n label for work type / skill / status keys (same pattern as service details). */
function localizedLabel(
  t: (key: string, fallback?: string) => string,
  value?: string | null,
) {
  if (value == null) return "-";
  const raw = String(value).trim();
  if (!raw || raw === "-") return "-";

  const exact = t(raw, "");
  if (exact) return exact;

  const lower = raw.toLowerCase();
  if (lower !== raw) {
    const viaLower = t(lower, "");
    if (viaLower) return viaLower;
  }

  return humanizeKey(raw);
}

function localizedSkillList(
  t: (key: string, fallback?: string) => string,
  value?: string | null,
) {
  if (!value || value === "-") return "-";
  return value
    .split(",")
    .map((part) => localizedLabel(t, part.trim()))
    .join(", ");
}

function isPaidService(service: AdminService) {
  const promo = service.socialMediaPromotion;
  if (!promo) return false;
  return (
    String(promo.status || "").toUpperCase() === "PAID" ||
    (promo.enabled === true && Number(promo.amount || 0) > 0)
  );
}

function resolveEmployer(service: AdminService): AdminEmployer | null {
  if (!service.employer || typeof service.employer === "string") return null;
  return service.employer;
}

function resolveWorker(service: AdminService): AdminEmployer | null {
  if (!service.bookedWorker || typeof service.bookedWorker === "string") {
    return null;
  }
  return service.bookedWorker;
}

function resolvePerson(value?: AdminPerson | string | null): AdminPerson | null {
  if (!value || typeof value === "string") return null;
  return value;
}

function skillLabel(entry: {
  skill?: string;
  appliedSkills?: string[];
}): string {
  if (Array.isArray(entry.appliedSkills) && entry.appliedSkills.length > 0) {
    return entry.appliedSkills.filter(Boolean).join(", ");
  }
  return entry.skill?.trim() || "-";
}

/** Flatten appliedUsers (+ nested mediator workers) for the details modal. */
function getApplicants(service: AdminService): ApplicantRow[] {
  const rows: ApplicantRow[] = [];
  const entries = Array.isArray(service.appliedUsers) ? service.appliedUsers : [];

  entries.forEach((entry, index) => {
    const person = resolvePerson(entry.user);
    const mediatorName = person?.name || "Applicant";
    const skill = skillLabel(entry);

    if (person || typeof entry.user === "string") {
      rows.push({
        // Include application index — same user can apply more than once.
        key: `applicant-${index}-${person?._id || entry.user || "unknown"}`,
        name: person?.name || "Unknown",
        role: person?.role || entry.applicantType || "-",
        skill,
        address: person?.address || "-",
        mobile: person?.mobile || "-",
        status: entry.status || "-",
        profilePicture: person?.profilePicture,
      });
    }

    const nested = Array.isArray(entry.workers) ? entry.workers : [];
    nested.forEach((workerEntry, workerIndex) => {
      const worker = resolvePerson(workerEntry.worker);
      if (!worker && typeof workerEntry.worker !== "string") return;
      rows.push({
        key: `worker-${index}-${workerIndex}-${worker?._id || workerEntry.worker || "unknown"}`,
        name: worker?.name || "Unknown",
        role: worker?.role || "WORKER",
        skill: workerEntry.skill?.trim() || skill,
        address: worker?.address || "-",
        mobile: worker?.mobile || "-",
        status: workerEntry.status || entry.status || "-",
        profilePicture: worker?.profilePicture,
        viaMediator: mediatorName,
      });
    });
  });

  return rows;
}

async function copyText(value: string) {
  if (!value || value === "-") return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default function AdminRegisteredServicesPage() {
  const { t } = useLanguage();
  const access = useAdminAccess();
  const [rows, setRows] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ServiceStats>({});
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [bookingFilter, setBookingFilter] =
    useState<(typeof BOOKING_FILTERS)[number]>("ALL");
  const [searchText, setSearchText] = useState("");
  const [selectedService, setSelectedService] = useState<AdminService | null>(
    null,
  );
  const limit = 20;

  useEffect(() => {
    setRows([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [statusFilter, bookingFilter, searchText]);

  useEffect(() => {
    if (access !== "allowed") return;

    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");

    const params = new URLSearchParams();
    params.set("status", statusFilter);
    params.set("bookingType", bookingFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const q = searchText.trim();
    if (q) params.set("search", q);

    apiRequest<{
      data: AdminService[];
      stats?: ServiceStats;
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/all-services?${params.toString()}`)
      .then((res) => {
        setRows((prev) =>
          page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])],
        );
        setStats(res?.stats || {});
        setTotal(res?.pagination?.total || 0);
        setPages(res?.pagination?.pages || 1);
      })
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : "Failed to load registered services",
        );
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, statusFilter, bookingFilter, searchText]);

  const canLoadMore = page < pages;

  const handleLoadMore = useCallback(() => {
    if (!canLoadMore || loadingMore || loading) return;
    setPage((p) => p + 1);
  }, [canLoadMore, loading, loadingMore]);

  if (access === "loading") {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
        {t("loading", "Loading…")}
      </div>
    );
  }

  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#22409a] p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">
          {t("registeredServices", "Registered Services")}
        </h1>
        <p className="mt-1 text-sm text-blue-100">
          {t(
            "registeredServicesSubtitle",
            "Live overview of every work registered in the Service collection.",
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label={t("total", "Total")} value={String(stats.total ?? 0)} />
        <StatCard label="Hiring" value={String(stats.hiring ?? 0)} />
        <StatCard label="Completed" value={String(stats.completed ?? 0)} />
        <StatCard label="Cancelled" value={String(stats.cancelled ?? 0)} />
        <StatCard label="Pending" value={String(stats.pending ?? 0)} />
        <StatCard label="Promoted" value={String(stats.promoted ?? 0)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("search", "Search")}
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t(
                "registeredServicesSearch",
                "Job ID, type, address, employer name or mobile",
              )}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("status", "Status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? t("all", "All status") : status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("bookingType", "Booking type")}
            </label>
            <select
              value={bookingFilter}
              onChange={(e) =>
                setBookingFilter(
                  e.target.value as (typeof BOOKING_FILTERS)[number],
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">{t("all", "All types")}</option>
              <option value="byService">{t("byService", "Applied In Work")}</option>
              <option value="direct">{t("direct", "Direct Booking")}</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Loaded{" "}
              <span className="font-semibold text-slate-800">{rows.length}</span>
              {total ? ` of ${total}` : ""}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{t("loading", "Loading…")}</p>
        ) : null}
        {!loading || rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("employer", "Employer")}</th>
                  <th className="px-4 py-3">{t("jobId", "Job ID")}</th>
                  <th className="px-4 py-3">{t("workType", "Work type")}</th>
                  <th className="px-4 py-3">{t("status", "Status")}</th>
                  <th className="px-4 py-3">{t("address", "Address")}</th>
                  <th className="px-4 py-3">{t("createdAt", "Created")}</th>
                  <th className="px-4 py-3 text-right">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((service) => {
                  const employer = resolveEmployer(service);
                  const paid = isPaidService(service);
                  return (
                    <tr
                      key={service._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {employer?.profilePicture ? (
                            <img
                              src={employer.profilePicture}
                              alt={employer.name || "Employer"}
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22409a] text-xs font-bold text-white">
                              {(employer?.name || "E").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">
                              {employer?.name ||
                                t("unknownUser", "Unknown user")}
                            </p>
                            <p className="text-xs text-slate-500">
                              {employer?.mobile || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#22409a]">
                            {service.jobID || "-"}
                          </span>
                          {paid ? (
                            <span
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.55)] ring-2 ring-amber-200"
                              title={t("paidService", "Paid service")}
                              aria-label={t("paidService", "Paid service")}
                            >
                              <IndianRupee size={14} strokeWidth={2.75} />
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {localizedLabel(t, service.type)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {localizedLabel(
                            t,
                            service.subType || service.bookingType,
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(service.status)}`}
                        >
                          {localizedLabel(t, service.status)}
                        </span>
                      </td>
                      <td
                        className="max-w-[14rem] truncate px-4 py-3 text-slate-600"
                        title={service.address || ""}
                      >
                        {service.address || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(service.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedService(service)}
                          className="rounded-lg border border-[#22409a]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a] transition hover:bg-[#eef3ff]"
                        >
                          {t("viewDetails", "View details")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {!loading && !error && rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          {t("registeredServicesEmpty", "No registered services found.")}
        </div>
      ) : null}

      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">
          {t("loadingMore", "Loading more…")}
        </p>
      ) : null}

      <InfiniteScrollSentinel
        enabled={canLoadMore && !loading}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />

      {!canLoadMore && rows.length > 0 ? (
        <p className="text-center text-xs text-slate-500">
          {t("endOfList", "You reached the end of the list.")}
        </p>
      ) : null}

      {selectedService ? (
        <ServiceDetailsModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          t={t}
        />
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1e3a8a]">{value}</p>
    </div>
  );
}

function ServiceDetailsModal({
  service,
  onClose,
  t,
}: {
  service: AdminService;
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  const employer = resolveEmployer(service);
  const worker = resolveWorker(service);
  const applicants = getApplicants(service);
  const paid = isPaidService(service);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("registeredServicesDetails", "Service details")}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {paid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <IndianRupee size={12} strokeWidth={2.5} />
                  {t("paidService", "Paid service")}
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-slate-800">
                {service.type
                  ? localizedLabel(t, service.type)
                  : t("registeredServicesDetails", "Service details")}
                {service.subType ? (
                  <span className="font-semibold text-slate-500">
                    {" "}
                    · {localizedLabel(t, service.subType)}
                  </span>
                ) : null}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {t("jobId", "Job ID")}: {service.jobID || "-"} · ID: {service._id}
              {paid && service.socialMediaPromotion?.amount
                ? ` · ₹${service.socialMediaPromotion.amount}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t("close", "Close")}
          </button>
        </div>

        <div className="max-h-[calc(92vh-84px)] overflow-y-auto p-4">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle
                title={t("applicants", "Applicants (workers / mediators)")}
              />
              <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#22409a]">
                {applicants.length}
              </span>
            </div>
            {applicants.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                {t("noApplicants", "No workers or mediators have applied yet.")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5">{t("name", "Name")}</th>
                        <th className="px-3 py-2.5">{t("role", "Role")}</th>
                        <th className="px-3 py-2.5">{t("skill", "Skill")}</th>
                        <th className="px-3 py-2.5">
                          {t("mobileNumber", "Mobile")}
                        </th>
                        <th className="px-3 py-2.5">{t("address", "Address")}</th>
                        <th className="px-3 py-2.5">{t("status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((row) => (
                        <tr
                          key={row.key}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {row.profilePicture ? (
                                <img
                                  src={row.profilePicture}
                                  alt={row.name}
                                  className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22409a] text-[11px] font-bold text-white">
                                  {row.name.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {row.name}
                                </p>
                                {row.viaMediator ? (
                                  <p className="text-[11px] text-slate-500">
                                    via {row.viaMediator}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-xs font-semibold text-[#22409a]">
                              {localizedLabel(t, row.role)}
                            </span>
                          </td>
                          <td className="max-w-[10rem] break-words px-3 py-2.5 text-slate-700">
                            {localizedSkillList(t, row.skill)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <span>{row.mobile}</span>
                              {row.mobile && row.mobile !== "-" ? (
                                <CopyIconButton value={row.mobile} label="mobile" />
                              ) : null}
                            </div>
                          </td>
                          <td
                            className="max-w-[14rem] px-3 py-2.5 text-slate-600"
                            title={row.address}
                          >
                            <div className="flex items-start gap-1.5">
                              <span className="line-clamp-2">{row.address}</span>
                              {row.address && row.address !== "-" ? (
                                <CopyIconButton
                                  value={row.address}
                                  label="address"
                                />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(row.status)}`}
                            >
                              {localizedLabel(t, row.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <SectionTitle title={t("serviceInformation", "Work information")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <CopyableDetail
                  title={t("jobId", "Job ID")}
                  value={stringValue(service.jobID)}
                />
                <CopyableDetail
                  title={t("status", "Status")}
                  value={localizedLabel(t, service.status)}
                />
                <CopyableDetail
                  title={t("workType", "Work type")}
                  value={localizedLabel(t, service.type)}
                />
                <CopyableDetail
                  title={t("workSubType", "Work subtype")}
                  value={localizedLabel(t, service.subType)}
                />
                <CopyableDetail
                  title={t("bookingType", "Booking type")}
                  value={localizedLabel(t, service.bookingType)}
                />
                <CopyableDetail
                  title={t("duration", "Duration (days)")}
                  value={stringValue(service.duration)}
                />
                <CopyableDetail
                  title={t("startDate", "Start date")}
                  value={formatDate(service.startDate)}
                />
                <CopyableDetail
                  title={t("endDate", "End date")}
                  value={formatDate(service.endDate)}
                />
                <CopyableDetail
                  title={t("address", "Address")}
                  value={stringValue(service.address)}
                  className="sm:col-span-2"
                />
                <CopyableDetail
                  title={t("description", "Description")}
                  value={stringValue(service.description)}
                  className="sm:col-span-2"
                />
                <CopyableDetail
                  title={t("serviceId", "Work ID")}
                  value={stringValue(service._id)}
                  className="sm:col-span-2"
                />
                <CopyableDetail
                  title={t("createdAt", "Created at")}
                  value={formatDate(service.createdAt)}
                />
                <CopyableDetail
                  title={t("updatedAt", "Updated at")}
                  value={formatDate(service.updatedAt)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle title={t("employerDetails", "Employer details")} />
              {employer ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <CopyableDetail
                    title={t("name", "Name")}
                    value={stringValue(employer.name)}
                  />
                  <CopyableDetail
                    title={t("mobileNumber", "Mobile")}
                    value={stringValue(employer.mobile)}
                  />
                  <CopyableDetail
                    title={t("role", "Role")}
                    value={localizedLabel(t, employer.role)}
                  />
                  <CopyableDetail
                    title={t("status", "Status")}
                    value={localizedLabel(t, employer.status)}
                  />
                  <CopyableDetail
                    title={t("address", "Address")}
                    value={stringValue(employer.address)}
                    className="sm:col-span-2"
                  />
                  <CopyableDetail
                    title={t("email", "Email")}
                    value={stringValue(employer.email?.value)}
                  />
                  <CopyableDetail
                    title={t("registrationSource", "Registration source")}
                    value={localizedLabel(t, employer.registrationSource)}
                  />
                  <CopyableDetail
                    title={t("userId", "User ID")}
                    value={stringValue(employer._id)}
                    className="sm:col-span-2"
                  />
                </div>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {typeof service.employer === "string"
                    ? `${t("employerId", "Employer ID")}: ${service.employer}`
                    : t("unknownUser", "Unknown user")}
                </p>
              )}

              {worker ? (
                <div className="mt-4 space-y-3">
                  <SectionTitle
                    title={t("bookedWorker", "Booked worker")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CopyableDetail
                      title={t("name", "Name")}
                      value={stringValue(worker.name)}
                    />
                    <CopyableDetail
                      title={t("mobileNumber", "Mobile")}
                      value={stringValue(worker.mobile)}
                    />
                    <CopyableDetail
                      title={t("role", "Role")}
                      value={localizedLabel(t, worker.role)}
                    />
                    <CopyableDetail
                      title={t("address", "Address")}
                      value={stringValue(worker.address)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <SectionTitle title={t("facilities", "Facilities")} />
              <DetailBlock title={t("facilities", "Facilities")} data={service.facilities} />
              <DetailBlock
                title={t("requirements", "Requirements")}
                data={service.requirements}
              />
              <DetailBlock
                title={t("socialMediaPromotion", "Social media promotion")}
                data={service.socialMediaPromotion}
              />
            </div>
            <div className="space-y-3">
              <SectionTitle title={t("activityCounters", "Activity counters")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <CopyableDetail
                  title="Applied users"
                  value={String(service.appliedUsers?.length ?? 0)}
                />
                <CopyableDetail
                  title="Selected users"
                  value={String(service.selectedUsers?.length ?? 0)}
                />
                <CopyableDetail
                  title="Liked by"
                  value={String(service.likedBy?.length ?? 0)}
                />
                <CopyableDetail
                  title="Images"
                  value={String(service.images?.length ?? 0)}
                />
                <CopyableDetail
                  title="Upload status"
                  value={localizedLabel(t, service.uploadStatus)}
                />
                <CopyableDetail
                  title="Promotion status"
                  value={localizedLabel(
                    t,
                    service.socialMediaPromotion?.status,
                  )}
                />
              </div>
              <DetailBlock title="Geo location" data={service.geoLocation} />
              <DetailBlock title="Applied skill" data={service.appliedSkill} />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("fullRawRecord", "Full raw database record")}
              </p>
              <CopyIconButton
                value={JSON.stringify(service, null, 2)}
                label={t("fullRawRecord", "Full raw database record")}
              />
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
              {JSON.stringify(service, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#22409a]">
      {title}
    </p>
  );
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
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
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#22409a]/30 hover:text-[#22409a]"
    >
      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
    </button>
  );
}

function CopyableDetail({
  title,
  value,
  className = "",
}: {
  title: string;
  value: string;
  className?: string;
}) {
  const canCopy = Boolean(value && value !== "-");

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 p-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        {canCopy ? <CopyIconButton value={value} label={title} /> : null}
      </div>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function DetailBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
        {data == null ? "-" : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
