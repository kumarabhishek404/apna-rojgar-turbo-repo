"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROJGAR_TIPS_PATH, rojgarTipsArticlePath } from "@/constants";
import { STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID } from "@/lib/staticExportDynamicRoutes";

/** Old /career-advice/[slug] → /rojgar-tips/[slug] */
export default function CareerAdviceSlugRedirectPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const slug = (pathname || "").split("/").filter(Boolean).pop() || "";
    if (slug && slug !== STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
      router.replace(rojgarTipsArticlePath(slug));
    } else {
      router.replace(ROJGAR_TIPS_PATH);
    }
  }, [pathname, router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirecting…
    </main>
  );
}
