const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";

export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  authorName?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

async function publicGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Blogs API returned non-JSON (${response.status}). Check NEXT_PUBLIC_API_BASE_URL (currently ${API_BASE_URL}).`,
    );
  }

  let json: ApiEnvelope<T>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    throw new Error(
      `Blogs API response was not valid JSON. Check NEXT_PUBLIC_API_BASE_URL (currently ${API_BASE_URL}).`,
    );
  }

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "Request failed");
  }
  return json.data as T;
}

export async function fetchPublishedBlogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  query.set("page", String(params?.page || 1));
  query.set("limit", String(params?.limit || 12));
  if (params?.search?.trim()) query.set("search", params.search.trim());

  return publicGet<{
    blogs: BlogPost[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/blogs?${query.toString()}`);
}

export async function fetchPublishedBlog(slugOrId: string) {
  return publicGet<BlogPost>(`/blogs/${encodeURIComponent(slugOrId)}`);
}

export async function fetchPublishedBlogSlugs() {
  const ids = new Set<string>();
  let page = 1;
  let pages = 1;
  do {
    const data = await publicGet<{ slugs: string[]; pages: number }>(
      `/blogs/public/slugs?page=${page}&limit=100`,
    );
    for (const slug of data.slugs || []) {
      if (slug) ids.add(slug);
    }
    pages = data.pages || 1;
    page += 1;
  } while (page <= pages);
  return Array.from(ids);
}

export function formatBlogDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
