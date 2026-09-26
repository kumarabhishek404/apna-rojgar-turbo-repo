"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import CityFilterSelect from "@/components/filters/CityFilterSelect";
import SkillFilterSelect from "@/components/filters/SkillFilterSelect";
import { useListingCities, useListingSkills } from "@/hooks/useListingCities";

type Contractor = {
  _id: string;
  name?: string;
  mobile?: string;
  address?: string;
  rating?: { average?: number };
};

export default function ContractorsPage() {
  const { t } = useLanguage();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [error, setError] = useState("");
  // Each dropdown is scoped by the other selection so every option it offers
  // still returns results.
  const { cities, loading: citiesLoading } = useListingCities({
    kind: "users",
    role: "EMPLOYER",
    skill,
  });
  const { skills, loading: skillsLoading } = useListingSkills("EMPLOYER", city);

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const response = await apiRequest<{ data: Contractor[] }>(
          "/user/all?role=EMPLOYER&page=1&limit=20",
          {
            method: "POST",
            body: JSON.stringify({
              ...(city ? { city } : {}),
              ...(skill ? { skills: [skill] } : {}),
            }),
          },
        );
        setContractors(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load contractors");
      }
    };
    load();
  }, [city, skill]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#1b357f] to-[#22409a] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <p className="mt-1 text-sm text-blue-100">Browse employers/contractors and inspect profiles.</p>
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
        {contractors.map((contractor) => (
          <div key={contractor._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-semibold text-gray-900">{contractor.name || "Unnamed Contractor"}</p>
            <p className="mt-1 text-sm text-gray-600">{contractor.mobile || "-"}</p>
            <p className="text-sm text-gray-600">{contractor.address || "-"}</p>
            <p className="mt-2 text-xs font-medium text-gray-500">
              Rating: {contractor.rating?.average?.toFixed?.(1) || "0.0"}
            </p>
            <Link
              href={`/contractors/${contractor._id}`}
              className="mt-3 inline-block rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
      {contractors.length === 0 ? <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">No contractors found.</div> : null}
    </section>
  );
}
