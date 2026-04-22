"use client";

import { getAuth } from "@/lib/auth";
import {
  WEBSITE_TRACK_EVENT,
  type WebsiteTrackingEventDetail,
} from "@/lib/websiteTracking";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventPayload = {
  name: string;
  properties?: Record<string, unknown>;
  clientTimestamp: string;
};

const STORAGE_KEY = "apna_rojgar_web_session_id";

function createSessionId() {
  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return createSessionId();
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const next = createSessionId();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function isContactHref(href: string) {
  const normalized = href.trim().toLowerCase();
  return (
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:") ||
    normalized.includes("wa.me/") ||
    normalized.includes("whatsapp.com/")
  );
}

export default function WebsiteActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const queueRef = useRef<EventPayload[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  // 🔥 SEND TO GOOGLE ANALYTICS
  const trackGA = (event: string, params?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", event, params || {});
    }
  };

  const trackPageViewGA = (path: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "G-S6TZQGWV6J", {
        page_path: path,
      });
    }
  };

  const flush = async () => {
    if (queueRef.current.length === 0) return;

    const events = queueRef.current.splice(0, queueRef.current.length);
    const token = getAuth()?.token;
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://api.apnarojgarindia.com/api/v1";

    try {
      await fetch(`${base}/analytics/events/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          platform: "web",
          appName: "Apna Rojgar Website",
          locale: typeof navigator !== "undefined" ? navigator.language : null,
          timezone:
            typeof Intl !== "undefined"
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : null,
          batchSentAt: new Date().toISOString(),
          events,
        }),
      });
    } catch {
      queueRef.current = [...events, ...queueRef.current];
    }
  };

  const enqueue = (name: string, properties?: Record<string, unknown>) => {
    const payload = {
      name,
      properties: properties || {},
      clientTimestamp: new Date().toISOString(),
    };

    queueRef.current.push(payload);

    // 🔥 ALSO SEND TO GOOGLE ANALYTICS
    trackGA(name, properties);

    if (queueRef.current.length >= 10) {
      void flush();
    }
  };

  // ✅ PAGE VIEW TRACKING (IMPORTANT FIX)
  useEffect(() => {
    const search = searchParams?.toString() || "";
    const fullPath = `${pathname || "/"}${search ? `?${search}` : ""}`;

    enqueue("web_page_view", {
      path: pathname || "/",
      search,
      source: "website",
    });

    // 🔥 Google Analytics page tracking
    trackPageViewGA(fullPath);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest(
        "a,button,[role='button'],input[type='submit']",
      ) as HTMLElement | null;

      if (!clickable) return;

      const text = normalizeText(clickable.textContent || "");
      const href = clickable instanceof HTMLAnchorElement ? clickable.href : "";

      enqueue("web_click", {
        path: pathname || "/",
        text: text || null,
        href: href || null,
        source: "website",
      });

      if (href && isContactHref(href)) {
        const contactPayload = {
          path: pathname || "/",
          text: text || null,
          href,
          source: "website",
        };
        enqueue("contact_clicked", contactPayload);
        enqueue("lead_generated", contactPayload);
      }
    };

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;

      enqueue("web_form_submit", {
        path: pathname || "/",
        formId: form.id || null,
        formName: form.getAttribute("name") || null,
        source: "website",
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flush();
      }
    };

    const handleBeforeUnload = () => {
      void flush();
    };

    const handleExternalTrack = (event: Event) => {
      const customEvent = event as CustomEvent<WebsiteTrackingEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.name) return;
      enqueue(detail.name, detail.properties || {});
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener(WEBSITE_TRACK_EVENT, handleExternalTrack as EventListener);

    flushTimerRef.current = window.setInterval(() => {
      void flush();
    }, 8000);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener(WEBSITE_TRACK_EVENT, handleExternalTrack as EventListener);

      if (flushTimerRef.current) {
        window.clearInterval(flushTimerRef.current);
      }

      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    let fired = false;

    const onScroll = () => {
      if (fired) return;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScrollable = Math.max(doc.scrollHeight - window.innerHeight, 0);
      if (maxScrollable <= 0) return;
      const percent = (scrollTop / maxScrollable) * 100;
      if (percent >= 50) {
        fired = true;
        enqueue("scroll_depth", {
          percent: 50,
          path: pathname || "/",
          source: "website",
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      enqueue("time_on_page", {
        seconds: 30,
        path: pathname || "/",
        source: "website",
      });
    }, 30000);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
