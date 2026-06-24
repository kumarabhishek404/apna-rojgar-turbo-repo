"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { getPromotionConfig } from "@/lib/payment";
import { isServicePromoted } from "@/lib/servicePromotion";
import { useCashfreePromotionPayment } from "@/hooks/useCashfreePromotionPayment";
import { useLanguage } from "@/components/LanguageProvider";
import CreateServiceModal from "@/components/services/CreateServiceModal";
import ServiceDetailsModal from "@/components/services/ServiceDetailsModal";
import { ServiceCard, type ServiceItem } from "@/components/services/ServiceCard";
import type { WebServiceApplyPayload } from "@/components/webapp/ServiceDetailsView";
import ListLoader from "@/components/services/ListLoader";
import type { BrowserGeo } from "@/lib/serviceDistance";
import { resolveServiceDistanceKm } from "@/lib/serviceDistance";
import { trackWebsiteEvent } from "@/lib/websiteTracking";

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
  const [applyingServiceId, setApplyingServiceId] = useState<string | null>(null);
  const [promotionAmount, setPromotionAmount] = useState(100);
  const [promotingServiceId, setPromotingServiceId] = useState<string | null>(null);
  const { runPromotionPayment } = useCashfreePromotionPayment();

  useEffect(() => {
    void getPromotionConfig()
      .then((config) => {
        if (config?.amount) setPromotionAmount(config.amount);
      })
      .catch(() => undefined);
  }, []);

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

  const applyToService = useCallback(
    async (serviceId: string, arg?: string | WebServiceApplyPayload) => {
      let body: Record<string, unknown>;

      if (arg && typeof arg === "object" && Array.isArray(arg.selectedSkills)) {
        if (arg.selectedSkills.length === 0) {
          throw new Error(
            t("selectRequirementsBeforeApply", "Select at least one requirement before applying."),
          );
        }
        body = {
          serviceId,
          skills: arg.selectedSkills,
          applicationType: arg.applicationType,
          ...(arg.applicationType === "contractor"
            ? { contractorManpower: arg.contractorManpower }
            : {}),
        };
      } else {
        throw new Error(
          t("selectRequirementsBeforeApply", "Select at least one requirement before applying."),
        );
      }

      setError("");
      setMessage("");
      setApplyingServiceId(serviceId);
      try {
        await apiRequest("/worker/apply", {
          method: "POST",
          body: JSON.stringify(body),
        });
        trackWebsiteEvent("job_applied", {
          serviceId,
          path: window.location.pathname,
          source: "website",
        });
        setMessage(t("serviceAppliedSuccessfully", "Work applied successfully"));
        closeDetailsModal();
        await load();
      } catch (e) {
        throw new Error(
          e instanceof Error ? e.message : t("applyFailed", "Apply failed"),
        );
      } finally {
        setApplyingServiceId(null);
      }
    },
    [closeDetailsModal, load, t],
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

  const handlePromoteLater = useCallback(
    async (serviceId: string) => {
      setError("");
      setMessage("");
      setPromotingServiceId(serviceId);
      try {
        await runPromotionPayment(serviceId);
        setMessage(
          t("servicePromotedSuccess", "Your work is now promoted on our social channels."),
        );
        await load();
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : t("promotionPaymentFailed", "Promotion payment failed. Please try again."),
        );
      } finally {
        setPromotingServiceId(null);
      }
    },
    [load, runPromotionPayment, t],
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("myServices", "My Works")}</h1>
        <p className="mt-1 text-sm text-fuchsia-100">
          {t("myServicesSubtitle", "Track works created or associated with your account.")}
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchServices", "Search Works")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
          />
          {canCreate ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#22409a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b357f]"
            >
              {t("newService")}
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
              showPromotionStatus={user?.role === "EMPLOYER"}
              canPromoteLater={
                user?.role === "EMPLOYER" &&
                item.status === "HIRING" &&
                item.bookingType === "byService" &&
                !isServicePromoted(item)
              }
              promotionAmount={promotionAmount}
              isPromoting={promotingServiceId === item._id}
              onPromoteLater={() => void handlePromoteLater(item._id)}
              onViewDetails={openDetailsModal}
              t={t}
            />
          ))}
        </div>
      ) : null}

      {!loading && filteredItems.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">
          {t("noServicesFound", "No works found")}
        </div>
      ) : null}
      <div className="text-center text-xs text-gray-500">
        {t("totalServices", "Total Works")}: {filteredItems.length}
      </div>

      <ServiceDetailsModal
        open={showDetailsModal}
        serviceId={selectedServiceId}
        onClose={closeDetailsModal}
        canApply={canApply}
        applying={applyingServiceId === selectedServiceId}
        onApply={async (payload) => {
          if (!selectedServiceId) return;
          await applyToService(selectedServiceId, payload);
        }}
        onAppliedMutation={() => {
          void load();
        }}
      />

      <CreateServiceModal
        open={showCreateModal}
        canCreate={canCreate}
        onClose={() => setShowCreateModal(false)}
        onCreated={async () => {
          trackWebsiteEvent("job_post_created", {
            path: window.location.pathname,
            source: "website",
          });
          setMessage(t("serviceCreatedSuccessfully", "Work created successfully."));
          await load();
        }}
      />
    </section>
  );
}
