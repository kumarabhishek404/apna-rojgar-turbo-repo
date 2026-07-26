"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROJGAR_TIPS_PATH } from "@/constants";

/** Old /career-advice → /rojgar-tips */
export default function CareerAdviceRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROJGAR_TIPS_PATH);
  }, [router]);
  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirecting…
    </main>
  );
}
