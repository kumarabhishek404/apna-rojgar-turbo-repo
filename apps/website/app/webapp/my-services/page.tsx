"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getAuth } from "@/lib/auth";

type UserInfo = {
  _id: string;
  role?: "WORKER" | "MEDIATOR" | "EMPLOYER";
  status?: string;
};

type Service = {
  _id: string;
  subType: string;
  address: string;
  status: string;
};

export default function MyServicesPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [items, setItems] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    type: "Construction",
    subType: "",
    address: "",
    description: "",
    startDate: "",
    duration: 1,
    skillName: "",
    skillCount: 1,
  });

  const load = async () => {
    setError("");
    try {
      const userRes = await apiRequest<{ data: UserInfo }>("/user/info");
      setUser(userRes.data);

      if (userRes.data.role === "EMPLOYER") {
        const myRes = await apiRequest<{ data: Service[] }>(
          "/employer/my-services?status=HIRING&page=1&limit=20",
        );
        setItems(myRes.data || []);
      } else {
        const myApplied = await apiRequest<{ data: Service[] }>(
          "/worker/applied-services?page=1&limit=20",
        );
        setItems(myApplied.data || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canCreate = user?.role === "EMPLOYER" && user?.status === "ACTIVE";

  const createService = async (e: FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("type", form.type);
      fd.append("subType", form.subType);
      fd.append("description", form.description);
      fd.append("address", form.address);
      fd.append("startDate", form.startDate);
      fd.append("duration", String(form.duration));
      fd.append("bookingType", "byService");
      fd.append(
        "requirements",
        JSON.stringify([{ name: form.skillName, count: Number(form.skillCount) }]),
      );
      fd.append("facilities", JSON.stringify({}));

      const auth = getAuth();
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
      const response = await fetch(`${base}/employer/add-service`, {
        method: "POST",
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Service create failed");
      }
      setMessage("Service created successfully.");
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Service create failed");
    }
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow">
      <h1 className="text-2xl font-bold text-[#22409a]">
        {user?.role === "EMPLOYER" ? "My Services" : "My Applied Services"}
      </h1>
      {error ? <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}

      {canCreate ? (
        <form onSubmit={createService} className="mt-4 grid gap-2 rounded border p-3 md:grid-cols-2">
          <input className="rounded border p-2" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
          <input className="rounded border p-2" required placeholder="Sub Type" value={form.subType} onChange={(e) => setForm((p) => ({ ...p, subType: e.target.value }))} />
          <input className="rounded border p-2" required placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          <input className="rounded border p-2" type="date" required value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
          <input className="rounded border p-2" type="number" min={1} value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: Number(e.target.value) }))} />
          <input className="rounded border p-2" required placeholder="Required Skill" value={form.skillName} onChange={(e) => setForm((p) => ({ ...p, skillName: e.target.value }))} />
          <input className="rounded border p-2" type="number" min={1} value={form.skillCount} onChange={(e) => setForm((p) => ({ ...p, skillCount: Number(e.target.value) }))} />
          <textarea className="rounded border p-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <button className="rounded bg-[#22409a] px-3 py-2 font-semibold text-white md:col-span-2">Create Service</button>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item._id} className="rounded border p-3">
            <p className="font-semibold">{item.subType}</p>
            <p className="text-sm text-gray-600">{item.address}</p>
            <p className="text-xs text-gray-500">Status: {item.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
