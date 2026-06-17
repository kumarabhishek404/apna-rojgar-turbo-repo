"use client";

import { reportError } from "@/lib/reportError";
import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

class WebsiteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
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
      void reportError({
        message: event.message || "Unhandled window error",
        stack: event.error?.stack,
        route: window.location.pathname,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
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
