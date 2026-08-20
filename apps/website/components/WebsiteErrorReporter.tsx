"use client";

import { reportError } from "@/lib/reportError";
import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

function isStaleChunkError(error: unknown) {
  if (typeof error === "string") {
    return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module/i.test(
      error,
    );
  }
  const err = error as { name?: string; message?: string } | undefined;
  const text = `${err?.name || ""} ${err?.message || ""}`;
  return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module/i.test(
    text,
  );
}

function reloadOnceForStaleChunk() {
  if (typeof window === "undefined") return;
  const key = "ar_stale_chunk_reload";
  if (sessionStorage.getItem(key) === "1") return;
  sessionStorage.setItem(key, "1");
  window.location.reload();
}

class WebsiteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isStaleChunkError(error)) {
      reloadOnceForStaleChunk();
      return;
    }
    void reportError({
      message: error.message || "React render error",
      stack: error.stack,
      componentStack: info.componentStack || undefined,
      route: typeof window !== "undefined" ? window.location.pathname : "website",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            The issue has been logged. Please refresh and try again.
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function WebsiteErrorReporter({ children }: Props) {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isStaleChunkError(event.error) || isStaleChunkError(event.message)) {
        reloadOnceForStaleChunk();
        return;
      }
      void reportError({
        message: event.message || "Unhandled window error",
        stack: event.error?.stack,
        route: window.location.pathname,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (isStaleChunkError(reason)) {
        reloadOnceForStaleChunk();
        return;
      }
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";

      void reportError({
        message,
        stack: reason instanceof Error ? reason.stack : undefined,
        route: window.location.pathname,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return <WebsiteErrorBoundary>{children}</WebsiteErrorBoundary>;
}
