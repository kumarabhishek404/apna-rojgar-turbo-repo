import BlogDetailPage from "@/components/blogs/BlogDetailPage";
import {
  STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID,
} from "@/lib/staticExportDynamicRoutes";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1"
).replace(/\/$/, "");

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = new Set<string>([STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID]);

  try {
    let page = 1;
    let pages = 1;
    do {
      const res = await fetch(
        `${API_BASE_URL}/blogs/public/slugs?page=${page}&limit=100`,
      );
      if (!res.ok) break;
      const json = (await res.json()) as {
        success?: boolean;
        data?: { slugs?: string[]; pages?: number };
      };
      for (const slug of json?.data?.slugs || []) {
        if (slug) slugs.add(slug);
      }
      pages = json?.data?.pages || 1;
      page += 1;
    } while (page <= pages);
  } catch {
    // Static export still succeeds with placeholder.
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function RojgarTipsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogDetailPage slug={slug} />;
}
