import { staticExportBlogSlugParamListAsync } from "@/lib/staticExportDynamicRoutes";

/** Required for `output: "export"` — old /career-advice/[slug] redirect routes. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return staticExportBlogSlugParamListAsync();
}

export default function CareerAdviceSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
