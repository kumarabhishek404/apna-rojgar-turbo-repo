"use client";

import { useCallback, useEffect, useState } from "react";
import { IndianRupee, Star } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";
import ServiceDetailsModal from "@/components/webapp/admin/services/ServiceDetailsModal";
import {
  formatDate,
  isPaidService,
  localizedLabel,
  resolveEmployer,
  statusClass,
  type AdminService,
} from "@/components/webapp/admin/services/adminServiceShared";
import { isListingFeatureActive } from "@/lib/serviceListingFeature";

type ServiceStats = {
  total?: number;
  hiring?: number;
  completed?: number;
  cancelled?: number;
  pending?: number;
  rejected?: number;
  promoted?: number;
  featured?: number;
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label={t("total", "Total")} value={String(stats.total ?? 0)} />
        <StatCard label="Hiring" value={String(stats.hiring ?? 0)} />
        <StatCard label="Completed" value={String(stats.completed ?? 0)} />
        <StatCard label="Cancelled" value={String(stats.cancelled ?? 0)} />
        <StatCard label="Pending" value={String(stats.pending ?? 0)} />
        <StatCard label="Promoted" value={String(stats.promoted ?? 0)} />
        <StatCard
          label={t("featuredServices", "Featured")}
          value={String(stats.featured ?? 0)}
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
                  const featured = isListingFeatureActive(service);
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
                          {featured ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200"
                              title={t("featuredBadge", "Featured")}
                            >
                              <Star size={12} className="fill-amber-500 text-amber-500" />
                              {t("featuredBadge", "Featured")}
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
          key={selectedService._id}
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onListingFeatureUpdated={(listingFeature) => {
            if (!listingFeature) return;
            const wasActive = isListingFeatureActive(selectedService);
            const nextService = { ...selectedService, listingFeature };
            const nowActive = isListingFeatureActive(nextService);
            setSelectedService(nextService);
            setRows((prev) =>
              prev.map((row) =>
                row._id === selectedService._id
                  ? { ...row, listingFeature }
                  : row,
              ),
            );
            if (wasActive !== nowActive) {
              setStats((prev) => ({
                ...prev,
                featured: Math.max(
                  0,
                  (prev.featured ?? 0) + (nowActive ? 1 : -1),
                ),
              }));
            }
          }}
          onStatusUpdated={(nextStatus) => {
            const previousStatus = String(
              selectedService.status || "",
            ).toLowerCase();
            const updatedAt = new Date().toISOString();
            setSelectedService({
              ...selectedService,
              status: nextStatus,
              updatedAt,
            });
            setRows((prev) =>
              prev.map((row) =>
                row._id === selectedService._id
                  ? { ...row, status: nextStatus, updatedAt }
                  : row,
              ),
            );
            setStats((prev) => {
              const next = { ...prev } as Record<string, number | undefined>;
              const from = previousStatus;
              const to = nextStatus.toLowerCase();
              if (from in next) next[from] = Math.max(0, (next[from] ?? 0) - 1);
              if (to in next) next[to] = (next[to] ?? 0) + 1;
              return next as ServiceStats;
            });
          }}
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
