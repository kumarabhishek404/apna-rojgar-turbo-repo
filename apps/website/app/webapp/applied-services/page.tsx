"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

type UserInfo = { role?: string };
type Service = { _id: string; subType: string; address: string; status: string };

export default function AppliedServicesPage() {
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const userRes = await apiRequest<{ data: UserInfo }>("/user/info");
        setUserRole(userRes.data?.role || "");

        if (userRes.data?.role === "EMPLOYER") {
          setServices([]);
          return;
        }

        const response = await apiRequest<{ data: Service[] }>(
          "/worker/applied-services?page=1&limit=20",
        );
        setServices(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("loadAppliedServicesFailed", "Failed to load applied services"));
      }
    };
    load();
  }, [t]);

  const filtered = services.filter(
    (service) =>
      service.subType.toLowerCase().includes(search.toLowerCase()) ||
      service.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 to-cyan-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("appliedServices", "Applied Services")}</h1>
        <p className="mt-1 text-sm text-cyan-100">
          {t("appliedServicesSubtitle", "Track all services where you have applied.")}
        </p>
      </div>
      {error ? <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {userRole === "EMPLOYER" ? (
        <p className="rounded-xl bg-white p-5 text-sm text-gray-600 shadow">
          {t("appliedServicesRoleHint", "Applied services are available for Worker and Mediator roles.")}
        </p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4 shadow">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchAppliedService", "Search applied service by name or location")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((service) => (
              <div key={service._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-semibold text-gray-900">{t(service.subType, service.subType)}</p>
                <p className="mt-1 text-sm text-gray-600">{service.address}</p>
                <p className="mt-2 text-xs font-medium text-gray-500">
                  {t("status", "Status")}: {t(service.status.toLowerCase(), service.status)}
                </p>
                <Link
                  href={`/services/${service._id}`}
                  className="mt-3 inline-block rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t("viewDetails")}
                </Link>
              </div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">
              {t("noAppliedServicesFound", "No applied services found.")}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
