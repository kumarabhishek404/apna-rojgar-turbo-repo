"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { CheckCircle2, Clock, MapPin, Share2, ShieldCheck, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import {
  STATIC_EXPORT_DYNAMIC_LITERAL_ID,
  STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID,
} from "@/lib/staticExportDynamicRoutes";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { formatRelativePosted } from "@/lib/formatRelativePosted";
import type { BrowserGeo, GeoPoint } from "@/lib/serviceDistance";
import { formatDistanceLabel, resolveServiceDistanceKm } from "@/lib/serviceDistance";
import { shareServiceToApps } from "@/lib/shareService";

type AppliedUserEntry = {
  user?: string | { _id?: string };
  status?: string;
  workers?: Array<{ worker?: string | { _id?: string }; status?: string }>;
};

type ServiceDetail = {
  _id: string;
  type: string;
  subType: string;
  description?: string;
  address: string;
  status: string;
  jobID?: string;
  pricePerDay?: number;
  bookingType?: string;
  facilities?: Record<string, boolean>;
  images?: string[];
  duration?: number;
  startDate?: string;
  createdAt?: string;
  distance?: number;
  geoLocation?: GeoPoint | null;
  requirements?: Array<{ name: string; count: number; payPerDay?: number }>;
  employer?: { _id?: string; name?: string; mobile?: string } | string;
  appliedUsers?: AppliedUserEntry[];
};

function idFromRef(ref: string | { _id?: string } | undefined | null): string {
  if (ref == null) return "";
  if (typeof ref === "object" && ref._id != null) return String(ref._id);
  return String(ref);
}

/** Matches worker `cancel-apply` eligibility: pending direct application or pending as worker under mediator. */
export function viewerHasPendingApplication(
  service: { appliedUsers?: AppliedUserEntry[] } | null,
  userId: string | null,
): boolean {
  if (!service?.appliedUsers?.length || !userId) return false;
  const uid = String(userId);
  for (const app of service.appliedUsers) {
    if (app.status !== "PENDING") continue;
    if (idFromRef(app.user) === uid) return true;
    for (const w of app.workers || []) {
      if (w.status === "PENDING" && idFromRef(w.worker) === uid) return true;
    }
  }
  return false;
}

export type WebServiceApplyPayload = {
  selectedSkills: string[];
  applicationType: "individual" | "contractor";
  contractorManpower?: number;
};

type ServiceDetailsViewProps = {
  id?: string;
  canApply?: boolean;
  applying?: boolean;
  onApply?: (payload: WebServiceApplyPayload) => Promise<void> | void;
  /** After cancel-apply succeeds; parent can refetch lists. */
  onAppliedMutation?: () => void;
};

export default function ServiceDetailsView({
  id: idProp,
  canApply = false,
  applying = false,
  onApply,
  onAppliedMutation,
}: ServiceDetailsViewProps) {
  const { t, language } = useLanguage();
  const routeParams = useParams<{ id?: string }>();
  const serviceId = idProp || routeParams?.id;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userGeo, setUserGeo] = useState<GeoPoint | null>(null);
  const [browserGeo, setBrowserGeo] = useState<BrowserGeo | null>(null);
  const [error, setError] = useState("");
  const [applySelections, setApplySelections] = useState<string[]>([]);
  const [applyAsContractor, setApplyAsContractor] = useState(false);
  const [contractorManpowerInput, setContractorManpowerInput] = useState("");
  const [applySubmitError, setApplySubmitError] = useState("");
  const [showCancelApplyConfirm, setShowCancelApplyConfirm] = useState(false);
  const [cancelApplyError, setCancelApplyError] = useState("");

  const requirementNames = useMemo(
    () =>
      Array.from(
        new Set(
          (service?.requirements || [])
            .map((r) => r?.name)
            .filter((n): n is string => Boolean(n)),
        ),
      ),
    [service?.requirements],
  );

  const allSelected =
    requirementNames.length > 0 &&
    requirementNames.every((n) => applySelections.includes(n));

  const toggleRequirement = (name: string) => {
    setApplySubmitError("");
    setApplySelections((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleSelectAllRequirements = () => {
    setApplySubmitError("");
    if (allSelected) setApplySelections([]);
    else setApplySelections([...requirementNames]);
  };

  useEffect(() => {
    setApplySubmitError("");
  }, [serviceId, service?._id]);

  useEffect(() => {
    if (
      !serviceId ||
      serviceId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID ||
      serviceId === STATIC_EXPORT_DYNAMIC_LITERAL_ID
    ) {
      return;
    }
    const load = async () => {
      try {
        const data = await apiRequest<{ data: ServiceDetail }>(`/service/service-info/${serviceId}`);
        setService(data.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load service details");
      }
    };
    load();
  }, [serviceId]);

  useEffect(() => {
    let active = true;
    apiRequest<{ data: { _id?: string; geoLocation?: GeoPoint | null } }>("/user/info")
      .then((response) => {
        if (!active) return;
        requestAnimationFrame(() => {
          const id = response.data?._id;
          setCurrentUserId(id != null ? String(id) : null);
          setUserGeo(response.data?.geoLocation ?? null);
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        requestAnimationFrame(() =>
          setBrowserGeo({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        );
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
    );
  }, []);

  const distanceKm = useMemo(() => {
    if (!service) return null;
    return resolveServiceDistanceKm({
      serviceDistance: service.distance,
      serviceGeo: service.geoLocation ?? undefined,
      userGeo: userGeo ?? undefined,
      browserGeo,
    });
  }, [browserGeo, service, userGeo]);

  /** Backend omits populated employer for the owner; `employer` is then a raw id string. */
  const employerIsUnpopulatedId = typeof service?.employer === "string";

  const isViewerEmployer = useMemo(() => {
    if (!service) return false;
    if (employerIsUnpopulatedId) return true;
    if (!currentUserId) return false;
    const emp = service.employer;
    const employerId =
      emp && typeof emp === "object" && emp._id != null ? String(emp._id) : null;
    return Boolean(employerId && employerId === String(currentUserId));
  }, [currentUserId, employerIsUnpopulatedId, service]);

  const hasPendingApplication = useMemo(
    () => Boolean(currentUserId && viewerHasPendingApplication(service, currentUserId)),
    [service, currentUserId],
  );

  const reloadService = async () => {
    if (
      !serviceId ||
      serviceId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID ||
      serviceId === STATIC_EXPORT_DYNAMIC_LITERAL_ID
    ) {
      return;
    }
    const data = await apiRequest<{ data: ServiceDetail }>(`/service/service-info/${serviceId}`);
    setService(data.data);
  };

  const executeCancelApply = async () => {
    if (!service?._id || !currentUserId) return;
    setCancelApplyError("");
    try {
      await apiRequest("/worker/cancel-apply", {
        method: "POST",
        body: JSON.stringify({ serviceId: service._id }),
      });
      await reloadService();
      onAppliedMutation?.();
    } catch (e) {
      setCancelApplyError(e instanceof Error ? e.message : t("applyFailed", "Apply failed"));
    }
  };

  const distanceLabel = distanceKm != null ? formatDistanceLabel(distanceKm) : "";
  const statusLabel = service?.status ? t(String(service.status).toLowerCase(), service.status) : "-";
  const metricCards = [
    {
      label: t("status"),
      value: statusLabel,
      accent: "from-[#eef3ff] to-[#f8faff]",
    },
    {
      label: t("duration"),
      value: `${service?.duration || "-"} ${t("days", "days")}`,
      accent: "from-[#eef9ff] to-[#f8fcff]",
    },
    {
      label: t("startDate"),
      value: service?.startDate ? new Date(service.startDate).toLocaleDateString() : "-",
      accent: "from-[#f3f5ff] to-[#fbfcff]",
    },
  ];

  const createdAtDate = service?.createdAt ? new Date(service.createdAt) : null;
  const hasValidCreated = Boolean(createdAtDate && !Number.isNaN(createdAtDate.getTime()));
  const postedRelative =
    service?.createdAt && hasValidCreated
      ? formatRelativePosted(service.createdAt, language)
      : "";
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !service?._id) return "";
    return `${window.location.origin}/services/${service._id}`;
  }, [service?._id]);

  const hiringOpen = service?.status === "HIRING";

  const handleSubmitApply = async () => {
    if (!onApply || applySelections.length === 0) return;
    setApplySubmitError("");

    let payload: WebServiceApplyPayload;
    if (applyAsContractor) {
      const n = Number(contractorManpowerInput);
      if (!Number.isInteger(n) || n < 1) {
        setApplySubmitError(
          t(
            "enterValidManpower",
            "Please enter how many workers you can provide (a whole number, at least 1).",
          ),
        );
        return;
      }
      payload = {
        selectedSkills: applySelections,
        applicationType: "contractor",
        contractorManpower: n,
      };
    } else {
      payload = {
        selectedSkills: applySelections,
        applicationType: "individual",
      };
    }

    try {
      await Promise.resolve(onApply(payload));
    } catch (e) {
      setApplySubmitError(
        e instanceof Error ? e.message : t("applyFailed", "Apply failed"),
      );
    }
  };

  const handleShareService = async () => {
    if (!service) return;
    const { ok, copied } = await shareServiceToApps(service, {
      language,
      shareUrl,
      appName: t("brandName", "Apna Rojgar"),
    });
    if (!ok) {
      alert(t("shareFailed", "Could not open share. Try again."));
      return;
    }
    if (copied) {
      alert(t("copySuccess", "Link copied! Share it with your friends and neighbors."));
    }
  };

  if (serviceId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        {t("openServiceFromList", "Open a service from the list to view details.")}
      </div>
    );
  }

  if (!serviceId) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        {t("invalidServiceId", "Invalid service id")}
      </div>
    );
  }

  if (error) return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!service) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow">
        {t("loadingServiceDetails", "Loading service details...")}
      </div>
    );
  }

  return (
    <>
    <section className="rounded-2xl border border-[#22409a]/10 bg-white p-5 shadow-[0_16px_40px_rgba(34,64,154,0.12)]">
      <div className="rounded-2xl bg-gradient-to-r from-[#1c3788] via-[#22409a] to-[#355ed8] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <h1 className="text-2xl font-bold">{t(service.subType, service.subType)}</h1>
        <p className="mt-1 text-sm text-indigo-100">{t(service.type, service.type)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
            {t("status", "Status")}: {statusLabel}
          </span>
          {service.jobID ? (
            <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
              {t("jobId", "Job ID")}: {service.jobID}
            </span>
          ) : null}
          {service.bookingType ? (
            <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
              {t("booking", "Booking")}: {t(service.bookingType, service.bookingType)}
            </span>
          ) : null}
          {hasPendingApplication && !isViewerEmployer ? (
            <span className="rounded-full border border-emerald-300/70 bg-emerald-500/35 px-2.5 py-1 font-semibold text-white shadow-sm">
              {t("appliedServiceTag", "Applied")}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleShareService}
            className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold transition hover:bg-white/30"
          >
            <Share2 className="h-3.5 w-3.5" />
            {t("shareService", "Share job")}
          </button>
        </div>
      </div>

      {service.images?.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {service.images.slice(0, 3).map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={src}
              alt={t("serviceImage", "Service")}
              className="h-40 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-white p-4 md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">{t("address")}</p>
              <p className="font-medium text-gray-900">{service.address}</p>
            </div>
            {distanceLabel || postedRelative ? (
              <div className="flex shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[11rem] sm:max-w-[16rem] sm:items-end">
                {distanceLabel ? (
                  <div className="flex w-full items-center gap-2 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-3 py-2.5 shadow-sm sm:w-full">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-800">
                      <MapPin className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/85">
                        {t("distance")}
                      </p>
                      <p className="text-base font-bold leading-tight text-emerald-950">{distanceLabel}</p>
                    </div>
                  </div>
                ) : null}
                {postedRelative ? (
                  <div
                    className="flex w-full items-center gap-2 rounded-xl border border-[#22409a]/15 bg-gradient-to-br from-[#f8faff] via-white to-indigo-50/80 px-3 py-2.5 shadow-sm sm:w-full"
                    title={
                      createdAtDate
                        ? createdAtDate.toLocaleString(language === "hi" ? "hi-IN" : "en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : undefined
                    }
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#22409a]/10 text-[#22409a]">
                      <Clock className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#16264f]/85">
                        {t("posted")}
                      </p>
                      <p className="text-base font-bold leading-tight text-[#16264f]">{postedRelative}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {metricCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border border-[#22409a]/10 bg-gradient-to-br ${card.accent} p-3.5 shadow-sm`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/75">{card.label}</p>
            <p className="mt-1 text-lg font-bold leading-tight text-[#16264f]">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-[#16264f]">{t("description")}</p>
        <p className="mt-1 rounded-xl border border-[#22409a]/10 bg-[#fafcff] p-3 text-sm leading-relaxed text-gray-700">
          {service.description || t("noDescriptionProvided", "No description provided.")}
        </p>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-[#16264f]">{t("requirements")}</p>
        <div className="mt-2 grid gap-2">
          {(service.requirements || []).map((req, idx) => (
            <div
              key={`${req.name}-${idx}`}
              className="rounded-xl border border-[#22409a]/12 bg-gradient-to-r from-[#f8faff] to-[#f2f6ff] p-3"
            >
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/70">
                    {t("workerType", "Worker Type")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#16264f]">{t(req.name)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/70">
                    {t("count", "Count")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#16264f]">{req.count}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/70">
                    {t("pricePerDay", "Price/Day")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#16264f]">
                    {req.payPerDay != null ? `₹${req.payPerDay}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {(service.requirements || []).length === 0 ? (
            <div className="rounded-xl border border-[#22409a]/10 bg-[#fafcff] p-3 text-sm text-gray-600">
              {t("noRequirementsProvided", "No requirements provided.")}
            </div>
          ) : null}
        </div>
      </div>
      {service.facilities ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#16264f]">{t("facilities")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(service.facilities).map(([key, value]) => (
              <div
                key={key}
                className={`rounded-xl border p-3 text-sm ${
                  value
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-rose-200 bg-rose-50/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold capitalize text-[#16264f]">
                    {t(key, key.replace(/_/g, " "))}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      value ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {value ? t("available", "Available") : t("notAvailable", "Not available")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!isViewerEmployer ? (
        <div className="mt-5 rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-[#f3f6ff] p-4">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#e8efff] px-2.5 py-1 text-xs font-semibold text-[#22409a]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("employer")}
          </div>
          <p className="text-base font-semibold text-[#16264f]">
            {typeof service.employer === "object" && service.employer != null
              ? service.employer.name || "-"
              : "-"}
          </p>
          <p className="text-sm text-gray-700">
            {typeof service.employer === "object" && service.employer != null
              ? service.employer.mobile || "-"
              : "-"}
          </p>
        </div>
      ) : null}
      {hasPendingApplication && !isViewerEmployer ? (
        <div
          id="webapp-service-pending-application-section"
          className="mt-5 rounded-xl border border-[#22409a]/15 bg-gradient-to-br from-[#f0f4ff] via-white to-[#f8faff] p-4 shadow-sm"
        >
          <p className="text-base font-bold text-[#16264f]">
            {t("appliedServiceTag", "Applied")}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t(
              "pendingApplicationDetailsHint",
              "Your application is pending. You can withdraw it with the button below.",
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowCancelApplyConfirm(true)}
            disabled={showCancelApplyConfirm}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border-2 border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
          >
            {t("cancelApply")}
          </button>
          {cancelApplyError ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {cancelApplyError}
            </p>
          ) : null}
        </div>
      ) : null}
      {canApply && !isViewerEmployer && !hasPendingApplication ? (
        <div
          id="webapp-service-apply-section"
          className="mt-5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-[#f8faff] p-4 shadow-sm"
        >
          <p className="text-base font-bold text-[#16264f]">
            {t("applyToThisJob", "Apply to this job")}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t(
              "applyFlowHint",
              "Choose which roles you are applying for, then tell us if you are one worker or a contractor with a team.",
            )}
          </p>
          {!hiringOpen ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t("serviceNotHiring", "This job is not accepting applications right now.")}
            </p>
          ) : requirementNames.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">
              {t("noRequirementsToApply", "This job has no listed requirements yet.")}
            </p>
          ) : (
            <>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#16264f]">
                  {t("whichRequirementsApply", "Which requirements are you applying for?")}
                </p>
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-[#22409a]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAllRequirements}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {t("selectAllRequirements", "All requirements")}
                </label>
                <ul className="mt-2 space-y-2">
                  {requirementNames.map((name) => (
                    <li key={name}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#22409a]/10 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={applySelections.includes(name)}
                          onChange={() => toggleRequirement(name)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300"
                        />
                        <span className="font-medium text-[#16264f]">{t(name, name)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 border-t border-[#22409a]/10 pt-4">
                <p className="text-sm font-semibold text-[#16264f]">
                  {t("howAreYouApplying", "How are you applying?")}
                </p>
                <div className="mt-2 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#22409a]/10 bg-white px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="apply-mode"
                      checked={!applyAsContractor}
                      onChange={() => {
                        setApplySubmitError("");
                        setApplyAsContractor(false);
                      }}
                      className="h-4 w-4"
                    />
                    <span>{t("applyAsIndividualLabour", "I am an individual worker (myself only)")}</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#22409a]/10 bg-white px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="apply-mode"
                      checked={applyAsContractor}
                      onChange={() => {
                        setApplySubmitError("");
                        setApplyAsContractor(true);
                      }}
                      className="h-4 w-4"
                    />
                    <span>{t("applyAsContractor", "I am a contractor / I have a team")}</span>
                  </label>
                </div>
              </div>

              {applyAsContractor ? (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[#16264f]" htmlFor="manpower-count">
                    {t("howManyLabour", "How many workers can you provide?")}
                  </label>
                  <input
                    id="manpower-count"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={contractorManpowerInput}
                    onChange={(e) => setContractorManpowerInput(e.target.value)}
                    placeholder={t("manpowerPlaceholder", "e.g. 5")}
                    className="mt-1 w-full max-w-xs rounded-xl border border-[#22409a]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#22409a]"
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSubmitApply()}
                disabled={
                  applying ||
                  applySelections.length === 0 ||
                  (applyAsContractor &&
                    (!contractorManpowerInput.trim() ||
                      !Number.isInteger(Number(contractorManpowerInput)) ||
                      Number(contractorManpowerInput) < 1))
                }
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
              >
                {applying ? t("applying", "Applying...") : t("submitApplication", "Submit application")}
              </button>
              {applySubmitError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {applySubmitError}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
    <ConfirmDialog
      open={showCancelApplyConfirm}
      onClose={() => setShowCancelApplyConfirm(false)}
      title={t("confirmCancelApplyTitle", "Withdraw application?")}
      description={t(
        "confirmCancelApply",
        "Cancel your application for this job? You can apply again later if the job is still open.",
      )}
      variant="danger"
      confirmLabel={t("cancelApply")}
      pendingLabel={t("cancellingApply", "Cancelling...")}
      onConfirm={executeCancelApply}
    />
    </>
  );
}
