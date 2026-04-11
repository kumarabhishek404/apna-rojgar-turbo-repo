"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatRelativePosted } from "@/lib/formatRelativePosted";
import type { GeoPoint } from "@/lib/serviceDistance";
import { formatDistanceLabel } from "@/lib/serviceDistance";

export type ServiceItem = {
  _id: string;
  title?: string;
  type?: string;
  subType: string;
  description?: string;
  address: string;
  status: string;
  images?: string[];
  distance?: number;
  bookingType?: string;
  createdAt?: string;
  startDate?: string;
  duration?: number;
  pricePerDay?: number;
  facilities?: Record<string, boolean>;
  requirements?: Array<{ name: string; count: number; payPerDay?: number }>;
  geoLocation?: GeoPoint | null;
};

const KNOWN_FACILITY_KEYS = new Set(["food", "living", "travelling", "esi_pf"]);

function facilityLabel(
  key: string,
  t: (key: string, fallback?: string) => string,
): string {
  if (KNOWN_FACILITY_KEYS.has(key)) {
    return t(key);
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  service: ServiceItem;
  /** Precomputed km from user/device to service (preferred over raw `service.distance`). */
  distanceKm?: number | null;
  onViewDetails: (serviceId: string) => void;
  t: (key: string, fallback?: string) => string;
} & (
  | {
      showApply: true;
      /** Opens the details modal and scrolls to the apply section (no inline apply on the card). */
      onOpenApplyInDetails: (serviceId: string) => void;
    }
  | { showApply: false; onOpenApplyInDetails?: undefined }
);

type RequirementEntry = NonNullable<ServiceItem["requirements"]>[number];

function RequirementBlock({
  service,
  req,
}: {
  service: ServiceItem;
  req: RequirementEntry;
}) {
  const { t } = useLanguage();
  const dayRate = req.payPerDay ?? service.pricePerDay;
  return (
    <div className="rounded-lg border border-[#22409a]/10 bg-[#f8faff] px-3 py-2.5 text-sm text-gray-700">
      <p>
        <span className="font-medium text-[#16264f]">{t("workerType")}: </span>
        {t(req.name)}
      </p>
      <p className="mt-1">
        <span className="font-medium text-[#16264f]">{t("count")}: </span>
        {req.count}
      </p>
      <p className="mt-1">
        <span className="font-medium text-[#16264f]">{t("pricePerDay")}: </span>
        {dayRate != null && dayRate > 0
          ? `₹${dayRate} ${t("perDay")}`
          : t(service.type || "unknown")}
      </p>
    </div>
  );
}

const REQUIREMENT_SLIDE_MS = 2000;

function RequirementsCarousel({
  service,
  requirements,
  t,
}: {
  service: ServiceItem;
  requirements: RequirementEntry[];
  t: Props["t"];
}) {
  const len = requirements.length;
  const [index, setIndex] = useState(0);
  const displayIndex = len > 0 ? Math.min(index, len - 1) : 0;

  useEffect(() => {
    if (len <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        const safe = Math.min(prev, len - 1);
        return (safe + 1) % len;
      });
    }, REQUIREMENT_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [len]);

  return (
    <div>
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${displayIndex * 100}%)` }}
        >
          {requirements.map((req, slideIdx) => (
            <div
              key={`${service._id}-req-slide-${slideIdx}`}
              className="min-w-full shrink-0 px-0.5"
            >
              <RequirementBlock service={service} req={req} />
            </div>
          ))}
        </div>
      </div>
      <div
        className="mt-2 flex justify-center gap-1.5"
        role="tablist"
        aria-label={t("workRequirements")}
      >
        {requirements.map((_, i) => (
          <button
            key={`${service._id}-req-dot-${i}`}
            type="button"
            role="tab"
            aria-selected={i === displayIndex}
            className={`h-1.5 rounded-full transition-all ${
              i === displayIndex
                ? "w-5 bg-[#22409a]"
                : "w-1.5 bg-[#22409a]/25 hover:bg-[#22409a]/40"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceCardComponent({
  service,
  distanceKm = null,
  showApply,
  onOpenApplyInDetails,
  onViewDetails,
  t,
}: Props) {
  const { language } = useLanguage();
  const title = service.title || service.subType;
  const descriptionText = service.description?.trim() || "";
  const created = service.createdAt ? new Date(service.createdAt) : null;
  const hasValidCreated = Boolean(created && !Number.isNaN(created.getTime()));
  const firstImage =
    service.images
      ?.map((u) => u?.trim())
      .find((u) => Boolean(u && u.length > 0)) ?? "";
  const enabledFacilities = Object.entries(service.facilities || {}).filter(
    ([, enabled]) => enabled === true,
  );
  const requirements = service.requirements || [];
  const resolvedDistanceKm =
    typeof distanceKm === "number" && Number.isFinite(distanceKm)
      ? distanceKm
      : typeof service.distance === "number" && Number.isFinite(service.distance)
        ? service.distance
        : null;
  const distanceLabel =
    resolvedDistanceKm != null ? formatDistanceLabel(resolvedDistanceKm) : "";

  const openDetails = () => onViewDetails(service._id);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="cursor-pointer overflow-hidden rounded-2xl border border-[#22409a]/10 bg-white shadow-[0_10px_30px_rgba(34,64,154,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(34,64,154,0.14)]"
      onClick={openDetails}
    >
      <div className="relative h-36 w-full shrink-0 bg-slate-100 sm:h-40">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/95"
            aria-hidden
          >
            <Image
              src="/logo.png"
              alt=""
              width={84}
              height={84}
              className="h-16 w-16 rounded-full object-cover opacity-35 sm:h-20 sm:w-20"
              priority={false}
            />
          </div>
        )}
        {hasValidCreated && service.createdAt ? (
          <div
            className="absolute right-2 top-2 z-10 max-w-[min(100%-1rem,12rem)] sm:max-w-[min(100%-1rem,14rem)]"
            title={created!.toLocaleString(language === "hi" ? "hi-IN" : "en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          >
            <span className="inline-flex w-full items-center gap-1 rounded-full border border-white/25 bg-black/55 px-2 py-1 text-[10px] font-semibold leading-tight text-white shadow-md backdrop-blur-sm sm:px-2.5 sm:text-[11px]">
              <Clock className="h-3 w-3 shrink-0 opacity-90 sm:h-3.5 sm:w-3.5" aria-hidden />
              <span className="min-w-0 truncate">
                {formatRelativePosted(service.createdAt, language)}
              </span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4 sm:p-5">
        <div className="border-b border-[#22409a]/10 pb-3">
          <h3 className="truncate text-base font-semibold text-[#16264f]">
            {t(title)}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-gray-600">
            {service.address || "-"}
          </p>
          <p className="mt-2 text-xs text-gray-600">
            <span className="font-semibold text-[#16264f]">{t("status", "Status")}: </span>
            {t(service.status?.toLowerCase?.() || "unknown", service.status || "-")}
          </p>
          {distanceLabel ? (
            <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1 text-xs font-semibold text-emerald-950 shadow-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
              <span className="truncate">
                {distanceLabel}
                <span className="ml-1 font-medium text-emerald-800/90">
                  · {t("distance")}
                </span>
              </span>
            </div>
          ) : null}
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-[#f3f6ff] px-2 py-1 text-[11px] font-medium text-[#22409a]">
              {t("workType")}: {t(service.type || "unknown")}
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#22409a]">
          {t("workRequirements")}
        </p>
        <div className="mt-2">
          {requirements.length === 0 ? (
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
              {t("noData")}
            </span>
          ) : requirements.length === 1 ? (
            <RequirementBlock service={service} req={requirements[0]!} />
          ) : (
            <RequirementsCarousel
              key={service._id}
              service={service}
              requirements={requirements}
              t={t}
            />
          )}
        </div>

        {service.duration != null && service.duration > 0 ? (
          <p className="mt-3 text-sm text-gray-700">
            <span className="font-medium text-[#16264f]">
              {t("duration")}:{" "}
            </span>
            {service.duration} {t("days", "days")}
          </p>
        ) : null}

        {descriptionText ? (
          <div className="mt-3 rounded-lg border border-[#22409a]/10 bg-[#fcfdff] p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#22409a]">
              {t("description")}
            </p>
            <p className="line-clamp-3 text-sm text-gray-600">
              {descriptionText}
            </p>
          </div>
        ) : null}

        {enabledFacilities.length > 0 ? (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#22409a]">
              {t("facilitiesProvidedByEmployer")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {enabledFacilities.map(([key]) => (
                <span
                  key={`${service._id}-f-${key}`}
                  className="rounded-full bg-[#eaf0ff] px-2.5 py-1 text-[11px] font-medium text-[#22409a]"
                >
                  {facilityLabel(key, t)}
                </span>
              ))}
            </div>
          </>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onViewDetails(service._id)}
            className="rounded-lg border border-[#22409a]/20 px-3 py-2 text-sm font-semibold text-[#22409a] transition hover:bg-[#f2f6ff]"
          >
            {t("viewDetails")}
          </button>
          {showApply ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenApplyInDetails(service._id)}
              className="rounded-lg bg-[#22409a] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1a347f]"
            >
              {t("apply")}
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

export const ServiceCard = memo(ServiceCardComponent);
