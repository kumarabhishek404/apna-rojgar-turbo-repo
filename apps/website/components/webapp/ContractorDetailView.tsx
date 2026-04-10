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
  profilePicture?: string;
  rating?: { average?: number; count?: number };
  status?: string;
  role?: string;
  serviceDetails?: { byService?: { total?: number; completed?: number; pending?: number } };
};

export default function ContractorDetailView({ id: idProp }: { id?: string }) {
  const { t } = useLanguage();
  const routeParams = useParams<{ id?: string }>();
  const contractorId = idProp || routeParams?.id;
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contractorId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) return;
    if (!contractorId) {
      setError(t("invalidContractorId", "Invalid contractor id"));
      return;
    }
    const load = async () => {
      try {
        const response = await apiRequest<{ data: UserDetail }>(`/user/detail/${contractorId}`);
        setData(response.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("failedToLoadProfile", "Failed to load profile"));
      }
    };
    load();
  }, [contractorId, t]);

  if (contractorId === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        {t("openContractorFromList", "Open a contractor from the list to view this profile.")}
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
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22409a] text-xl font-bold text-white">
          {(data.name || "C").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#22409a]">{data.name || t("contractor", "Contractor")}</h1>
          <p className="text-sm text-gray-600">{data.role || t("employer", "EMPLOYER")} - {data.status || "-"}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("mobileNumber", "Mobile")}</p><p className="font-medium">{data.mobile || "-"}</p></div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("address", "Address")}</p><p className="font-medium">{data.address || "-"}</p></div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("rating", "Rating")}</p><p className="font-medium">{data.rating?.average?.toFixed?.(1) || "0.0"} ({data.rating?.count || 0})</p></div>
        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{t("totalServices", "Total Services")}</p><p className="font-medium">{data.serviceDetails?.byService?.total || 0}</p></div>
      </div>
    </section>
  );
}
