"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID } from "@/lib/staticExportDynamicRoutes";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { formatRelativePosted } from "@/lib/formatRelativePosted";
import type { BrowserGeo, GeoPoint } from "@/lib/serviceDistance";
import { formatDistanceLabel, resolveServiceDistanceKm } from "@/lib/serviceDistance";

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
  requirements?: Array<{ name: string; count: number }>;
  employer?: { name?: string; mobile?: string };
};

export default function ServiceDetailsView({ id: idProp }: { id?: string }) {
  const { t, language } = useLanguage();
  const routeParams = useParams<{ id?: string }>();
  const serviceId = idProp || routeParams?.id;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [userGeo, setUserGeo] = useState<GeoPoint | null>(null);
  const [browserGeo, setBrowserGeo] = useState<BrowserGeo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceId || serviceId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) return;
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
    apiRequest<{ data: { geoLocation?: GeoPoint | null } }>("/user/info")
      .then((response) => {
        if (!active) return;
        requestAnimationFrame(() => setUserGeo(response.data?.geoLocation ?? null));
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

  const distanceLabel = distanceKm != null ? formatDistanceLabel(distanceKm) : "";

  const createdAtDate = service?.createdAt ? new Date(service.createdAt) : null;
  const hasValidCreated = Boolean(createdAtDate && !Number.isNaN(createdAtDate.getTime()));
  const postedRelative =
    service?.createdAt && hasValidCreated
      ? formatRelativePosted(service.createdAt, language)
      : "";

  if (serviceId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        Open a service from the list to view details.
      </div>
    );
  }

  if (!serviceId) {
    return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Invalid service id</div>;
  }

  if (error) return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!service) return <div className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow">Loading service details...</div>;

  return (
    <section className="rounded-xl bg-white p-5 shadow">
      <div className="rounded-xl bg-gradient-to-r from-[#22409a] to-indigo-500 p-5 text-white">
        <h1 className="text-2xl font-bold">{service.subType}</h1>
        <p className="mt-1 text-sm text-indigo-100">{service.type}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/20 px-2 py-1">Status: {service.status}</span>
          {service.jobID ? <span className="rounded-full bg-white/20 px-2 py-1">Job ID: {service.jobID}</span> : null}
          {service.bookingType ? <span className="rounded-full bg-white/20 px-2 py-1">Booking: {service.bookingType}</span> : null}
        </div>
      </div>

      {service.images?.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {service.images.slice(0, 3).map((src, idx) => (
            <img key={`${src}-${idx}`} src={src} alt="Service" className="h-40 w-full rounded-lg object-cover" />
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4 md:col-span-2">
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
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t("status")}</p>
          <p className="font-medium">{service.status}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Price Per Day</p>
          <p className="font-medium">{service.pricePerDay ? `₹${service.pricePerDay}` : "-"}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t("duration")}</p>
          <p className="font-medium">{service.duration || "-"} days</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">{t("startDate")}</p>
          <p className="font-medium">{service.startDate ? new Date(service.startDate).toLocaleDateString() : "-"}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700">{t("description")}</p>
        <p className="mt-1 text-sm text-gray-600">{service.description || "No description provided."}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700">{t("requirements")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(service.requirements || []).map((req) => (
            <span key={req.name} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {req.name} ({req.count})
            </span>
          ))}
        </div>
      </div>
      {service.facilities ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700">{t("facilities")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(service.facilities).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-gray-50 p-2.5 text-sm">
                <span className="font-medium text-gray-700">{key}</span>:{" "}
                <span className={value ? "text-emerald-700" : "text-rose-600"}>
                  {value ? "Available" : "Not available"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-sm font-semibold text-gray-700">{t("employer")}</p>
        <p className="text-sm text-gray-600">{service.employer?.name || "-"}</p>
        <p className="text-sm text-gray-600">{service.employer?.mobile || "-"}</p>
      </div>
    </section>
  );
}
