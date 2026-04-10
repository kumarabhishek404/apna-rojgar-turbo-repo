"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import CreateServiceModal from "@/components/services/CreateServiceModal";
import ServiceDetailsModal from "@/components/services/ServiceDetailsModal";
import { ServiceCard, type ServiceItem } from "@/components/services/ServiceCard";
import ListLoader from "@/components/services/ListLoader";
import type { BrowserGeo } from "@/lib/serviceDistance";
import { resolveServiceDistanceKm } from "@/lib/serviceDistance";

type UserInfo = {
  _id: string;
  role?: "WORKER" | "MEDIATOR" | "EMPLOYER";
  status?: string;
  geoLocation?: { type?: string; coordinates?: [number, number] } | null;
};

export default function MyServicesPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [browserGeo, setBrowserGeo] = useState<BrowserGeo | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Record<string, string>>({});
  const [applyingServiceId, setApplyingServiceId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const userRes = await apiRequest<{ data: UserInfo }>("/user/info");
      setUser(userRes.data);

      if (userRes.data.role === "EMPLOYER") {
        const myRes = await apiRequest<{ data: ServiceItem[] }>(
          "/employer/my-services?status=HIRING&page=1&limit=20",
        );
        setItems(myRes.data || []);
      } else {
        const myApplied = await apiRequest<{ data: ServiceItem[] }>(
          "/worker/applied-services?page=1&limit=20",
        );
        setItems(myApplied.data || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failedToLoad", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        requestAnimationFrame(() =>
          setBrowserGeo({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        );
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
    );
  }, []);

  const canCreate = user?.status === "ACTIVE";
  const canApply =
    (user?.role === "WORKER" || user?.role === "MEDIATOR") && user?.status === "ACTIVE";

  const distanceKmForService = useCallback(
    (service: ServiceItem) =>
      resolveServiceDistanceKm({
        serviceDistance: service.distance,
        serviceGeo: service.geoLocation ?? undefined,
        userGeo: user?.geoLocation ?? undefined,
        browserGeo,
      }),
    [browserGeo, user?.geoLocation],
  );

  const openDetailsModal = useCallback((serviceId: string) => {
    setSelectedServiceId(serviceId);
    setShowDetailsModal(true);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    window.setTimeout(() => setSelectedServiceId(null), 150);
  }, []);

  const onSkillChange = useCallback((serviceId: string, skill: string) => {
    setSelectedSkill((prev) => ({ ...prev, [serviceId]: skill }));
  }, []);

  const noopApply = useCallback((_serviceId: string) => {}, []);

  const applyToService = useCallback(
    async (serviceId: string, skillOverride?: string) => {
      const skill = skillOverride || selectedSkill[serviceId];
      if (!skill) {
        setError(
          t("selectSkillBeforeApply", "Please choose a required skill before applying."),
        );
        return;
      }
      setError("");
      setMessage("");
      setApplyingServiceId(serviceId);
      try {
        await apiRequest("/worker/apply", {
          method: "POST",
          body: JSON.stringify({ serviceId, skills: skill }),
        });
        setMessage(t("serviceAppliedSuccessfully", "Service applied successfully"));
        closeDetailsModal();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("applyFailed", "Apply failed"));
      } finally {
        setApplyingServiceId(null);
      }
    },
    [closeDetailsModal, load, selectedSkill, t],
  );

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.subType.toLowerCase().includes(search.toLowerCase()) ||
          item.address.toLowerCase().includes(search.toLowerCase()) ||
          (item.description || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("myServices", "My Services")}</h1>
        <p className="mt-1 text-sm text-fuchsia-100">
          {t("myServicesSubtitle", "Track services created or associated with your account.")}
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchServices", "Search Services")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
          />
          {canCreate ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#22409a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b357f]"
            >
              {t("addNewService", "Add New Service")}
            </button>
          ) : null}
        </div>
      </div>

      {loading && items.length === 0 ? <ListLoader count={4} /> : null}

      {!loading && filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <ServiceCard
              key={item._id}
              service={item}
              distanceKm={distanceKmForService(item)}
              showApply={false}
              selectedSkill={selectedSkill[item._id] || ""}
              onSkillChange={onSkillChange}
              onApply={noopApply}
              onViewDetails={openDetailsModal}
              t={t}
            />
          ))}
        </div>
      ) : null}

      {!loading && filteredItems.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">
          {t("noServicesFound", "No services found")}
        </div>
      ) : null}
      <div className="text-center text-xs text-gray-500">
        {t("totalServices", "Total Services")}: {filteredItems.length}
      </div>

      <ServiceDetailsModal
        open={showDetailsModal}
        serviceId={selectedServiceId}
        onClose={closeDetailsModal}
        canApply={canApply}
        applying={applyingServiceId === selectedServiceId}
        selectedSkill={selectedServiceId ? selectedSkill[selectedServiceId] || "" : ""}
        onSkillChange={(skill) => {
          if (!selectedServiceId) return;
          onSkillChange(selectedServiceId, skill);
        }}
        onApply={async (skill) => {
          if (!selectedServiceId) return;
          await applyToService(selectedServiceId, skill);
        }}
      />

      <CreateServiceModal
        open={showCreateModal}
        canCreate={canCreate}
        onClose={() => setShowCreateModal(false)}
        onCreated={async () => {
          setMessage(t("serviceCreatedSuccessfully", "Service created successfully."));
          await load();
        }}
      />
    </section>
  );
}
