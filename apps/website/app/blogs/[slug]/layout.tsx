import type { ReactNode } from "react";
import { staticExportBlogSlugParamListAsync } from "@/lib/staticExportDynamicRoutes";

/** Required for `output: "export"` — old /blogs/[slug] redirect routes. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return staticExportBlogSlugParamListAsync();
}

export default function BlogSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
