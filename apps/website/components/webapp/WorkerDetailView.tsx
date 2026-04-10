"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID } from "@/lib/staticExportDynamicRoutes";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type UserDetail = {
  _id: string;
  name?: string;
  mobile?: string;
  address?: string;
  email?: { value?: string; isVerified?: boolean };
  description?: string;
  profilePicture?: string;
  rating?: { average?: number; count?: number };
  skills?: Array<{ skill?: string }>;
  status?: string;
  role?: string;
  serviceDetails?: {
    byService?: { total?: number; completed?: number; pending?: number; cancelled?: number };
  };
  workDetails?: {
    byService?: {
      appliedIndividually?: { total?: number; completed?: number };
      appliedByMediator?: { total?: number; completed?: number };
    };
  };
  workHistory?: Array<{
    _id: string;
    subType?: string;
    status?: string;
    address?: string;
    startDate?: string;
    duration?: number;
  }>;
  ratings?: Array<{
    _id?: string;
    score?: number;
    comment?: string;
    createdAt?: string;
    user?: { name?: string };
  }>;
};

export default function WorkerDetailView({ id: idProp }: { id?: string }) {
  const { t } = useLanguage();
  const routeParams = useParams<{ id?: string }>();
  const workerId = idProp || routeParams?.id;
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (workerId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) return;
    if (!workerId) {
      setError(t("invalidWorkerId", "Invalid worker id"));
      return;
    }
    const load = async () => {
      try {
        const response = await apiRequest<{ data: UserDetail }>(`/user/detail/${workerId}`);
        setData(response.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("failedToLoadProfile", "Failed to load profile"));
      }
    };
    load();
  }, [workerId, t]);

  if (workerId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        {t("openWorkerFromList", "Open a worker from the list to view this profile.")}
      </div>
    );
  }

  if (error) return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!data) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow">
        {t("loadingProfile", "Loading profile...")}
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow">
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white">
            {(data.name || "W").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{data.name || t("workers")}</h1>
            <p className="text-sm text-slate-200">
              {data.role || t("worker", "WORKER")} - {data.status || "-"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22409a] text-xl font-bold text-white">
          {(data.name || "W").slice(0, 1).toUpperCase()}
        </div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("mobileNumber", "Mobile")}</p><p className="font-medium">{data.mobile || "-"}</p></div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("address")}</p><p className="font-medium">{data.address || "-"}</p></div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("email", "Email")}</p><p className="font-medium">{data.email?.value || "-"}</p></div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("rating", "Rating")}</p><p className="font-medium">{data.rating?.average?.toFixed?.(1) || "0.0"} ({data.rating?.count || 0})</p></div>
      </div>
      {data.description ? (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-700">{t("about", "About")}</p>
          <p className="mt-1 text-sm text-gray-600">{data.description}</p>
        </div>
      ) : null}
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700">{t("skills")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(data.skills || []).map((skill, idx) => (
            <span key={`${skill.skill}-${idx}`} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {skill.skill}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-700">{t("serviceStats", "Service stats")}</p>
          <p className="mt-1 text-xs text-gray-600">{t("total", "Total")}: {data.serviceDetails?.byService?.total || 0}</p>
          <p className="text-xs text-gray-600">{t("completed", "Completed")}: {data.serviceDetails?.byService?.completed || 0}</p>
          <p className="text-xs text-gray-600">{t("pending", "Pending")}: {data.serviceDetails?.byService?.pending || 0}</p>
          <p className="text-xs text-gray-600">{t("cancelled", "Cancelled")}: {data.serviceDetails?.byService?.cancelled || 0}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-700">{t("workStats", "Work stats")}</p>
          <p className="mt-1 text-xs text-gray-600">
            {t("individualTotal", "Individual Total")}: {data.workDetails?.byService?.appliedIndividually?.total || 0}
          </p>
          <p className="text-xs text-gray-600">
            {t("individualCompleted", "Individual Completed")}: {data.workDetails?.byService?.appliedIndividually?.completed || 0}
          </p>
          <p className="text-xs text-gray-600">
            {t("mediatorTotal", "Mediator Total")}: {data.workDetails?.byService?.appliedByMediator?.total || 0}
          </p>
          <p className="text-xs text-gray-600">
            {t("mediatorCompleted", "Mediator Completed")}: {data.workDetails?.byService?.appliedByMediator?.completed || 0}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700">{t("workHistory")}</p>
        <div className="mt-2 space-y-2">
          {(data.workHistory || []).slice(0, 6).map((item) => (
            <div key={item._id} className="rounded-lg border border-gray-200 p-2.5">
              <p className="text-sm font-semibold text-gray-800">{item.subType || t("service", "Service")}</p>
              <p className="text-xs text-gray-600">{item.address || "-"}</p>
              <p className="text-xs text-gray-500">
                {item.startDate ? new Date(item.startDate).toLocaleDateString() : "-"} | {item.duration || 0} {t("days", "day(s)")} | {item.status || "-"}
              </p>
            </div>
          ))}
          {!data.workHistory?.length ? (
            <p className="text-xs text-gray-500">{t("noWorkHistoryAvailable", "No work history available.")}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700">{t("recentReviews", "Recent reviews")}</p>
        <div className="mt-2 space-y-2">
          {(data.ratings || []).slice(0, 5).map((rating, idx) => (
            <div key={rating._id || idx} className="rounded-lg border border-gray-200 p-2.5">
              <p className="text-xs font-semibold text-gray-800">
                {rating.user?.name || t("user", "User")} - {rating.score || 0}/5
              </p>
              <p className="text-xs text-gray-600">{rating.comment || t("noComment", "No comment")}</p>
            </div>
          ))}
          {!data.ratings?.length ? <p className="text-xs text-gray-500">{t("noReviewsYet", "No reviews yet.")}</p> : null}
        </div>
      </div>
    </section>
  );
}
