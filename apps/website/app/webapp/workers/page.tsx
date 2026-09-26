"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import CityFilterSelect from "@/components/filters/CityFilterSelect";
import SkillFilterSelect from "@/components/filters/SkillFilterSelect";
import { useListingCities, useListingSkills } from "@/hooks/useListingCities";

type Worker = {
  _id: string;
  name?: string;
  role?: string;
  status?: string;
  mobile?: string;
  address?: string;
  description?: string;
  distance?: number;
  rating?: { average?: number };
  skills?: Array<{ skill?: string }>;
};

export default function WorkersPage() {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [error, setError] = useState("");
  // Each dropdown is scoped by the other selection so every option it offers
  // still returns results.
  const { cities, loading: citiesLoading } = useListingCities({
    kind: "users",
    role: "WORKER",
    skill,
  });
  const { skills, loading: skillsLoading } = useListingSkills("WORKER", city);

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const response = await apiRequest<{ data: Worker[] }>(
          "/user/all?role=WORKER&page=1&limit=20",
          {
            method: "POST",
            body: JSON.stringify({
              ...(city ? { city } : {}),
              ...(skill ? { skills: [skill] } : {}),
            }),
          },
        );
        setWorkers(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load workers");
      }
    };
    load();
  }, [city, skill]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("workers")}</h1>
        <p className="mt-1 text-sm text-slate-200">Discover skilled workers with profile details and ratings.</p>
      </div>
      {error ? <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow sm:flex-row">
        <CityFilterSelect
          cities={cities}
          value={city}
          onChange={setCity}
          loading={citiesLoading}
          className="w-full sm:max-w-xs"
          t={t}
        />
        <SkillFilterSelect
          skills={skills}
          value={skill}
          onChange={setSkill}
          loading={skillsLoading}
          className="w-full sm:max-w-xs"
          t={t}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {workers.map((worker) => (
          <div key={worker._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-lg font-semibold text-gray-900">{worker.name || "Unnamed Worker"}</p>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {worker.role || "WORKER"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{worker.mobile || "-"}</p>
            <p className="text-sm text-gray-600">{worker.address || "-"}</p>
            {worker.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{worker.description}</p>
            ) : null}
            <p className="mt-2 text-xs font-medium text-gray-500">
              Rating: {worker.rating?.average?.toFixed?.(1) || "0.0"}
            </p>
            {typeof worker.distance === "number" ? (
              <p className="text-xs text-gray-500">Distance: {worker.distance.toFixed(1)} km</p>
            ) : null}
            <p className="text-xs text-gray-500">Status: {worker.status || "-"}</p>
            <p className="mt-1 text-xs text-gray-500">
              Skills: {(worker.skills || []).map((s) => s.skill).filter(Boolean).join(", ") || "-"}
            </p>
            <Link
              href={`/workers/${worker._id}`}
              className="mt-3 inline-block rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t("viewProfile", "View Profile")}
            </Link>
          </div>
        ))}
      </div>
      {workers.length === 0 ? <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">No workers found.</div> : null}
    </section>
  );
}
