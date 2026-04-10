"use client";

import { Settings } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function SettingsPage() {
  const { t } = useLanguage();
  const upcomingSettings = [
    {
      title: t("notifications", "Notifications"),
      desc: t(
        "settingsUpcomingNotifications",
        "Control push, email, and in-app alerts for applications, hiring, and status changes.",
      ),
    },
    {
      title: t("privacy", "Privacy"),
      desc: t(
        "settingsUpcomingPrivacy",
        "Manage profile visibility, phone privacy, and who can contact you directly.",
      ),
    },
    {
      title: t("security", "Security"),
      desc: t(
        "settingsUpcomingSecurity",
        "Set password controls, trusted devices, and account recovery preferences.",
      ),
    },
    {
      title: t("appearance", "Appearance"),
      desc: t(
        "settingsUpcomingAppearance",
        "Choose theme mode, compact view, and readability settings for dashboard screens.",
      ),
    },
    {
      title: t("jobPreferences", "Job Preferences"),
      desc: t(
        "settingsUpcomingJobPreferences",
        "Set preferred work type, distance range, salary band, and availability schedule.",
      ),
    },
    {
      title: t("helpSupport", "Help & Support"),
      desc: t(
        "settingsUpcomingSupport",
        "Access support tickets, issue history, and direct assistance channels.",
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-slate-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("settings", "Settings")}</h1>
        <p className="mt-1 text-sm text-slate-200">
          {t("settingsSubtitle", "Manage your account preferences and basic profile controls.")}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Settings className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {t("settingsProfileRedirectTitle", "Profile controls are available in My Profile")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {t(
                "settingsProfileRedirectDesc",
                "Use the My Profile section to update personal info, language, role, and photo.",
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">{t("comingSoon", "Coming soon")}</p>
        <p className="mt-0.5">
          {t(
            "settingsUpcomingNote",
            "The options below are planned for upcoming releases and are not active yet.",
          )}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {upcomingSettings.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-4 opacity-80 shadow-sm"
            aria-disabled="true"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {t("upcoming", "Upcoming")}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
