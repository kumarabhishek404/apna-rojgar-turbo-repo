import { getAuth } from "@/lib/auth";

type ReportErrorInput = {
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  statusCode?: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";

const reportedKeys = new Set<string>();

export async function reportError({
  message,
  stack,
  componentStack,
  route,
  statusCode = 500,
}: ReportErrorInput) {
  if (typeof window === "undefined") {
    return;
  }

  const dedupeKey = `${route || window.location.pathname}:${message}`.slice(0, 200);
  if (reportedKeys.has(dedupeKey)) {
    return;
  }
  reportedKeys.add(dedupeKey);

  try {
    const auth = getAuth();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Platform": "web",
    };

    if (auth?.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    await fetch(`${API_BASE_URL}/errors/report`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "website",
        message,
        stack,
        componentStack,
        route: route || window.location.pathname,
        statusCode,
      }),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reportError] Failed to report error", error);
    }
  }
}
