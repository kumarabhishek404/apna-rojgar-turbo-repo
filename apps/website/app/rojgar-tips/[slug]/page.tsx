import BlogDetailPage from "@/components/blogs/BlogDetailPage";
import { staticExportBlogSlugParamListAsync } from "@/lib/staticExportDynamicRoutes";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return staticExportBlogSlugParamListAsync();
}

export default async function RojgarTipsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogDetailPage slug={slug} />;
}
