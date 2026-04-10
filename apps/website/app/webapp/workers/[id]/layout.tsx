import type { ReactNode } from "react";
import { staticExportDynamicParamList } from "@/lib/staticExportDynamicRoutes";

/** Static export needs at least one path per dynamic segment (see lib/staticExportDynamicRoutes). */
export function generateStaticParams(): { id: string }[] {
  return staticExportDynamicParamList();
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
