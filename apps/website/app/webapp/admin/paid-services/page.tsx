"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";

type PromotionPaymentUser = {
  _id?: string;
  name?: string;
  mobile?: string;
  role?: string;
  profilePicture?: string;
  address?: string;
};

type PromotionPaymentService = {
  _id?: string;
  jobID?: string;
  type?: string;
  subType?: string;
  address?: string;
  status?: string;
  startDate?: string;
  createdAt?: string;
  socialMediaPromotion?: {
    enabled?: boolean;
    status?: string;
    orderId?: string;
    amount?: number;
    paidAt?: string;
  };
};

export type PromotionPaymentRow = {
  _id: string;
  orderId: string;
  paymentSessionId?: string;
  amount: number;
  currency?: string;
  status: string;
  purpose?: string;
  paidAt?: string;
  cashfreeOrderStatus?: string;
  cfPaymentId?: string;
  paymentMethod?: string;
  paymentMethodDetail?: string;
  webhookEventId?: string;
  serviceJobId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  user?: PromotionPaymentUser | string;
  service?: PromotionPaymentService | string | null;
};

type PromotionStats = {
  total?: number;
  paid?: number;
  created?: number;
  failed?: number;
  expired?: number;
  totalPaidAmount?: number;
  promotedServices?: number;
};

const STATUS_FILTERS = ["ALL", "PAID", "CREATED", "FAILED", "EXPIRED"] as const;

function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700";
    case "CREATED":
      return "bg-amber-50 text-amber-700";
    case "FAILED":
      return "bg-red-50 text-red-700";
    case "EXPIRED":
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

function resolveUser(row: PromotionPaymentRow): PromotionPaymentUser | null {
  if (!row.user || typeof row.user === "string") return null;
  return row.user;
}

function resolveService(row: PromotionPaymentRow): PromotionPaymentService | null {
  if (!row.service || typeof row.service === "string") return null;
  return row.service;
}

function resolvePaymentMethod(row: PromotionPaymentRow) {
  const method =
    row.paymentMethod ||
    (typeof row.metadata?.paymentMethod === "string" ? row.metadata.paymentMethod : "");
  const detail =
    row.paymentMethodDetail ||
    (typeof row.metadata?.paymentMethodDetail === "string"
      ? row.metadata.paymentMethodDetail
      : "");
  return { method: method || "-", detail };
}

export default function AdminPaidServicesPage() {
  const { t } = useLanguage();
  const access = useAdminAccess();
  const [rows, setRows] = useState<PromotionPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<PromotionStats>({});
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [searchText, setSearchText] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PromotionPaymentRow | null>(null);
  const limit = 20;

  useEffect(() => {
    setRows([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [statusFilter, searchText]);

  useEffect(() => {
    if (access !== "allowed") return;

    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");

    const params = new URLSearchParams();
    params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const q = searchText.trim();
    if (q) params.set("search", q);

    apiRequest<{
      data: PromotionPaymentRow[];
      stats?: PromotionStats;
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/promotion-payments?${params.toString()}`)
      .then((res) => {
        setRows((prev) => (page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])]));
        setStats(res?.stats || {});
        setTotal(res?.pagination?.total || 0);
        setPages(res?.pagination?.pages || 1);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load paid services");
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, statusFilter, searchText]);

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
      <div className="rounded-2xl bg-gradient-to-r from-[#22409a] to-[#3154bf] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("paidServices", "Paid Services")}</h1>
        <p className="mt-1 text-sm text-blue-100">
          {t(
            "paidServicesSubtitle",
            "Social media promotion payments from employers across the platform.",
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("adminPromotionPaidCount", "Paid payments")}
          value={String(stats.paid ?? 0)}
        />
        <StatCard
          label={t("adminPromotionTotalAmount", "Total collected")}
          value={`₹${stats.totalPaidAmount ?? 0}`}
        />
        <StatCard
          label={t("adminPromotionServicesCount", "Promoted works")}
          value={String(stats.promotedServices ?? 0)}
        />
        <StatCard label={t("total", "Total")} value={String(stats.total ?? 0)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === status
                    ? "bg-[#22409a] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status === "ALL" ? t("all", "All") : status}
              </button>
            ))}
          </div>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("paidServicesSearch", "Search order ID, employer name or mobile")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#22409a] lg:max-w-sm"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          {t("loading", "Loading…")}
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("employer", "Employer")}</th>
                  <th className="px-4 py-3">{t("amount", "Amount")}</th>
                  <th className="px-4 py-3">{t("paymentMethod", "Payment method")}</th>
                  <th className="px-4 py-3">{t("status", "Status")}</th>
                  <th className="px-4 py-3">{t("orderId", "Order ID")}</th>
                  <th className="px-4 py-3">{t("jobId", "Job ID")}</th>
                  <th className="px-4 py-3">{t("paidAt", "Paid at")}</th>
                  <th className="px-4 py-3 text-right">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const employer = resolveUser(row);
                  const service = resolveService(row);
                  const jobId = service?.jobID || row.serviceJobId || "-";
                  const paymentMethod = resolvePaymentMethod(row);

                  return (
                    <tr
                      key={row._id}
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
                              {employer?.name || t("unknownUser", "Unknown user")}
                            </p>
                            <p className="text-xs text-slate-500">{employer?.mobile || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#22409a]">₹{row.amount}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{paymentMethod.method}</p>
                        {paymentMethod.detail ? (
                          <p className="text-xs text-slate-500">{paymentMethod.detail}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3 text-slate-600" title={row.orderId}>
                        {row.orderId}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{jobId}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(row.paidAt || row.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(row)}
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
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          {t("adminPromotionEmpty", "No promotion payments found.")}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        {t("loaded", "Loaded")}{" "}
        <span className="font-semibold text-slate-800">{rows.length}</span>
        {total ? ` ${t("of", "of")} ${total}` : ""}{" "}
        {t("paidServicesRecords", "payment records")}
      </div>

      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">{t("loadingMore", "Loading more…")}</p>
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

      {selectedPayment ? (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
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

function PaymentDetailsModal({
  payment,
  onClose,
  t,
}: {
  payment: PromotionPaymentRow;
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
}) {
  const employer = resolveUser(payment);
  const service = resolveService(payment);
  const paymentMethod = resolvePaymentMethod(payment);

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
        aria-label={t("paidServicesDetails", "Payment details")}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {t("paidServicesDetails", "Payment details")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("orderId", "Order ID")}: {payment.orderId}
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
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <SectionTitle title={t("paymentInformation", "Payment information")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail title={t("orderId", "Order ID")} value={payment.orderId} />
                <Detail title={t("amount", "Amount")} value={`₹${payment.amount}`} />
                <Detail title={t("paymentMethod", "Payment method")} value={paymentMethod.method} />
                <Detail
                  title={t("paymentMethodDetail", "Payment method details")}
                  value={paymentMethod.detail || "-"}
                />
                <Detail title={t("currency", "Currency")} value={payment.currency || "INR"} />
                <Detail title={t("status", "Status")} value={payment.status} />
                <Detail title={t("purpose", "Purpose")} value={payment.purpose || "-"} />
                <Detail
                  title={t("cashfreeOrderStatus", "Cashfree order status")}
                  value={payment.cashfreeOrderStatus || "-"}
                />
                <Detail
                  title={t("cfPaymentId", "Cashfree payment ID")}
                  value={payment.cfPaymentId || "-"}
                />
                <Detail
                  title={t("paymentSessionId", "Payment session ID")}
                  value={payment.paymentSessionId || "-"}
                  className="sm:col-span-2"
                />
                <Detail
                  title={t("webhookEventId", "Webhook event ID")}
                  value={payment.webhookEventId || "-"}
                  className="sm:col-span-2"
                />
                <Detail title={t("paidAt", "Paid at")} value={formatDate(payment.paidAt)} />
                <Detail title={t("createdAt", "Created at")} value={formatDate(payment.createdAt)} />
                <Detail title={t("updatedAt", "Updated at")} value={formatDate(payment.updatedAt)} />
                <Detail title={t("paymentId", "Payment ID")} value={payment._id} className="sm:col-span-2" />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle title={t("employerDetails", "Employer details")} />
              {employer ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail title={t("name", "Name")} value={employer.name || "-"} />
                  <Detail title={t("mobileNumber", "Mobile")} value={employer.mobile || "-"} />
                  <Detail title={t("role", "Role")} value={employer.role || "-"} />
                  <Detail title={t("address", "Address")} value={employer.address || "-"} />
                  <Detail title={t("userId", "User ID")} value={employer._id || "-"} className="sm:col-span-2" />
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t("unknownUser", "Unknown user")}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <SectionTitle title={t("serviceInformation", "Work information")} />
            {service ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail title={t("jobId", "Job ID")} value={service.jobID || payment.serviceJobId || "-"} />
                <Detail title={t("status", "Status")} value={service.status || "-"} />
                <Detail title={t("workType", "Work type")} value={service.type || "-"} />
                <Detail title={t("workSubType", "Work subtype")} value={service.subType || "-"} />
                <Detail title={t("address", "Address")} value={service.address || "-"} className="sm:col-span-2" />
                <Detail title={t("startDate", "Start date")} value={formatDate(service.startDate)} />
                <Detail title={t("createdAt", "Created at")} value={formatDate(service.createdAt)} />
                <Detail title={t("serviceId", "Work ID")} value={service._id || "-"} className="sm:col-span-2" />
                {service.socialMediaPromotion ? (
                  <DetailBlock
                    title={t("socialMediaPromotion", "Social media promotion")}
                    data={service.socialMediaPromotion}
                  />
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {payment.serviceJobId
                  ? `${t("jobId", "Job ID")}: ${payment.serviceJobId}`
                  : t("adminPromotionServicePending", "Service not linked yet")}
              </p>
            )}
          </div>

          {payment.metadata && Object.keys(payment.metadata).length > 0 ? (
            <div className="mt-4">
              <DetailBlock title={t("metadata", "Metadata")} data={payment.metadata} />
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("fullRawRecord", "Full raw database record")}
            </p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
              {JSON.stringify(payment, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#22409a]">{title}</p>
  );
}

function Detail({
  title,
  value,
  className = "",
}: {
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function DetailBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
