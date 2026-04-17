"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, clearAuth } from "@/lib/auth";
import { isAdminUser } from "@/lib/isAdminUser";

const baseLinks = [
  { href: "/webapp/services", label: "All Services" },
  { href: "/webapp/profile", label: "My Profile" },
  { href: "/webapp/applied-services", label: "Applied Service" },
  { href: "/webapp/my-services", label: "My Work" },
];

export default function WebAppNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiRequest<{ data?: { role?: string; mobile?: string } }>("/user/info")
      .then((res) => {
        if (!mounted) return;
        console.log("res?.data----", res?.data);
        
        setIsAdmin(isAdminUser(res?.data));
      })
      .catch(() => {
        if (!mounted) return;
        setIsAdmin(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const links = useMemo(() => {
    if (!isAdmin) return baseLinks;
    return [
      ...baseLinks,
      { href: "/webapp/admin/users", label: "Users" },
      { href: "/webapp/admin/error-logs", label: "Error Logs" },
      { href: "/webapp/admin/analytics", label: "Analytics" },
      { href: "/webapp/admin/notifications", label: "Notifications" },
    ];
  }, [isAdmin]);

  return (
    <nav className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <p className="text-sm font-semibold text-slate-700">
          {isAdmin ? "Admin Workspace" : "Workspace"}
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
