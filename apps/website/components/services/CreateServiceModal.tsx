"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ADDSERVICESTEPS, WORKTYPES } from "@/constants";
import { getAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react";

type RequirementDraft = { name: string; count: number; payPerDay: string };

type CreateFormState = {
  type: string;
  subType: string;
  address: string;
  description: string;
  startDate: string;
  duration: number;
  requirements: RequirementDraft[];
  facilities: {
    food: boolean;
    living: boolean;
    travelling: boolean;
    esi_pf: boolean;
  };
  images: File[];
};

function buildAddServiceFormData(
  form: CreateFormState,
  options: { validateOnly?: boolean; includeImages?: boolean } = {},
) {
  const fd = new FormData();
  if (options.validateOnly) {
    fd.append("validateOnly", "true");
  }
  fd.append("type", form.type);
  fd.append("subType", form.subType.trim());
  fd.append("description", form.description.trim());
  fd.append("address", form.address.trim());
  fd.append("startDate", form.startDate);
  fd.append("duration", String(form.duration));
  fd.append("bookingType", "byService");
  fd.append("requirements", JSON.stringify(form.requirements));
  fd.append("facilities", JSON.stringify(form.facilities));
  if (options.includeImages !== false) {
    form.images.forEach((file) => fd.append("images", file));
  }
  return fd;
}

type Props = {
  open: boolean;
  canCreate: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
};

export default function CreateServiceModal({ open, canCreate, onClose, onCreated }: Props) {
  const { t } = useLanguage();
  const [createStep, setCreateStep] = useState(1);
  const [createIssue, setCreateIssue] = useState("");
  const [creatingService, setCreatingService] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    type: "",
    subType: "",
    address: "",
    description: "",
    startDate: "",
    duration: 1,
    requirements: [{ name: "", count: 1, payPerDay: "" }],
    facilities: {
      food: false,
      living: false,
      travelling: false,
      esi_pf: false,
    },
    images: [],
  });
  const createFormRef = useRef(createForm);
  createFormRef.current = createForm;

  const [serverVerifyStatus, setServerVerifyStatus] = useState<
    "idle" | "checking" | "ok" | "error"
  >("idle");

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
  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#22409a] focus:ring-4 focus:ring-[#22409a]/10";

  useEffect(() => {
    if (!open || createStep !== 6 || !canCreate) {
      setServerVerifyStatus("idle");
      return;
    }

    let cancelled = false;

    const run = async () => {
      setServerVerifyStatus("checking");
      setCreateIssue("");
      try {
        const fd = buildAddServiceFormData(createFormRef.current, {
          validateOnly: true,
          includeImages: false,
        });
        const auth = getAuth();
        const base =
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
        const response = await fetch(`${base}/employer/add-service`, {
          method: "POST",
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
          body: fd,
        });
        const data = (await response.json()) as { success?: boolean; message?: string };
        if (cancelled) return;
        if (!response.ok || data?.success === false) {
          throw new Error(data?.message || "Verification failed");
        }
        setServerVerifyStatus("ok");
      } catch (e) {
        if (cancelled) return;
        setServerVerifyStatus("error");
        setCreateIssue(e instanceof Error ? e.message : "Verification failed");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, createStep, canCreate]);

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

  const closeModal = () => {
    if (creatingService) return;
    setCreateStep(1);
    setCreateIssue("");
    setServerVerifyStatus("idle");
    onClose();
  };

  const createService = async (event: FormEvent) => {
    event.preventDefault();
    if (createStep !== 6) return;
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
    try {
      const fd = buildAddServiceFormData(createForm, { includeImages: true });

      const auth = getAuth();
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
      const response = await fetch(`${base}/employer/add-service`, {
        method: "POST",
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Service create failed");
      }

      setCreateForm({
        type: "",
        subType: "",
        address: "",
        description: "",
        startDate: "",
        duration: 1,
        requirements: [{ name: "", count: 1, payPerDay: "" }],
        facilities: { food: false, living: false, travelling: false, esi_pf: false },
        images: [],
      });
      setCreateStep(1);
      onClose();
      await onCreated?.();
    } catch (e) {
      setCreateIssue(e instanceof Error ? e.message : "Service create failed");
    } finally {
      setCreatingService(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/50 bg-gradient-to-b from-white via-slate-50/95 to-slate-100/90 shadow-[0_40px_120px_rgba(15,23,42,0.4)] ring-1 ring-slate-200/60">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#22409a]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-16 h-64 w-64 rounded-full bg-[#3154bf]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#22409a]/14 via-[#3154bf]/8 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_right,rgba(49,84,191,0.12),transparent_40%)]" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/88 px-6 py-5 backdrop-blur-md">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#22409a]/25 bg-gradient-to-r from-[#22409a]/10 to-[#3154bf]/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22409a]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22409a]/80">
                Apna Rojgar
              </p>
            </div>
            <h3 className="text-[2rem] font-black tracking-tight text-[#172554]">
              {t("addNewService", "Add New Service")}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {t("createServiceFlowHint", "Complete all steps to publish your service professionally.")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            {t("close", "Close")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 md:p-6">

          {createIssue ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {createIssue}
            </p>
          ) : null}

          <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {ADDSERVICESTEPS.map((step, idx) => (
              <span
                key={step.label}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold ${
                  createStep === idx + 1
                    ? "bg-gradient-to-r from-[#22409a] to-[#3154bf] text-white shadow-[0_8px_16px_rgba(34,64,154,0.24)]"
                    : createStep > idx + 1
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                {createStep > idx + 1 ? <Check size={13} /> : null}
                {idx + 1}. {t(step.label)}
              </span>
            ))}
            <span
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold ${
                createStep === 5
                  ? "bg-gradient-to-r from-[#22409a] to-[#3154bf] text-white shadow-[0_8px_16px_rgba(34,64,154,0.24)]"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              5. {t("images")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold ${
                createStep === 6
                  ? "bg-gradient-to-r from-[#22409a] to-[#3154bf] text-white shadow-[0_8px_16px_rgba(34,64,154,0.24)]"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              6. {t("checkDetails")}
            </span>
            </div>
          </div>

          <form
            id="create-service-modal-form"
            onSubmit={createService}
            className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_10px_32px_rgba(15,23,42,0.06)] md:grid-cols-2 md:p-5"
          >
          {createStep === 1 ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:col-span-2">
                <p className="text-sm font-semibold text-[#16264f]">{t("typeAndSubType")}</p>
                <p className="mt-0.5 text-xs text-gray-500">Choose the work category and subtype.</p>
              </div>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#22409a]">{t("workType")}</span>
                <div className="relative">
                  <select
                    className={`${fieldClass} appearance-none pr-10`}
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
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#22409a]">{t("workSubType")}</span>
                <div className="relative">
                  <select
                    className={`${fieldClass} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-slate-100`}
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
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </label>
            </>
          ) : null}

          {createStep === 2 ? (
            <div className="space-y-2 md:col-span-2">
              {createForm.requirements.map((req, idx) => (
                <div key={`req-${idx}`} className="grid gap-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:grid-cols-3">
                  <div className="relative">
                    <select
                      className={`${fieldClass} appearance-none pr-9`}
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
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    className={fieldClass}
                    value={req.count}
                    onChange={(e) =>
                      setCreateForm((p) => {
                        const requirements = [...p.requirements];
                        requirements[idx] = { ...requirements[idx], count: Number(e.target.value) || 1 };
                        return { ...p, requirements };
                      })
                    }
                    placeholder={t("count")}
                  />
                  <input
                    type="number"
                    min={1}
                    className={fieldClass}
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
                className="rounded-lg border border-[#22409a]/25 bg-[#22409a]/5 px-3 py-1.5 text-sm font-semibold text-[#22409a] transition hover:bg-[#22409a]/10"
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
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:col-span-2">
                <p className="text-sm font-semibold text-[#16264f]">{t("addressDate")}</p>
                <p className="mt-0.5 text-xs text-gray-500">Set work location and start date.</p>
              </div>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-[#22409a]">{t("address")}</span>
                <input
                  required
                  className={fieldClass}
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
                  className={fieldClass}
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#22409a]">{t("duration")}</span>
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={createForm.duration}
                  onChange={(e) => setCreateForm((p) => ({ ...p, duration: Number(e.target.value) || 1 }))}
                  placeholder={t("duration")}
                />
              </label>
            </>
          ) : null}

          {createStep === 4 ? (
            <>
              <textarea
                className={`${fieldClass} md:col-span-2`}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t("description")}
                rows={3}
              />
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-semibold text-[#16264f]">{t("facilities")}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(["food", "living", "travelling", "esi_pf"] as const).map((key) => (
                    <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-[#22409a]/35">
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
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <p className="text-sm font-semibold text-[#16264f]">{t("images")}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Upload up to 3 images for better reach.</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#22409a]">{t("workImages")}</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className={fieldClass}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, images: Array.from(e.target.files || []).slice(0, 3) }))
                  }
                />
                <p className="mt-1 text-xs text-gray-500">Max 3 images</p>
                {createForm.images.length > 0 ? (
                  <p className="mt-1 text-xs text-[#22409a]">{createForm.images.length} file(s) selected</p>
                ) : null}
              </div>
            </>
          ) : null}

          {createStep === 6 ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:col-span-2">
              {serverVerifyStatus === "checking" ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#22409a]/20 bg-[#f8faff] px-3 py-2.5 text-sm font-medium text-[#22409a]">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  {t(
                    "verifyingServiceWithServer",
                    "Checking details with the server…",
                  )}
                </div>
              ) : null}
              {serverVerifyStatus === "ok" ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-sm font-semibold text-emerald-800">
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {t(
                    "serviceDetailsVerifiedReadyToSubmit",
                    "Details verified. Tap submit to publish.",
                  )}
                </div>
              ) : null}
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
        </form>
        </div>
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-gradient-to-r from-white/95 to-slate-50/95 px-4 py-3 backdrop-blur-md md:px-6">
          {createStep > 1 ? (
            <button
              type="button"
              onClick={onCreateBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#22409a] transition hover:-translate-y-0.5 hover:bg-slate-50"
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
              className="group rounded-xl bg-gradient-to-r from-[#22409a] via-[#2c4fba] to-[#3154bf] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(34,64,154,0.35)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2847ab]"
            >
              <span className="inline-flex items-center gap-2">
                {t("next")}
                <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </span>
            </button>
          ) : (
            <button
              type="submit"
              form="create-service-modal-form"
              disabled={
                creatingService ||
                serverVerifyStatus === "checking" ||
                serverVerifyStatus === "error"
              }
              className="group rounded-xl bg-gradient-to-r from-[#22409a] via-[#2c4fba] to-[#3154bf] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(34,64,154,0.35)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2847ab] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                {creatingService ? t("submitting") : t("submitAllDetails")}
                {!creatingService ? <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /> : null}
              </span>
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
