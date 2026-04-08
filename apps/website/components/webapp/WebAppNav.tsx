"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuth } from "@/lib/auth";

const links = [
  { href: "/webapp/services", label: "All Services" },
  { href: "/webapp/profile", label: "My Profile" },
  { href: "/webapp/applied-services", label: "Applied Service" },
  { href: "/webapp/my-services", label: "My Work" },
];

export default function WebAppNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                active ? "bg-[#22409a] text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={() => {
          clearAuth();
          window.location.href = "/";
        }}
        className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
      >
        Logout
      </button>
    </nav>
  );
}
