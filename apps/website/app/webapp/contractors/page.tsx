"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import Link from "next/link";

type Contractor = {
  _id: string;
  name?: string;
  mobile?: string;
  address?: string;
  rating?: { average?: number };
};

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const response = await apiRequest<{ data: Contractor[] }>(
          "/user/all?role=EMPLOYER&page=1&limit=20",
          { method: "POST", body: JSON.stringify({}) },
        );
        setContractors(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load contractors");
      }
    };
    load();
  }, []);

  const filtered = contractors.filter((contractor) => {
    const hay = `${contractor.name || ""} ${contractor.mobile || ""} ${contractor.address || ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#1b357f] to-[#22409a] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <p className="mt-1 text-sm text-blue-100">Browse employers/contractors and inspect profiles.</p>
      </div>
      {error ? <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      <div className="rounded-xl bg-white p-4 shadow">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contractor by name, phone or location"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((contractor) => (
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
      {filtered.length === 0 ? <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">No contractors found.</div> : null}
    </section>
  );
}
