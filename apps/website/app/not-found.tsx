"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BlogDetailPage from "@/components/blogs/BlogDetailPage";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import { ROJGAR_TIPS_PATH } from "@/constants";
import { STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID } from "@/lib/staticExportDynamicRoutes";

/**
 * Static hosts (Render) return this page for unknown tip URLs because
 * `output: "export"` only emits HTML for slugs known at build time.
 * On that fallback, `usePathname()` is often `/_not-found`, so we must
 * also read `window.location.pathname` (the real tip URL in the address bar).
 */
function tipSlugFromPath(pathname: string | null): string | null {
  const parts = (pathname || "").split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const [section, slug] = parts;
  if (
    section !== "rojgar-tips" &&
    section !== "blogs" &&
    section !== "career-advice"
  ) {
    return null;
  }
  if (!slug || slug === STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) return null;
  if (slug.endsWith(".html")) return null;
  return slug;
}

function resolveTipSlug(routerPath: string | null): string | null {
  const fromRouter = tipSlugFromPath(routerPath);
  if (fromRouter) return fromRouter;
  if (typeof window === "undefined") return null;
  return tipSlugFromPath(window.location.pathname);
}

function TipLoadingScreen() {
  const { t } = useLanguage();
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#eef3ff] via-white to-[#f8fafc] px-4 pb-16 pt-20 md:pt-24 lg:pt-28">
        <article className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-48 w-full rounded-2xl bg-slate-200/80 md:h-64" />
          <div className="h-4 w-40 rounded bg-slate-200/80" />
          <div className="h-8 w-4/5 max-w-xl rounded bg-slate-200/80" />
          <div className="h-4 w-full rounded bg-slate-200/70" />
          <div className="h-4 w-11/12 rounded bg-slate-200/70" />
          <div className="h-4 w-10/12 rounded bg-slate-200/70" />
          <p className="pt-2 text-sm text-slate-500">
            {t("loading", "Loading...")}
          </p>
        </article>
      </main>
    </>
  );
}

export default function NotFound() {
  const pathname = usePathname();
  const [tipSlug, setTipSlug] = useState<string | null>(() =>
    tipSlugFromPath(pathname),
  );
  const [resolved, setResolved] = useState(() =>
    Boolean(tipSlugFromPath(pathname)),
  );

  useEffect(() => {
    setTipSlug(resolveTipSlug(pathname));
    setResolved(true);
  }, [pathname]);

  if (!resolved) {
    return <TipLoadingScreen />;
  }

  if (tipSlug) {
    return <BlogDetailPage slug={tipSlug} />;
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#eef3ff] via-white to-[#f8fafc] px-4 pt-20">
        <p className="text-6xl font-bold text-[#22409a]">404</p>
        <p className="text-slate-600">This page could not be found.</p>
        <Link
          href={ROJGAR_TIPS_PATH}
          className="text-sm font-semibold text-[#22409a] hover:underline"
        >
          ← Rojgar Tips
        </Link>
      </main>
    </>
  );
}
