"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROJGAR_TIPS_PATH, rojgarTipsArticlePath } from "@/constants";

/** Old /career-advice/[slug] → /rojgar-tips/[slug] */
export default function CareerAdviceSlugRedirectPage() {
  const router = useRouter();
  const params = useParams<{ slug?: string }>();

  useEffect(() => {
    const slug = typeof params?.slug === "string" ? params.slug : "";
    if (slug) router.replace(rojgarTipsArticlePath(slug));
    else router.replace(ROJGAR_TIPS_PATH);
  }, [params, router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirecting…
    </main>
  );
}
