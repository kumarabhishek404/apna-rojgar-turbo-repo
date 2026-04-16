"use client";

import { AnimatePresence, motion } from "framer-motion";
import ServiceDetailsModal from "@/components/services/ServiceDetailsModal";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import CreateServiceModal from "@/components/services/CreateServiceModal";
import EmptyState from "@/components/services/EmptyState";
import ServicesToolbarFilters from "@/components/services/ServicesToolbarFilters";
import type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";
import type { ServicesTabKey } from "@/components/services/HeaderTabs";
import ListLoader from "@/components/services/ListLoader";
import { ServiceCard, type ServiceItem } from "@/components/services/ServiceCard";
import type { WebServiceApplyPayload } from "@/components/webapp/ServiceDetailsView";
import type { BrowserGeo } from "@/lib/serviceDistance";
import { resolveServiceDistanceKm } from "@/lib/serviceDistance";

type UserInfo = {
  role?: "WORKER" | "MEDIATOR" | "EMPLOYER";
  status?: string;
  geoLocation?: { type?: string; coordinates?: [number, number] } | null;
};

type ServicesResponse = {
  data: ServiceItem[];
  pagination?: {
    page?: number;
    pages?: number;
    total?: number;
    limit?: number;
  };
};

export type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";

export type ServicesPageShellProps = {
  /** When set, only that tab’s data and UI are used (e.g. `"applied"` on the applied-jobs route). */
  forcedTab?: ServicesTabKey;
  /** When true, inline filter bar is hidden (controls shown in dashboard header). */
  filtersMerged?: boolean;
  onFiltersMergedChange?: (merged: boolean) => void;
  onRegisterToolbar?: (api: ServicesToolbarApi | null) => void;
  scrollContainerRef?: RefObject<HTMLElement | null>;
};

const MERGE_SCROLL_Y = 72;
const UNMERGE_SCROLL_Y = 36;

export default function ServicesPage(props: ServicesPageShellProps = {}) {
  const {
    forcedTab,
    filtersMerged = false,
    onFiltersMergedChange,
    onRegisterToolbar,
    scrollContainerRef,
  } = props;
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const globalQuery = (searchParams.get("global") || "").trim();
  const shouldAutoOpenCreate = searchParams.get("create") === "1";
  const [user, setUser] = useState<UserInfo | null>(null);
  const activeTab: ServicesTabKey = forcedTab ?? "all";
  const [servicesByTab, setServicesByTab] = useState<Record<ServicesTabKey, ServiceItem[]>>({
    all: [],
    my: [],
    applied: [],
  });
  const [pageByTab, setPageByTab] = useState<Record<ServicesTabKey, number>>({
    all: 1,
    my: 1,
    applied: 1,
  });
  const [hasMoreByTab, setHasMoreByTab] = useState<Record<ServicesTabKey, boolean>>({
    all: true,
    my: true,
    applied: true,
  });
  const [initializedByTab, setInitializedByTab] = useState<Record<ServicesTabKey, boolean>>({
    all: false,
    my: false,
    applied: false,
  });
  const [loadingByTab, setLoadingByTab] = useState<Record<ServicesTabKey, boolean>>({
    all: false,
    my: false,
    applied: false,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "nearest" | "more">("latest");
  const [browserGeo, setBrowserGeo] = useState<BrowserGeo | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [applyingServiceId, setApplyingServiceId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [scrollModalToApply, setScrollModalToApply] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const inFlightRef = useRef<Record<ServicesTabKey, boolean>>({
    all: false,
    my: false,
    applied: false,
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchForTab = useCallback(async (tab: ServicesTabKey, targetPage = 1, append = false) => {
    if (inFlightRef.current[tab]) return;
    inFlightRef.current[tab] = true;
    setLoadingByTab((prev) => ({ ...prev, [tab]: true }));
    if (!append) setError("");

    try {
      let servicesRes: ServicesResponse;
      if (tab === "all") {
        servicesRes = await apiRequest<ServicesResponse>(
          `/service/all?status=ACTIVE&page=${targetPage}&limit=10`,
          { method: "POST", body: JSON.stringify({}) },
        );
      } else if (tab === "my") {
        servicesRes = await apiRequest<ServicesResponse>(
          `/employer/my-services?page=${targetPage}&limit=10`,
        );
      } else {
        servicesRes = await apiRequest<ServicesResponse>(
          `/worker/applied-services?page=${targetPage}&limit=10`,
        );
      }

      const nextBatch = servicesRes.data || [];
      setServicesByTab((prev) => ({
        ...prev,
        [tab]: append ? [...prev[tab], ...nextBatch] : nextBatch,
      }));

      const currentPage = servicesRes.pagination?.page || targetPage;
      const totalPages = servicesRes.pagination?.pages || 1;
      setPageByTab((prev) => ({ ...prev, [tab]: currentPage }));
      setHasMoreByTab((prev) => ({ ...prev, [tab]: currentPage < totalPages }));
      setInitializedByTab((prev) => ({ ...prev, [tab]: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load services");
    } finally {
      inFlightRef.current[tab] = false;
      setLoadingByTab((prev) => ({ ...prev, [tab]: false }));
    }
  }, []);

  useEffect(() => {
    apiRequest<{ data: UserInfo }>("/user/info")
      .then((response) => setUser(response.data))
      .catch(() => undefined);
  }, []);

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

  useEffect(() => {
    if (!initializedByTab[activeTab]) {
      fetchForTab(activeTab, 1, false);
    }
  }, [activeTab, fetchForTab, initializedByTab]);

  useEffect(() => {
    if (globalQuery) {
      setSearch(globalQuery);
    }
  }, [globalQuery]);

  const loadMore = useCallback(() => {
    if (!hasMoreByTab[activeTab] || loadingByTab[activeTab]) return;
    fetchForTab(activeTab, pageByTab[activeTab] + 1, true);
  }, [activeTab, fetchForTab, hasMoreByTab, loadingByTab, pageByTab]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) loadMore();
      },
      { threshold: 0, rootMargin: "0px 0px 28% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const canApply =
    (user?.role === "WORKER" || user?.role === "MEDIATOR") && user?.status === "ACTIVE";
  const canCreate = user?.status === "ACTIVE";

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

  const services = servicesByTab[activeTab];
  const filtered = useMemo(
    () =>
      services?.filter(
        (service) =>
          service.subType.toLowerCase().includes(search.toLowerCase()) ||
          service.address.toLowerCase().includes(search.toLowerCase()) ||
          (service.description || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [services, search],
  );
  const ordered = useMemo(() => {
    const items = [...filtered];
    if (sortBy === "nearest") {
      items.sort((a, b) => {
        const da = typeof a.distance === "number" ? a.distance : Number.POSITIVE_INFINITY;
        const db = typeof b.distance === "number" ? b.distance : Number.POSITIVE_INFINITY;
        return da - db;
      });
      return items;
    }
    if (sortBy === "more") {
      items.sort(
        (a, b) => (b.requirements?.length || 0) - (a.requirements?.length || 0),
      );
      return items;
    }
    items.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    return items;
  }, [filtered, sortBy]);

  const applyToService = async (
    serviceId: string,
    arg?: string | WebServiceApplyPayload,
  ) => {
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
      setMessage(t("serviceAppliedSuccessfully", "Applied successfully."));
      setInitializedByTab((prev) => ({ ...prev, applied: false }));
      fetchForTab("all", 1, false);
      fetchForTab("applied", 1, false);
      closeDetailsModal();
    } catch (e) {
      throw new Error(
        e instanceof Error ? e.message : t("applyFailed", "Apply failed"),
      );
    } finally {
      setApplyingServiceId(null);
    }
  };

  const openCreateModal = useCallback(() => {
    if (!canCreate) {
      setError(t("onlyActiveUsersCanCreateServices", "Only active users can create services."));
      return;
    }
    setShowCreateModal(true);
  }, [canCreate, t]);

  useEffect(() => {
    if (!shouldAutoOpenCreate) return;
    openCreateModal();
  }, [openCreateModal, shouldAutoOpenCreate]);

  const toolbarApi = useMemo<ServicesToolbarApi>(
    () => ({
      search,
      setSearch,
      sortBy,
      setSortBy,
      openCreateModal,
      canCreate,
      showCreateButton: activeTab !== "applied",
      searchPlaceholder:
        activeTab === "applied"
          ? t("searchAppliedService", "Search applied service by name or location")
          : undefined,
      t,
    }),
    [search, sortBy, setSearch, setSortBy, canCreate, openCreateModal, t, activeTab],
  );

  useEffect(() => {
    onRegisterToolbar?.(toolbarApi);
    return () => onRegisterToolbar?.(null);
  }, [toolbarApi, onRegisterToolbar]);

  const mergedScrollLatchRef = useRef(false);

  useEffect(() => {
    mergedScrollLatchRef.current = filtersMerged;
  }, [filtersMerged]);

  useEffect(() => {
    if (!onFiltersMergedChange || !scrollContainerRef?.current) return;
    const main = scrollContainerRef.current;

    const getScrollY = () => {
      if (main.scrollHeight > main.clientHeight + 2) return main.scrollTop;
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const tick = () => {
      const y = getScrollY();
      let next = mergedScrollLatchRef.current;
      if (!mergedScrollLatchRef.current && y > MERGE_SCROLL_Y) next = true;
      if (mergedScrollLatchRef.current && y < UNMERGE_SCROLL_Y) next = false;
      if (next !== mergedScrollLatchRef.current) {
        mergedScrollLatchRef.current = next;
        onFiltersMergedChange(next);
      }
    };

    main.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
    return () => {
      main.removeEventListener("scroll", tick);
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, [onFiltersMergedChange, scrollContainerRef]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const openDetailsModal = useCallback(
    (serviceId: string, options?: { scrollToApply?: boolean }) => {
      setSelectedServiceId(serviceId);
      setShowDetailsModal(true);
      setScrollModalToApply(options?.scrollToApply === true);
    },
    [],
  );

  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setScrollModalToApply(false);
    // Delay unmount to keep closing animation smooth.
    window.setTimeout(() => setSelectedServiceId(null), 150);
  }, []);

  const loading = loadingByTab[activeTab];
  const hasMore = hasMoreByTab[activeTab];
  const emptyConfig =
    activeTab === "my"
      ? {
          title: t("noServicesFound", "No services found"),
          subtitle: t("noPostedServicesYet", "You have not posted any service yet."),
          ctaLabel: t("addNewService", "Add New Service"),
          ctaHref: "/my-work",
        }
      : activeTab === "applied"
        ? {
            title: t("noAppliedServices", "No applied services"),
            subtitle: t("noAppliedServicesYet", "You have not applied to any service yet."),
            ctaLabel: t("browseServices", "Browse Services"),
            ctaHref: "/all-services",
          }
        : {
            title: t("noServicesFound", "No services found"),
            subtitle: t("tryChangeFilters", "Try changing filters or search terms."),
            ctaLabel: t("resetSearch", "Reset Search"),
            ctaHref: "/all-services",
          };

  return (
    <section className="space-y-4 pb-6">
      {error ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}

      {!filtersMerged ? (
        <div className="min-w-0 rounded-2xl border border-[#22409a]/10 bg-gradient-to-r from-[#f8faff] to-[#eef3ff] p-3 shadow-sm">
          <ServicesToolbarFilters api={toolbarApi} />
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {loading && services.length === 0 ? <ListLoader count={4} /> : null}

          {!loading && ordered.length === 0 ? (
            <EmptyState
              title={emptyConfig.title}
              subtitle={emptyConfig.subtitle}
              ctaLabel={emptyConfig.ctaLabel}
              ctaHref={emptyConfig.ctaHref}
            />
          ) : null}

          {ordered.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ordered.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  distanceKm={distanceKmForService(service)}
                  {...(activeTab === "all" && canApply
                    ? {
                        showApply: true as const,
                        onOpenApplyInDetails: (id: string) =>
                          openDetailsModal(id, { scrollToApply: true }),
                      }
                    : { showApply: false as const })}
                  onViewDetails={openDetailsModal}
                  t={t}
                />
              ))}
            </div>
          ) : null}

          {loading && services.length > 0 ? <ListLoader count={2} /> : null}
          {hasMore && ordered.length > 0 ? <div ref={loadMoreRef} className="h-8 w-full" /> : null}
          {!hasMore && ordered.length > 0 ? (
            <p className="text-center text-xs text-gray-500">
              {t("endOfList", "You reached the end of the list.")}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <ServiceDetailsModal
        open={showDetailsModal}
        serviceId={selectedServiceId}
        onClose={closeDetailsModal}
        canApply={canApply && activeTab !== "applied"}
        applying={applyingServiceId === selectedServiceId}
        scrollToApply={scrollModalToApply}
        onApply={async (payload) => {
          if (!selectedServiceId) return;
          await applyToService(selectedServiceId, payload);
        }}
        onAppliedMutation={() => {
          setInitializedByTab((prev) => ({ ...prev, applied: false }));
          void fetchForTab("all", 1, false);
          void fetchForTab("applied", 1, false);
        }}
      />

      <CreateServiceModal
        open={showCreateModal}
        canCreate={canCreate}
        onClose={closeCreateModal}
        onCreated={async () => {
          setMessage("Service created successfully.");
          await Promise.all([fetchForTab("all", 1, false), fetchForTab("my", 1, false)]);
        }}
      />
    </section>
  );
}
