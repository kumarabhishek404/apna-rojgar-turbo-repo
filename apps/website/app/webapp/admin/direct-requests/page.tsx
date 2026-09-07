"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
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
  email?: { value?: string } | string;
  skills?: unknown;
};

type DirectRequest = {
  _id: string;
  status?: string;
  startDate?: string;
  duration?: string | number;
  address?: string;
  description?: string;
  requiredNumberOfWorkers?: number;
  images?: string[];
  facilities?: Record<string, boolean>;
  appliedSkill?: { skill?: string; payPerDay?: number | string; [key: string]: unknown };
  type?: string;
  subType?: string;
  employer?: AdminPerson | string;
  bookedWorker?: AdminPerson | string;
  createdAt?: string;
  updatedAt?: string;
};

type RequestStats = {
  total?: number;
  pending?: number;
  accepted?: number;
  rejected?: number;
  cancelled?: number;
  removed?: number;
  left?: number;
};

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "REMOVED",
  "LEFT",
] as const;

const ROLE_FILTERS = ["ALL", "WORKER", "MEDIATOR"] as const;

function statusClass(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600";
    case "REMOVED":
    case "LEFT":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function stringValue(value: unknown) {
  if (value == null) return "-";
  const normalized = String(value).trim();
  return normalized || "-";
}

function emailValue(email?: AdminPerson["email"]) {
  if (!email) return "-";
  if (typeof email === "string") return stringValue(email);
  return stringValue(email.value);
}

function resolvePerson(value?: AdminPerson | string | null): AdminPerson | null {
  if (!value || typeof value === "string") return null;
  return value;
}

function skillFromRequest(request: DirectRequest) {
  const skill = request.appliedSkill?.skill;
  if (typeof skill === "string" && skill.trim()) return skill.trim();
  if (request.appliedSkill && typeof request.appliedSkill === "object") {
    try {
      return JSON.stringify(request.appliedSkill);
    } catch {
      return "-";
    }
  }
  return "-";
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

export default function AdminDirectRequestsPage() {
  const { t } = useLanguage();
  const access = useAdminAccess();
  const [rows, setRows] = useState<DirectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<RequestStats>({});
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_FILTERS)[number]>("ALL");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<DirectRequest | null>(null);
  const limit = 20;

  useEffect(() => {
    setRows([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [statusFilter, roleFilter, searchText]);

  useEffect(() => {
    if (access !== "allowed") return;

    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");

    const params = new URLSearchParams();
    params.set("status", statusFilter);
    params.set("role", roleFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const q = searchText.trim();
    if (q) params.set("search", q);

    apiRequest<{
      data: DirectRequest[];
      stats?: RequestStats;
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/direct-requests?${params.toString()}`)
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
          e instanceof Error ? e.message : "Failed to load direct requests",
        );
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, statusFilter, roleFilter, searchText]);

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
          {t("directRequests", "Direct Requests")}
        </h1>
        <p className="mt-1 text-sm text-blue-100">
          {t(
            "directRequestsSubtitle",
            "Employer booking invitations sent directly to workers and mediators.",
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label={t("total", "Total")} value={String(stats.total ?? 0)} />
        <StatCard label="Pending" value={String(stats.pending ?? 0)} />
        <StatCard label="Accepted" value={String(stats.accepted ?? 0)} />
        <StatCard label="Rejected" value={String(stats.rejected ?? 0)} />
        <StatCard label="Cancelled" value={String(stats.cancelled ?? 0)} />
        <StatCard
          label="Other"
          value={String((stats.removed ?? 0) + (stats.left ?? 0))}
        />
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
                "directRequestsSearch",
                "Employer/receiver name, mobile, skill, or address",
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
              {t("receiverRole", "Receiver role")}
            </label>
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as (typeof ROLE_FILTERS)[number])
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">{t("all", "All roles")}</option>
              <option value="WORKER">WORKER</option>
              <option value="MEDIATOR">MEDIATOR</option>
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
                  <th className="px-4 py-3">
                    {t("senderEmployer", "Sender (Employer)")}
                  </th>
                  <th className="px-4 py-3 text-center" aria-hidden>
                    {" "}
                  </th>
                  <th className="px-4 py-3">
                    {t("receiver", "Receiver")}
                  </th>
                  <th className="px-4 py-3">{t("skill", "Skill")}</th>
                  <th className="px-4 py-3">{t("status", "Status")}</th>
                  <th className="px-4 py-3">{t("createdAt", "Created")}</th>
                  <th className="px-4 py-3 text-right">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((request) => {
                  const sender = resolvePerson(request.employer);
                  const receiver = resolvePerson(request.bookedWorker);
                  return (
                    <tr
                      key={request._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <PersonCell
                          person={sender}
                          fallbackId={
                            typeof request.employer === "string"
                              ? request.employer
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-2 py-3 text-center text-slate-300">
                        <ArrowRight size={16} className="mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <PersonCell
                          person={receiver}
                          fallbackId={
                            typeof request.bookedWorker === "string"
                              ? request.bookedWorker
                              : undefined
                          }
                        />
                      </td>
                      <td className="max-w-[10rem] px-4 py-3 text-slate-700">
                        <p className="font-medium">{skillFromRequest(request)}</p>
                        <p className="text-xs text-slate-500">
                          {request.requiredNumberOfWorkers
                            ? `${request.requiredNumberOfWorkers} worker(s)`
                            : "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(request.status)}`}
                        >
                          {request.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(request)}
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
          {t("directRequestsEmpty", "No direct booking requests found.")}
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

      {selected ? (
        <RequestDetailsModal
          request={selected}
          onClose={() => setSelected(null)}
          t={t}
        />
      ) : null}
    </section>
  );
}

function PersonCell({
  person,
  fallbackId,
}: {
  person: AdminPerson | null;
  fallbackId?: string;
}) {
  const name = person?.name || (fallbackId ? "Unknown" : "Unknown");
  return (
    <div className="flex items-center gap-3">
      {person?.profilePicture ? (
        <img
          src={person.profilePicture}
          alt={name}
          className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22409a] text-xs font-bold text-white">
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{name}</p>
        <p className="truncate text-xs text-slate-500">
          {person?.mobile || "-"}
          {person?.role ? ` · ${person.role}` : ""}
        </p>
      </div>
    </div>
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

function RequestDetailsModal({
  request,
  onClose,
  t,
}: {
  request: DirectRequest;
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  const sender = resolvePerson(request.employer);
  const receiver = resolvePerson(request.bookedWorker);
  const rawJson = JSON.stringify(request, null, 2);

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
        aria-label={t("directRequestDetails", "Direct request details")}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {t("directRequestDetails", "Direct request details")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("requestId", "Request ID")}: {request._id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(request.status)}`}
            >
              {request.status || "-"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {t("close", "Close")}
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-84px)] overflow-y-auto p-4">
          <div className="mb-4 grid gap-3 rounded-2xl border border-[#22409a]/15 bg-gradient-to-r from-[#eef3ff] to-white p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <PartySummary
              label={t("senderEmployer", "Sender (Employer)")}
              person={sender}
              fallbackId={
                typeof request.employer === "string" ? request.employer : undefined
              }
            />
            <div className="hidden justify-center text-[#22409a] sm:flex">
              <ArrowRight size={22} />
            </div>
            <PartySummary
              label={t("receiver", "Receiver")}
              person={receiver}
              fallbackId={
                typeof request.bookedWorker === "string"
                  ? request.bookedWorker
                  : undefined
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <SectionTitle title={t("requestInformation", "Request information")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <CopyableDetail
                  title={t("requestId", "Request ID")}
                  value={stringValue(request._id)}
                  className="sm:col-span-2"
                />
                <CopyableDetail
                  title={t("status", "Status")}
                  value={stringValue(request.status)}
                />
                <CopyableDetail
                  title={t("skill", "Skill")}
                  value={skillFromRequest(request)}
                />
                <CopyableDetail
                  title={t("payPerDay", "Pay per day")}
                  value={
                    request.appliedSkill?.payPerDay != null
                      ? `₹${request.appliedSkill.payPerDay}`
                      : "-"
                  }
                />
                <CopyableDetail
                  title={t("workersNeeded", "Workers needed")}
                  value={stringValue(request.requiredNumberOfWorkers)}
                />
                <CopyableDetail
                  title={t("duration", "Duration (days)")}
                  value={stringValue(request.duration)}
                />
                <CopyableDetail
                  title={t("startDate", "Start date")}
                  value={formatDate(request.startDate)}
                />
                <CopyableDetail
                  title={t("address", "Address")}
                  value={stringValue(request.address)}
                  className="sm:col-span-2"
                />
                <CopyableDetail
                  title={t("description", "Description")}
                  value={stringValue(request.description)}
                  className="sm:col-span-2"
                />
                <CopyableDetail
                  title={t("createdAt", "Created at")}
                  value={formatDate(request.createdAt)}
                />
                <CopyableDetail
                  title={t("updatedAt", "Updated at")}
                  value={formatDate(request.updatedAt)}
                />
              </div>
              <DetailBlock
                title={t("facilities", "Facilities")}
                data={request.facilities}
              />
              <DetailBlock
                title={t("appliedSkill", "Applied skill object")}
                data={request.appliedSkill}
              />
            </div>

            <div className="space-y-4">
              <PersonDetailsCard
                title={t("senderDetails", "Sender details (Employer)")}
                person={sender}
                fallbackId={
                  typeof request.employer === "string"
                    ? request.employer
                    : undefined
                }
                t={t}
              />
              <PersonDetailsCard
                title={t("receiverDetails", "Receiver details")}
                person={receiver}
                fallbackId={
                  typeof request.bookedWorker === "string"
                    ? request.bookedWorker
                    : undefined
                }
                t={t}
              />
            </div>
          </div>

          {Array.isArray(request.images) && request.images.length > 0 ? (
            <div className="mt-4 space-y-2">
              <SectionTitle title={t("images", "Images")} />
              <div className="flex flex-wrap gap-2">
                {request.images.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-20 w-20 overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img
                      src={src}
                      alt="Request attachment"
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("fullRawRecord", "Full raw database record")}
              </p>
              <CopyIconButton
                value={rawJson}
                label={t("fullRawRecord", "Full raw database record")}
              />
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
              {rawJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartySummary({
  label,
  person,
  fallbackId,
}: {
  label: string;
  person: AdminPerson | null;
  fallbackId?: string;
}) {
  const name = person?.name || "Unknown";
  return (
    <div className="min-w-0 rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#22409a]/80">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        {person?.profilePicture ? (
          <img
            src={person.profilePicture}
            alt={name}
            className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#22409a] text-sm font-bold text-white">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800">{name}</p>
          <p className="truncate text-xs text-slate-500">
            {person?.role || "-"} · {person?.mobile || fallbackId || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PersonDetailsCard({
  title,
  person,
  fallbackId,
  t,
}: {
  title: string;
  person: AdminPerson | null;
  fallbackId?: string;
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title={title} />
      {person ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <CopyableDetail title={t("name", "Name")} value={stringValue(person.name)} />
          <CopyableDetail
            title={t("mobileNumber", "Mobile")}
            value={stringValue(person.mobile)}
          />
          <CopyableDetail title={t("role", "Role")} value={stringValue(person.role)} />
          <CopyableDetail
            title={t("status", "Status")}
            value={stringValue(person.status)}
          />
          <CopyableDetail
            title={t("email", "Email")}
            value={emailValue(person.email)}
          />
          <CopyableDetail
            title={t("registrationSource", "Registration source")}
            value={stringValue(person.registrationSource)}
          />
          <CopyableDetail
            title={t("address", "Address")}
            value={stringValue(person.address)}
            className="sm:col-span-2"
          />
          <CopyableDetail
            title={t("userId", "User ID")}
            value={stringValue(person._id)}
            className="sm:col-span-2"
          />
        </div>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {fallbackId
            ? `${t("userId", "User ID")}: ${fallbackId}`
            : t("unknownUser", "Unknown user")}
        </p>
      )}
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
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#22409a]/30 hover:text-[#22409a]"
    >
      {copied ? (
        <Check size={14} className="text-emerald-600" />
      ) : (
        <Copy size={14} />
      )}
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
