"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  ImageIcon,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

type RequirementDraft = { name: string; count: number; payPerDay: string };

type ReviewForm = {
  type: string;
  subType: string;
  address: string;
  description: string;
  startDate: string;
  duration: number;
  requirements: RequirementDraft[];
  facilities: {
    food: boolean;
    living: boolean;
    travelling: boolean;
    esi_pf: boolean;
  };
  images: File[];
};

type Props = {
  form: ReviewForm;
  verifyStatus: "idle" | "checking" | "ok" | "error";
};

function formatReviewDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailCard({
  icon: Icon,
  label,
  value,
  accent = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: "blue" | "violet" | "emerald" | "amber";
}) {
  const accents = {
    blue: "border-[#22409a]/15 bg-[#f4f7ff] text-[#22409a]",
    violet: "border-violet-200/80 bg-violet-50 text-violet-700",
    emerald: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200/80 bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accents[accent]}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[#16264f]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ServiceReviewSummary({ form, verifyStatus }: Props) {
  const { t } = useLanguage();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = form.images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.images]);

  const enabledFacilities = useMemo(
    () =>
      (["food", "living", "travelling", "esi_pf"] as const).filter(
        (key) => form.facilities[key],
      ),
    [form.facilities],
  );

  const totalWorkers = form.requirements.reduce((sum, req) => sum + (req.count || 0), 0);
  const estimatedDaily = form.requirements.reduce(
    (sum, req) => sum + (req.count || 0) * (Number(req.payPerDay) || 0),
    0,
  );

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/40 to-white shadow-[0_16px_40px_rgba(34,64,154,0.08)] md:col-span-2">
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-[#eef3ff] via-white to-[#f8faff] px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#22409a]/15 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#22409a]">
                <Sparkles className="h-3.5 w-3.5" />
                {t("checkDetails", "Verify Details")}
              </div>
              <h4 className="text-lg font-extrabold tracking-tight text-[#16264f] md:text-xl">
                {t("reviewYourWorkPost", "Review Your Work")}
              </h4>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                {t(
                  "reviewWorkPostSubtitle",
                  "Confirm everything looks correct before you publish this work post.",
                )}
              </p>
            </div>

            {verifyStatus === "checking" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#22409a]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("verifyingServiceWithServer", "Checking details with the server…")}
              </span>
            ) : null}
            {verifyStatus === "ok" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <Check className="h-3.5 w-3.5" />
                {t("serviceDetailsVerified", "Details verified")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailCard
              icon={BriefcaseBusiness}
              label={t("workType", "Work Type")}
              value={t(form.type) || "—"}
            />
            <DetailCard
              icon={BriefcaseBusiness}
              label={t("workSubType", "Work Sub Type")}
              value={t(form.subType) || "—"}
              accent="violet"
            />
            <DetailCard
              icon={MapPin}
              label={t("address", "Address")}
              value={form.address.trim() || "—"}
              accent="emerald"
            />
            <DetailCard
              icon={CalendarDays}
              label={t("startDate", "Start Date")}
              value={formatReviewDate(form.startDate)}
              accent="amber"
            />
            <DetailCard
              icon={Clock3}
              label={t("duration", "Duration")}
              value={`${form.duration} ${t("days", "days")}`}
            />
            <DetailCard
              icon={ImageIcon}
              label={t("images", "Images")}
              value={
                form.images.length > 0
                  ? `${form.images.length} ${t("imagesAttached", "attached")}`
                  : t("noImagesAdded", "No images added")
              }
              accent="emerald"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#22409a]/15 bg-[#eef3ff] text-[#22409a]">
                  <Users className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-[#16264f]">
                    {t("workRequirements", "Work Requirements")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("reviewRequirementsHint", "Workers, headcount, and daily pay")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-bold text-[#22409a]">
                  {totalWorkers} {t("workers", "Workers")}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  ₹{estimatedDaily}/{t("day", "day")}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {form.requirements.map((req, idx) => (
                <div
                  key={`review-req-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#16264f]">
                      {t(req.name) || req.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {req.count} {t("workers", "workers")} · ₹{req.payPerDay} {t("perDay", "per day")}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#22409a]/8 px-2.5 py-1 text-xs font-bold text-[#22409a]">
                    ₹{(req.count || 0) * (Number(req.payPerDay) || 0)}/{t("day", "day")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {enabledFacilities.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                {t("facilities", "Facilities")}
              </p>
              <div className="flex flex-wrap gap-2">
                {enabledFacilities.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-[#22409a]/15 bg-[#f8faff] px-3 py-1 text-xs font-semibold text-[#22409a]"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {form.description.trim() ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                {t("description", "Description")}
              </p>
              <p className="text-sm leading-relaxed text-slate-600">{form.description.trim()}</p>
            </div>
          ) : null}

          {imagePreviews.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                {t("workImages", "Work Images")}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={`preview-${idx}`}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {verifyStatus === "ok" ? (
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-white px-4 py-3.5">
              <p className="text-sm font-semibold text-emerald-900">
                {t(
                  "serviceDetailsVerifiedReadyToPublish",
                  "Everything looks good. Continue to choose how you want to publish.",
                )}
              </p>
            </div>
          ) : null}
        </div>
    </div>
  );
}
