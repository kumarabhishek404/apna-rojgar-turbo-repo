import type { ReactNode } from "react";
import { staticExportDynamicParamListAsync } from "@/lib/staticExportDynamicRoutes";

/** Static export: prerender service IDs so `/webapp/services/:id` deep links work on static hosts. */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return staticExportDynamicParamListAsync();
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
