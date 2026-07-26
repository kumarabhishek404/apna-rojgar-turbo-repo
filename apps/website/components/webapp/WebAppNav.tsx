"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { clearAuth } from "@/lib/auth";
import { useConfirmedAdmin } from "@/lib/useConfirmedAdmin";
import { useLanguage } from "@/components/LanguageProvider";

export default function WebAppNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { showAdminUi } = useConfirmedAdmin();

  const links = useMemo(() => {
    const base = [
      { href: "/webapp/services", label: t("allServices", "All Works") },
      { href: "/webapp/profile", label: t("myProfile", "My Profile") },
      { href: "/webapp/my-services", label: t("myServices", "My Works") },
      ...(showAdminUi
        ? [
            {
              href: "/webapp/admin/paid-services",
              label: t("paidServices", "Paid Services"),
            },
          ]
        : []),
      {
        href: "/webapp/applied-services",
        label: t("appliedServices", "Applied Works"),
      },
      ...(!showAdminUi
        ? [{ href: "/rojgar-tips", label: t("blogs", "Rojgar Tips") }]
        : []),
    ];
    if (!showAdminUi) return base;
    return [
      ...base,
      { href: "/webapp/admin/blogs", label: t("blogs", "Blogs") },
      { href: "/webapp/admin/users", label: t("users", "Users") },
      { href: "/webapp/admin/error-logs", label: t("errorLogs", "Error Logs") },
      { href: "/webapp/admin/analytics", label: t("analytics", "Analytics") },
      {
        href: "/webapp/admin/notifications",
        label: t("notifications", "Notifications"),
      },
    ];
  }, [showAdminUi, t]);

  return (
    <nav className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <p className="text-sm font-semibold text-slate-700">
          {showAdminUi ? "Admin Workspace" : "Workspace"}
        </p>
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
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#22409a] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
