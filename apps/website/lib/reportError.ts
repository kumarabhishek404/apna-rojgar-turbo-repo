import { getAuth } from "@/lib/auth";

type ReportErrorInput = {
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  statusCode?: number;
  errorName?: string;
  errorCode?: string | number;
  context?: Record<string, unknown>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";

const reportedKeys = new Set<string>();

function sanitize(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 5) return "[max-depth]";
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitize(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (/pass|token|secret|authorization|otp/i.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = sanitize(nested, depth + 1);
  }
  return out;
}

export async function reportError({
  message,
  stack,
  componentStack,
  route,
  statusCode = 500,
  errorName,
  errorCode,
  context,
}: ReportErrorInput) {
  if (typeof window === "undefined") {
    return;
  }

  const safeMessage = String(message || "Unknown error").trim() || "Unknown error";
  const dedupeKey = `${route || window.location.pathname}:${statusCode}:${safeMessage}`.slice(
    0,
    220,
  );
  if (reportedKeys.has(dedupeKey)) {
    return;
  }
  reportedKeys.add(dedupeKey);

  try {
    const auth = getAuth();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Platform": "web",
      "X-Client-App-Name": "Apna Rojgar Website",
      "X-Client-Locale":
        typeof navigator !== "undefined" ? navigator.language || "en" : "en",
      "X-Client-Timezone":
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };

    if (typeof navigator !== "undefined" && navigator.userAgent) {
      headers["User-Agent"] = navigator.userAgent;
    }

    if (auth?.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    const authUser = (auth?.user || {}) as Record<string, any>;
    const emailRaw = authUser.email;
    const localeRaw = authUser.locale;
    const user = auth?.token
      ? {
          id: authUser._id || authUser.id || auth.userId || null,
          name: authUser.name || auth.name || null,
          mobile: authUser.mobile || null,
          countryCode: authUser.countryCode || null,
          role: authUser.role || null,
          email:
            typeof emailRaw === "object" && emailRaw != null
              ? emailRaw.value || null
              : emailRaw || null,
          locale:
            typeof localeRaw === "object" && localeRaw != null
              ? localeRaw.language || null
              : localeRaw || null,
          status: authUser.status || null,
        }
      : undefined;

    await fetch(`${API_BASE_URL}/errors/report`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "website",
        message: safeMessage,
        stack,
        componentStack,
        route: route || window.location.pathname,
        statusCode,
        errorName,
        errorCode: errorCode != null ? String(errorCode) : undefined,
        reportedAt: new Date().toISOString(),
        user,
        device: {
          platform: "web",
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : null,
          locale:
            typeof navigator !== "undefined" ? navigator.language || null : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          appName: "Apna Rojgar Website",
        },
        context: sanitize({
          ...(context || {}),
          href: window.location.href,
          pathname: window.location.pathname,
        }),
      }),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reportError] Failed to report error", error);
    }
  }
}
