"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { apiRequest, getAuth, saveAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { resolveLanguage } from "@/lib/i18n";
import {
  BriefcaseBusiness,
  ChartColumnIncreasing,
  Mail,
  MapPin,
  Phone,
  Camera,
  ShieldCheck,
} from "lucide-react";

type Skill = { skill: string };
type UserInfo = {
  _id: string;
  name?: string;
  email?: { value?: string };
  address?: string;
  mobile?: string;
  gender?: string;
  role?: "WORKER" | "MEDIATOR" | "EMPLOYER";
  status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DISABLED" | "DELETED";
  profilePicture?: string;
  skills?: Skill[];
  locale?: string | { language?: string };
  likedUsers?: Array<unknown>;
  likedServices?: Array<unknown>;
  workDetails?: {
    byService?: {
      appliedIndividually?: {
        total?: number;
        completed?: number;
        applied?: number;
        selected?: number;
        cancelledApply?: { byMySelf?: number; byEmployer?: number };
        cancelledSelection?: { byMySelf?: number; byEmployer?: number };
      };
      appliedByMediator?: {
        total?: number;
        completed?: number;
        applied?: number;
        selected?: number;
        cancelledApply?: { byMySelf?: number; byMediator?: number; byEmployer?: number };
        cancelledSelection?: { byMySelf?: number; byMediator?: number; byEmployer?: number };
      };
    };
  };
  serviceDetails?: {
    byService?: {
      total?: number;
      completed?: number;
      pending?: number;
      cancelled?: number;
    };
  };
};

export default function ProfilePage() {
  const { t, setLanguage } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [form, setForm] = useState({ name: "", role: "WORKER", email: "", gender: "", address: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const workerTotals = {
    total:
      (user?.workDetails?.byService?.appliedIndividually?.total || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.total || 0),
    completed:
      (user?.workDetails?.byService?.appliedIndividually?.completed || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.completed || 0),
    pending:
      (user?.workDetails?.byService?.appliedIndividually?.applied || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.applied || 0) +
      (user?.workDetails?.byService?.appliedIndividually?.selected || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.selected || 0),
    cancelled:
      (user?.workDetails?.byService?.appliedIndividually?.cancelledApply?.byMySelf || 0) +
      (user?.workDetails?.byService?.appliedIndividually?.cancelledApply?.byEmployer || 0) +
      (user?.workDetails?.byService?.appliedIndividually?.cancelledSelection?.byMySelf || 0) +
      (user?.workDetails?.byService?.appliedIndividually?.cancelledSelection?.byEmployer || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.cancelledApply?.byMySelf || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.cancelledApply?.byMediator || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.cancelledApply?.byEmployer || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.cancelledSelection?.byMySelf || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.cancelledSelection?.byMediator || 0) +
      (user?.workDetails?.byService?.appliedByMediator?.cancelledSelection?.byEmployer || 0),
  };
  const employerTotals = {
    total: user?.serviceDetails?.byService?.total || 0,
    completed: user?.serviceDetails?.byService?.completed || 0,
    pending: user?.serviceDetails?.byService?.pending || 0,
    cancelled: user?.serviceDetails?.byService?.cancelled || 0,
  };

  const load = async () => {
    setError("");
    try {
      const data = await apiRequest<{ data: UserInfo }>("/user/info");
      setUser(data.data);
      const localeValue =
        typeof data.data.locale === "string"
          ? data.data.locale
          : (data.data.locale as { language?: string } | undefined)?.language;
      if (localeValue) {
        setLanguage(resolveLanguage(localeValue));
      }
      setForm({
        name: data.data.name || "",
        role: data.data.role || "WORKER",
        email: data.data.email?.value || "",
        gender: data.data.gender || "",
        address: data.data.address || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?._id) return;
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("_id", user._id);
      fd.append("name", form.name);
      fd.append("role", form.role);
      fd.append("email", form.email);
      fd.append("gender", form.gender);
      fd.append("address", form.address);

      const auth = getAuth();
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
      const response = await fetch(`${base}/user/info`, {
        method: "PATCH",
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Profile update failed");
      }
      const currentAuth = getAuth();
      saveAuth({
        ...(currentAuth || {}),
        user: data?.data,
        token: currentAuth?.token || data?.token,
      });
      setMessage("Profile updated successfully.");
      setShowEditModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed");
    }
  };

  const updateProfilePhoto = async (nextFile: File) => {
    if (!user?._id) return;
    setError("");
    setMessage("");
    setUpdatingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("_id", user._id);
      fd.append("profileImage", nextFile);

      const auth = getAuth();
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
      const response = await fetch(`${base}/user/info`, {
        method: "PATCH",
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Profile image update failed");
      }
      const currentAuth = getAuth();
      saveAuth({
        ...(currentAuth || {}),
        user: data?.data,
        token: currentAuth?.token || data?.token,
      });
      setMessage(t("profilePhotoUpdated", "Profile photo updated successfully."));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile image update failed");
    } finally {
      setUpdatingPhoto(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-amber-700 to-orange-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("myProfile")}</h1>
        <p className="mt-1 text-sm text-orange-100">
          {t(
            "profileSubtitle",
            "Professional account settings, role controls, and skill management.",
          )}
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="group relative rounded-full"
              title={t("changeProfilePhoto", "Change Profile Photo")}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || t("user", "User")}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-[#22409a]/15"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22409a] text-xl font-bold text-white">
                  {(user?.name || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#22409a] text-white shadow">
                <Camera className="h-3.5 w-3.5" />
              </span>
              <span className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition group-hover:bg-black/10" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const nextFile = e.target.files?.[0];
                if (!nextFile) return;
                void updateProfilePhoto(nextFile);
                e.currentTarget.value = "";
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-[#16264f]">
                {user?.name || t("user", "User")}
              </p>
              <p className="text-[11px] text-[#22409a]">
                {updatingPhoto
                  ? t("updatingProfilePhoto", "Updating profile photo...")
                  : t("tapToChangePhoto", "Tap photo to change")}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {user?.mobile || "-"}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email?.value || "-"}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {user?.address || t("addressNotAdded", "Address not added")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="rounded-lg bg-[#22409a] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1b357f]"
            >
              {t("editProfile", "Edit Profile")}
            </button>
            <span className="inline-flex items-center rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#22409a]">
              {t(user?.role?.toLowerCase?.() || "user", user?.role || t("user", "User"))}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t(user?.status?.toLowerCase?.() || "active", user?.status || "ACTIVE")}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {t("skills", "Skills")}: {user?.skills?.length || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-[#16264f]">
          <ChartColumnIncreasing className="h-4 w-4" />
          <h2 className="text-lg font-semibold">{t("activityOverview", "Activity Overview")}</h2>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          {t(
            "activityOverviewHint",
            "These stats show your work participation and your service posting performance.",
          )}
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-[#eef3ff] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#16264f]">
              <ChartColumnIncreasing className="h-4 w-4" />
              <h3 className="text-sm font-semibold">{t("workInformation", "Work Information")}</h3>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              {t(
                "workerStatsHint",
                "Tracks jobs you worked on, completed, currently pending, or cancelled.",
              )}
            </p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-[#22409a]">{workerTotals.total}</p>
                <p className="text-xs text-gray-600">{t("totalTasks", "Total Tasks")}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-emerald-700">{workerTotals.completed}</p>
                <p className="text-xs text-gray-600">{t("completed", "Completed")}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-amber-700">{workerTotals.pending}</p>
                <p className="text-xs text-gray-600">{t("pending", "Pending")}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-rose-700">{workerTotals.cancelled}</p>
                <p className="text-xs text-gray-600">{t("cancelled", "Cancelled")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-[#eef3ff] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#16264f]">
              <BriefcaseBusiness className="h-4 w-4" />
              <h3 className="text-sm font-semibold">
                {t("serviceInformation", "Service Information")}
              </h3>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              {t(
                "serviceStatsHint",
                "Tracks services posted by you and their current progress status.",
              )}
            </p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-[#22409a]">{employerTotals.total}</p>
                <p className="text-xs text-gray-600">{t("totalServices", "Total Services")}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-emerald-700">{employerTotals.completed}</p>
                <p className="text-xs text-gray-600">{t("completed", "Completed")}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-amber-700">{employerTotals.pending}</p>
                <p className="text-xs text-gray-600">{t("pending", "Pending")}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-xl font-bold text-rose-700">{employerTotals.cancelled}</p>
                <p className="text-xs text-gray-600">{t("cancelled", "Cancelled")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3">
          <form
            onSubmit={updateProfile}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#16264f]">
                {t("editProfileDetails", "Edit Profile Details")}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("close", "Close")}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                placeholder={t("name", "Name")}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserInfo["role"] || "WORKER" }))}
              >
                <option value="WORKER">{t("worker", "Worker")}</option>
                <option value="MEDIATOR">{t("mediator", "Mediator")}</option>
                <option value="EMPLOYER">{t("employer", "Employer")}</option>
              </select>
              <input
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                placeholder={t("email", "Email")}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                value={form.gender}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              >
                <option value="">{t("selectGender", "Select Gender")}</option>
                <option value="MALE">{t("male", "Male")}</option>
                <option value="FEMALE">{t("female", "Female")}</option>
                <option value="OTHER">{t("other", "Other")}</option>
              </select>
              <input
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm md:col-span-2"
                placeholder={t("address")}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("cancel", "Cancel")}
              </button>
              <button className="rounded-lg bg-[#22409a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b357f]">
                {t("saveProfile")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
