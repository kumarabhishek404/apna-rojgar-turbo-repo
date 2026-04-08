"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest, getAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { ADDSERVICESTEPS, WORKTYPES } from "@/constants";
import EmptyState from "@/components/services/EmptyState";
import ServicesToolbarFilters from "@/components/services/ServicesToolbarFilters";
import type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";
import type { ServicesTabKey } from "@/components/services/HeaderTabs";
import ListLoader from "@/components/services/ListLoader";
import { ServiceCard, type ServiceItem } from "@/components/services/ServiceCard";
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

type RequirementDraft = { name: string; count: number; payPerDay: string };

export type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";

export type ServicesPageShellProps = {
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
    filtersMerged = false,
    onFiltersMergedChange,
    onRegisterToolbar,
    scrollContainerRef,
  } = props;
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const globalQuery = (searchParams.get("global") || "").trim();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeTab] = useState<ServicesTabKey>("all");
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
  const [selectedSkill, setSelectedSkill] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "nearest" | "more">("latest");
  const [browserGeo, setBrowserGeo] = useState<BrowserGeo | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [createIssue, setCreateIssue] = useState("");
  const [creatingService, setCreatingService] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: "",
    subType: "",
    address: "",
    description: "",
    startDate: "",
    duration: 1,
    requirements: [{ name: "", count: 1, payPerDay: "" }] as RequirementDraft[],
    facilities: {
      food: false,
      living: false,
      travelling: false,
      esi_pf: false,
    },
    images: [] as File[],
  });

  const selectedWorkType = useMemo(
    () => WORKTYPES.find((item: { value: string }) => item.value === createForm.type),
    [createForm.type],
  );
  const availableSubTypes = useMemo(
    () =>
      (selectedWorkType?.subTypes || []) as Array<{
        label: string;
        value: string;
        workerTypes?: Array<{ label: string; value: string }>;
      }>,
    [selectedWorkType],
  );
  const selectedSubType = useMemo(
    () => availableSubTypes.find((item) => item.value === createForm.subType),
    [availableSubTypes, createForm.subType],
  );
  const availableWorkerTypes = (selectedSubType?.workerTypes || []) as Array<{
    label: string;
    value: string;
  }>;

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
  const canCreate = user?.role === "EMPLOYER" && user?.status === "ACTIVE";

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
      services.filter(
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

  const applyToService = async (serviceId: string) => {
    const skill = selectedSkill[serviceId];
    if (!skill) {
      setError("Please choose a required skill before applying.");
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
      setInitializedByTab((prev) => ({ ...prev, applied: false }));
      fetchForTab("all", 1, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    }
  };

  const onSkillChange = useCallback((serviceId: string, skill: string) => {
    setSelectedSkill((prev) => ({ ...prev, [serviceId]: skill }));
  }, []);

  const openCreateModal = useCallback(() => {
    if (!canCreate) {
      setError("Only active employers can create services.");
      return;
    }
    setCreateIssue("");
    setCreateStep(1);
    setShowCreateModal(true);
  }, [canCreate]);

  const toolbarApi = useMemo<ServicesToolbarApi>(
    () => ({
      search,
      setSearch,
      sortBy,
      setSortBy,
      openCreateModal,
      canCreate,
      t,
    }),
    [search, sortBy, setSearch, setSortBy, canCreate, openCreateModal, t],
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
    if (creatingService) return;
    setCreateStep(1);
    setCreateIssue("");
    setShowCreateModal(false);
  }, [creatingService]);

  const createService = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!canCreate) return;
      if (!createForm.type || !createForm.subType) {
        setCreateIssue("Please select work type and work subtype.");
        return;
      }
      if (!createForm.address.trim() || !createForm.startDate) {
        setCreateIssue("Please fill all required fields.");
        return;
      }
      if (!createForm.requirements.length) {
        setCreateIssue("Please add at least one requirement.");
        return;
      }
      const invalidRequirement = createForm.requirements.find(
        (req) => !req.name || req.count < 1 || !req.payPerDay || Number(req.payPerDay) <= 0,
      );
      if (invalidRequirement) {
        setCreateIssue("Please complete requirement details (worker, count and pay/day).");
        return;
      }

      setCreatingService(true);
      setCreateIssue("");
      setMessage("");
      try {
        const fd = new FormData();
        fd.append("type", createForm.type);
        fd.append("subType", createForm.subType.trim());
        fd.append("description", createForm.description.trim());
        fd.append("address", createForm.address.trim());
        fd.append("startDate", createForm.startDate);
        fd.append("duration", String(createForm.duration));
        fd.append("bookingType", "byService");
        fd.append("requirements", JSON.stringify(createForm.requirements));
        fd.append("facilities", JSON.stringify(createForm.facilities));
        createForm.images.forEach((file) => fd.append("images", file));

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
        setShowCreateModal(false);
        setCreateIssue("");
        setCreateForm((prev) => ({
          ...prev,
          type: "",
          subType: "",
          address: "",
          description: "",
          startDate: "",
          duration: 1,
          requirements: [{ name: "", count: 1, payPerDay: "" }],
          images: [],
          facilities: {
            food: false,
            living: false,
            travelling: false,
            esi_pf: false,
          },
        }));
        setCreateStep(1);
        await Promise.all([fetchForTab("all", 1, false), fetchForTab("my", 1, false)]);
      } catch (e) {
        setCreateIssue(e instanceof Error ? e.message : "Service create failed");
      } finally {
        setCreatingService(false);
      }
    },
    [canCreate, createForm, fetchForTab],
  );

  const loading = loadingByTab[activeTab];
  const hasMore = hasMoreByTab[activeTab];
  const onCreateNext = () => {
    if (createStep === 1 && (!createForm.type || !createForm.subType)) {
      setCreateIssue("Please select work type and subtype.");
      return;
    }
    if (
      createStep === 2 &&
      createForm.requirements.some(
        (req) => !req.name || req.count < 1 || !req.payPerDay || Number(req.payPerDay) <= 0,
      )
    ) {
      setCreateIssue("Complete requirement details first.");
      return;
    }
    if (
      createStep === 3 &&
      (!createForm.address.trim() || !createForm.startDate || createForm.duration < 1)
    ) {
      setCreateIssue("Please complete address, date and duration.");
      return;
    }
    if (createStep === 5 && createForm.images.length > 3) {
      setCreateIssue("You can upload maximum 3 images.");
      return;
    }
    setCreateIssue("");
    setCreateStep((s) => Math.min(s + 1, 6));
  };

  const onCreateBack = () => {
    setCreateStep((s) => Math.max(s - 1, 1));
  };
  const emptyConfig =
    activeTab === "my"
      ? {
          title: "No services found",
          subtitle: "You have not posted any service yet.",
          ctaLabel: "Add New Service",
          ctaHref: "/my-work",
        }
      : activeTab === "applied"
        ? {
            title: "No applied services",
            subtitle: "You have not applied to any service yet.",
            ctaLabel: "Browse Services",
            ctaHref: "/all-services",
          }
        : {
            title: "No services found",
            subtitle: "Try changing filters or search terms.",
            ctaLabel: "Reset Search",
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
                  showApply={activeTab === "all" && canApply}
                  selectedSkill={selectedSkill[service._id] || ""}
                  onSkillChange={onSkillChange}
                  onApply={applyToService}
                  t={t}
                />
              ))}
            </div>
          ) : null}

          {loading && services.length > 0 ? <ListLoader count={2} /> : null}
          {hasMore && ordered.length > 0 ? <div ref={loadMoreRef} className="h-8 w-full" /> : null}
          {!hasMore && ordered.length > 0 ? (
            <p className="text-center text-xs text-gray-500">You reached the end of the list.</p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#16264f]">Add New Service</h3>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            {createIssue ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {createIssue}
              </p>
            ) : null}

            <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
              {ADDSERVICESTEPS.map((step, idx) => (
                <span
                  key={step.label}
                  className={`rounded-full px-2.5 py-1 ${
                    createStep === idx + 1
                      ? "bg-[#22409a] text-white"
                      : "border border-[#22409a]/20 text-[#22409a]"
                  }`}
                >
                  {idx + 1}. {t(step.label)}
                </span>
              ))}
              <span
                className={`rounded-full px-2.5 py-1 ${
                  createStep === 5 ? "bg-[#22409a] text-white" : "border border-[#22409a]/20 text-[#22409a]"
                }`}
              >
                5. {t("images")}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 ${
                  createStep === 6 ? "bg-[#22409a] text-white" : "border border-[#22409a]/20 text-[#22409a]"
                }`}
              >
                6. {t("checkDetails")}
              </span>
            </div>

            <form onSubmit={createService} className="grid gap-4 md:grid-cols-2">
              {createStep === 1 ? (
                <>
                  <div className="rounded-xl border border-[#22409a]/10 bg-[#f8faff] p-3 md:col-span-2">
                    <p className="text-sm font-semibold text-[#16264f]">{t("typeAndSubType")}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Choose the work category and subtype.</p>
                  </div>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-[#22409a]">{t("workType")}</span>
                    <select
                      className="w-full rounded-xl border border-[#22409a]/20 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
                      value={createForm.type}
                      onChange={(e) =>
                        setCreateForm((p) => ({
                          ...p,
                          type: e.target.value,
                          subType: "",
                          requirements: [{ name: "", count: 1, payPerDay: "" }],
                        }))
                      }
                    >
                      <option value="">{t("selectWorkType")}</option>
                      {WORKTYPES.map((item: { value: string; label: string }) => (
                        <option key={item.value} value={item.value}>
                          {t(item.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-[#22409a]">{t("workSubType")}</span>
                    <select
                      className="w-full rounded-xl border border-[#22409a]/20 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
                      value={createForm.subType}
                      onChange={(e) => setCreateForm((p) => ({ ...p, subType: e.target.value }))}
                      disabled={!createForm.type}
                    >
                      <option value="">{t("selectWorkSubType")}</option>
                      {availableSubTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {createStep === 2 ? (
                <div className="space-y-2 md:col-span-2">
                  {createForm.requirements.map((req, idx) => (
                    <div key={`req-${idx}`} className="grid gap-2 rounded-xl border p-3 md:grid-cols-3">
                      <select
                        className="rounded-lg border border-[#22409a]/20 px-3 py-2 text-sm outline-none"
                        value={req.name}
                        onChange={(e) =>
                          setCreateForm((p) => {
                            const requirements = [...p.requirements];
                            requirements[idx] = { ...requirements[idx], name: e.target.value };
                            return { ...p, requirements };
                          })
                        }
                      >
                        <option value="">{t("selectAWorker")}</option>
                        {availableWorkerTypes.map((worker) => (
                          <option key={worker.value} value={worker.value}>
                            {t(worker.label)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-[#22409a]/20 px-3 py-2 text-sm outline-none"
                        value={req.count}
                        onChange={(e) =>
                          setCreateForm((p) => {
                            const requirements = [...p.requirements];
                            requirements[idx] = {
                              ...requirements[idx],
                              count: Number(e.target.value) || 1,
                            };
                            return { ...p, requirements };
                          })
                        }
                        placeholder={t("count")}
                      />
                      <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-[#22409a]/20 px-3 py-2 text-sm outline-none"
                        value={req.payPerDay}
                        onChange={(e) =>
                          setCreateForm((p) => {
                            const requirements = [...p.requirements];
                            requirements[idx] = { ...requirements[idx], payPerDay: e.target.value };
                            return { ...p, requirements };
                          })
                        }
                        placeholder={t("pricePerDay")}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-sm font-medium text-[#22409a] hover:underline"
                    onClick={() =>
                      setCreateForm((p) => ({
                        ...p,
                        requirements: [...p.requirements, { name: "", count: 1, payPerDay: "" }],
                      }))
                    }
                  >
                    + {t("addNeed")}
                  </button>
                </div>
              ) : null}

              {createStep === 3 ? (
                <>
                  <div className="rounded-xl border border-[#22409a]/10 bg-[#f8faff] p-3 md:col-span-2">
                    <p className="text-sm font-semibold text-[#16264f]">{t("addressDate")}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Set work location and start date.</p>
                  </div>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-[#22409a]">{t("address")}</span>
                    <input
                      required
                      className="w-full rounded-xl border border-[#22409a]/20 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
                      value={createForm.address}
                      onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder={t("address")}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-[#22409a]">{t("startDate")}</span>
                    <input
                      required
                      type="date"
                      className="w-full rounded-xl border border-[#22409a]/20 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-[#22409a]">{t("duration")}</span>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-[#22409a]/20 px-3 py-2 text-sm outline-none focus:border-[#22409a]"
                      value={createForm.duration}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, duration: Number(e.target.value) || 1 }))
                      }
                      placeholder={t("duration")}
                    />
                  </label>
                </>
              ) : null}

              {createStep === 4 ? (
                <>
                  <textarea
                    className="rounded-xl border border-[#22409a]/20 px-3 py-2 text-sm outline-none focus:border-[#22409a] md:col-span-2"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder={t("description")}
                    rows={3}
                  />
                  <div className="md:col-span-2">
                    <p className="mb-1 text-sm font-semibold text-[#16264f]">{t("facilities")}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(["food", "living", "travelling", "esi_pf"] as const).map((key) => (
                        <label key={key} className="flex items-center gap-2 rounded-lg border p-2">
                          <input
                            type="checkbox"
                            checked={createForm.facilities[key]}
                            onChange={(e) =>
                              setCreateForm((p) => ({
                                ...p,
                                facilities: { ...p.facilities, [key]: e.target.checked },
                              }))
                            }
                          />
                          <span>{t(key)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {createStep === 5 ? (
                <>
                  <div className="md:col-span-2">
                    <div className="rounded-xl border border-[#22409a]/10 bg-[#f8faff] p-3">
                      <p className="text-sm font-semibold text-[#16264f]">{t("images")}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Upload up to 3 images for better reach.
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-[#22409a]">
                      {t("workImages")}
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        setCreateForm((p) => ({
                          ...p,
                          images: Array.from(e.target.files || []).slice(0, 3),
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">Max 3 images</p>
                    {createForm.images.length > 0 ? (
                      <p className="mt-1 text-xs text-[#22409a]">
                        {createForm.images.length} file(s) selected
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {createStep === 6 ? (
                <div className="space-y-2 rounded-xl border bg-[#f8faff] p-3 text-sm md:col-span-2">
                  <p><span className="font-semibold">{t("workType")}:</span> {t(createForm.type)}</p>
                  <p><span className="font-semibold">{t("workSubType")}:</span> {t(createForm.subType)}</p>
                  <p><span className="font-semibold">{t("address")}:</span> {createForm.address}</p>
                  <p><span className="font-semibold">{t("startDate")}:</span> {createForm.startDate}</p>
                  <p><span className="font-semibold">{t("duration")}:</span> {createForm.duration}</p>
                  <p><span className="font-semibold">{t("images")}:</span> {createForm.images.length}</p>
                  <p><span className="font-semibold">{t("workRequirements")}:</span></p>
                  <ul className="ml-4 list-disc space-y-1">
                    {createForm.requirements.map((req, idx) => (
                      <li key={`review-req-${idx}`}>
                        {t(req.name)} - {req.count} - ₹{req.payPerDay} {t("perDay")}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="md:col-span-2 flex items-center justify-between">
                {createStep > 1 ? (
                  <button
                    type="button"
                    onClick={onCreateBack}
                    className="rounded-xl border border-[#22409a]/20 px-4 py-2 text-sm font-semibold text-[#22409a]"
                  >
                    {t("back")}
                  </button>
                ) : (
                  <span />
                )}

                {createStep < 6 ? (
                  <button
                    type="button"
                    onClick={onCreateNext}
                    className="rounded-xl bg-[#22409a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a347f]"
                  >
                    {t("next")}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={creatingService}
                    className="rounded-xl bg-[#22409a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a347f] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creatingService ? t("submitting") : t("submitAllDetails")}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
