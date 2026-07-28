"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import BlogDetailPage from "@/components/blogs/BlogDetailPage";
import Navbar from "@/components/Navbar";
import { ROJGAR_TIPS_PATH } from "@/constants";
import { STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID } from "@/lib/staticExportDynamicRoutes";

/**
 * Static hosts (Render) return this page for unknown tip URLs because
 * `output: "export"` only emits HTML for slugs known at build time.
 * Render does not apply Netlify-style `public/_redirects`, so recover tip
 * detail routes here from the browser pathname.
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

export default function NotFound() {
  const pathname = usePathname();
  const tipSlug = useMemo(() => tipSlugFromPath(pathname), [pathname]);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7525/ingest/43a9946a-cc57-4e2a-9a4b-4a42e3195227", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d31d2b",
      },
      body: JSON.stringify({
        sessionId: "d31d2b",
        runId: "post-fix",
        hypothesisId: "B",
        location: "app/not-found.tsx:NotFound",
        message: "not-found rendered",
        data: { pathname, tipSlug, recoveringTip: Boolean(tipSlug) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [pathname, tipSlug]);

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
