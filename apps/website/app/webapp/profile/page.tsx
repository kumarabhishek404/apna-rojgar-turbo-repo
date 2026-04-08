"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest, getAuth, saveAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { resolveLanguage } from "@/lib/i18n";

type Skill = { skill: string };
type UserInfo = {
  _id: string;
  name?: string;
  email?: { value?: string };
  address?: string;
  mobile?: string;
  role?: "WORKER" | "MEDIATOR" | "EMPLOYER";
  status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "DISABLED" | "DELETED";
  profilePicture?: string;
  skills?: Skill[];
  locale?: string | { language?: string };
};

const roles: Array<UserInfo["role"]> = ["WORKER", "MEDIATOR", "EMPLOYER"];

export default function ProfilePage() {
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [newSkill, setNewSkill] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isDisabled = useMemo(() => user?.status === "DISABLED", [user?.status]);

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
        email: data.data.email?.value || "",
        address: data.data.address || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    }
  };

  const updateLanguage = async (nextLanguage: "en" | "hi") => {
    if (!user?._id) return;
    setLanguage(nextLanguage);
    try {
      const response = await apiRequest<{ data: UserInfo; token?: string }>("/user/info", {
        method: "PATCH",
        body: JSON.stringify({
          _id: user._id,
          locale: { language: nextLanguage },
        }),
      });
      const auth = getAuth();
      saveAuth({ ...(auth || {}), user: response.data, token: auth?.token || response?.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Language update failed");
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
      fd.append("email", form.email);
      fd.append("address", form.address);
      if (file) {
        fd.append("profileImage", file);
      }

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
      setFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed");
    }
  };

  const changeRole = async (role: UserInfo["role"]) => {
    if (!user?._id || !role) return;
    setError("");
    setMessage("");
    try {
      const data = await apiRequest<{ data: UserInfo; token?: string }>("/user/info", {
        method: "PATCH",
        body: JSON.stringify({ _id: user._id, role }),
      });
      const auth = getAuth();
      saveAuth({ ...(auth || {}), user: data?.data, token: auth?.token || data?.token });
      setMessage("Role updated successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Role update failed");
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    setError("");
    setMessage("");
    try {
      await apiRequest("/user/add-skill", {
        method: "POST",
        body: JSON.stringify({ skill: { skill: newSkill.trim() } }),
      });
      setMessage("Skill added.");
      setNewSkill("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Skill add failed");
    }
  };

  const removeSkill = async (skillName: string) => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/user/remove-skill", {
        method: "POST",
        body: JSON.stringify({ skillName }),
      });
      setMessage("Skill removed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Skill remove failed");
    }
  };

  const runAccountAction = async (action: "disable" | "enable" | "delete") => {
    setError("");
    setMessage("");
    const map = {
      disable: { path: "/user/disable-account", method: "DELETE" as const },
      enable: { path: "/user/enable-account", method: "PATCH" as const },
      delete: { path: "/user/delete-account", method: "DELETE" as const },
    };
    try {
      await apiRequest(map[action].path, { method: map[action].method });
      setMessage(`Account ${action} action completed.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account action failed");
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#22409a] to-indigo-500 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("myProfile")}</h1>
        <p className="mt-1 text-sm text-indigo-100">
          Professional account settings, role controls, and skill management.
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={updateProfile} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{t("profile")}</h2>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22409a] text-xl font-bold text-white">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.mobile || "-"}</p>
            </div>
          </div>
          {user?.profilePicture ? (
            <div className="mb-3 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
              Current image uploaded
            </div>
          ) : null}
          <input
            className="mb-2 w-full rounded-lg border border-gray-200 p-2.5 text-sm"
            placeholder={t("name", "Name")}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="mb-2 w-full rounded-lg border border-gray-200 p-2.5 text-sm"
            placeholder={t("email", "Email")}
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            className="mb-2 w-full rounded-lg border border-gray-200 p-2.5 text-sm"
            placeholder={t("address")}
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
          <input
            className="mb-3 w-full rounded-lg border border-gray-200 p-2.5 text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button className="rounded-lg bg-[#22409a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1b357f]">
            {t("saveProfile")}
          </button>
        </form>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{t("role")}</h2>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => changeRole(role)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    user?.role === role ? "bg-[#22409a] text-white" : "bg-gray-100"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">{t("status")}: {user?.status}</p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{t("language")}</h2>
            <select
              value={language}
              onChange={(e) => updateLanguage(e.target.value as "en" | "hi")}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
            >
              <option value="en">{t("english")}</option>
              <option value="hi">{t("hindi")}</option>
            </select>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{t("skills")}</h2>
            <div className="mb-2 flex gap-2">
              <input
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                placeholder={t("addSkill", "Add skill")}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <button onClick={addSkill} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                {t("add")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(user?.skills || []).map((skill) => (
                <button
                  key={skill.skill}
                  onClick={() => removeSkill(skill.skill)}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {skill.skill} x
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{t("accountActions")}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runAccountAction("disable")}
                className="rounded-lg bg-yellow-100 px-3 py-2 text-sm font-semibold text-yellow-800"
              >
                {t("disable")}
              </button>
              <button
                onClick={() => runAccountAction("enable")}
                className="rounded bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800"
                disabled={!isDisabled}
              >
                {t("enable")}
              </button>
              <button
                onClick={() => runAccountAction("delete")}
                className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
