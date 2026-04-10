"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  clearAuth,
  getAuth,
  saveAuth,
} from "@/lib/auth";

type UserInfo = {
  _id: string;
  name?: string;
  role?: "WORKER" | "MEDIATOR" | "EMPLOYER";
  status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DISABLED" | "DELETED";
  mobile?: string;
};

type Service = {
  _id: string;
  type: string;
  subType: string;
  address: string;
  status: string;
  requirements?: Array<{ name: string; count: number }>;
};

const roleOptions: Array<UserInfo["role"]> = ["WORKER", "MEDIATOR", "EMPLOYER"];

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [myAppliedServices, setMyAppliedServices] = useState<Service[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    type: "Construction",
    subType: "",
    address: "",
    description: "",
    startDate: "",
    duration: 1,
    skillName: "",
    skillCount: 1,
  });

  const isActive = user?.status === "ACTIVE";
  const role = user?.role || "WORKER";

  const canCreateService = useMemo(() => role === "EMPLOYER" && isActive, [role, isActive]);
  const canApply = useMemo(
    () => (role === "WORKER" || role === "MEDIATOR") && isActive,
    [role, isActive],
  );

  const loadData = async () => {
    const auth = getAuth();
    if (!auth?.token) {
      setError("Login required. Please login again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const userResponse = await apiRequest<{ data: UserInfo }>("/user/info");
      setUser(userResponse.data);

      const feed = await apiRequest<{ data: Service[] }>(
        "/service/all?status=ACTIVE&page=1&limit=10",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      setServices(feed.data || []);

      if (userResponse.data?.role === "EMPLOYER") {
        const my = await apiRequest<{ data: Service[] }>(
          "/employer/my-services?status=HIRING&page=1&limit=10",
        );
        setMyServices(my.data || []);
      } else {
        const applied = await apiRequest<{ data: Service[] }>(
          "/worker/applied-services?page=1&limit=10",
        );
        setMyAppliedServices(applied.data || []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) {
      setError("Please login first.");
      return;
    }
    loadData();
  }, []);

  const handleRoleChange = async (nextRole: UserInfo["role"]) => {
    if (!user?._id || !nextRole) return;
    setError("");
    setMessage("");
    try {
      const response = await apiRequest<{ data: UserInfo; token?: string }>("/user/info", {
        method: "PATCH",
        body: JSON.stringify({ _id: user._id, role: nextRole }),
      });
      setUser((prev) =>
        prev ? { ...prev, role: response.data?.role ?? nextRole } : null,
      );
      const auth = getAuth();
      saveAuth({ ...(auth || {}), user: response.data, token: auth?.token || response.token });
      setMessage("Role updated successfully.");
      await loadData();
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Role update failed");
    }
  };

  const handleApply = async (serviceId: string) => {
    const skill = selectedSkill[serviceId];
    if (!skill) {
      setError("Please select skill before applying.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await apiRequest("/worker/apply", {
        method: "POST",
        body: JSON.stringify({ serviceId, skills: skill }),
      });
      setMessage("Applied successfully.");
      await loadData();
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Apply failed");
    }
  };

  const handleCreateService = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreateService || !user?._id) return;

    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("type", createForm.type);
      formData.append("subType", createForm.subType);
      formData.append("description", createForm.description);
      formData.append("address", createForm.address);
      formData.append("startDate", createForm.startDate);
      formData.append("duration", String(createForm.duration));
      formData.append("bookingType", "byService");
      formData.append("requirements", JSON.stringify([{ name: createForm.skillName, count: Number(createForm.skillCount) }]));
      formData.append("facilities", JSON.stringify({}));

      const auth = getAuth();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1"}/employer/add-service`,
        {
          method: "POST",
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
          body: formData,
        },
      );
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Create service failed");
      }
      setMessage("Service created successfully.");
      setCreateForm((prev) => ({ ...prev, subType: "", description: "", skillName: "" }));
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Create service failed");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#22409a]">Web App Dashboard</h1>
            <p className="text-sm text-gray-600">
              Same backend flow as mobile: role based, services, apply, my services.
            </p>
          </div>
          <button
            onClick={() => {
              clearAuth();
              window.location.href = "/";
            }}
            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
          >
            Logout
          </button>
        </div>

        {loading ? <p className="mb-4 text-sm text-gray-600">Loading...</p> : null}
        {error ? <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mb-4 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}

        {user ? (
          <section className="mb-6 rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">User:</span> {user.name || "N/A"} ({user.mobile})
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Status:</span> {user.status}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleRoleChange(option)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    role === option ? "bg-[#22409a] text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {!isActive ? (
              <p className="mt-3 rounded bg-yellow-50 p-2 text-sm text-yellow-800">
                Account is {user.status}. Some actions are restricted until activation.
              </p>
            ) : null}
          </section>
        ) : null}

        {canCreateService ? (
          <section className="mb-6 rounded-xl border border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-[#22409a]">Create Service</h2>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateService}>
              <input className="rounded border p-2" placeholder="Type" value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))} />
              <input className="rounded border p-2" placeholder="Sub Type" value={createForm.subType} onChange={(e) => setCreateForm((p) => ({ ...p, subType: e.target.value }))} required />
              <input className="rounded border p-2" placeholder="Address" value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} required />
              <input className="rounded border p-2" type="date" value={createForm.startDate} onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))} required />
              <input className="rounded border p-2" type="number" min={1} placeholder="Duration (days)" value={createForm.duration} onChange={(e) => setCreateForm((p) => ({ ...p, duration: Number(e.target.value) }))} required />
              <input className="rounded border p-2" placeholder="Required Skill" value={createForm.skillName} onChange={(e) => setCreateForm((p) => ({ ...p, skillName: e.target.value }))} required />
              <input className="rounded border p-2" type="number" min={1} placeholder="Required Count" value={createForm.skillCount} onChange={(e) => setCreateForm((p) => ({ ...p, skillCount: Number(e.target.value) }))} required />
              <textarea className="rounded border p-2 md:col-span-2" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} />
              <button className="rounded bg-[#22409a] px-4 py-2 font-semibold text-white md:col-span-2" type="submit">
                Create Service
              </button>
            </form>
          </section>
        ) : null}

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-[#22409a]">Available Services</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service._id} className="rounded border p-3">
                  <p className="font-semibold">{service.subType}</p>
                  <p className="text-sm text-gray-600">{service.address}</p>
                  <p className="mt-1 text-xs text-gray-500">Status: {service.status}</p>
                  {canApply ? (
                    <div className="mt-2 flex gap-2">
                      <select
                        className="w-full rounded border p-2 text-sm"
                        value={selectedSkill[service._id] || ""}
                        onChange={(e) =>
                          setSelectedSkill((prev) => ({ ...prev, [service._id]: e.target.value }))
                        }
                      >
                        <option value="">Select required skill</option>
                        {(service.requirements || []).map((req) => (
                          <option key={req.name} value={req.name}>
                            {req.name} ({req.count})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleApply(service._id)}
                        className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Apply
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {services.length === 0 ? <p className="text-sm text-gray-500">No services found.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-[#22409a]">
              {role === "EMPLOYER" ? "My Services" : "My Applied Services"}
            </h2>
            <div className="space-y-3">
              {(role === "EMPLOYER" ? myServices : myAppliedServices).map((service) => (
                <div key={service._id} className="rounded border p-3">
                  <p className="font-semibold">{service.subType}</p>
                  <p className="text-sm text-gray-600">{service.address}</p>
                  <p className="mt-1 text-xs text-gray-500">Status: {service.status}</p>
                </div>
              ))}
              {(role === "EMPLOYER" ? myServices : myAppliedServices).length === 0 ? (
                <p className="text-sm text-gray-500">No records found.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
