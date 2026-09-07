"use client";

import type { ReactNode } from "react";

type AnalyticsChartCardProps = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function AnalyticsChartCard({
  title,
  subtitle,
  loading,
  empty,
  emptyMessage = "No data in this range",
  actions,
  children,
  className = "",
}: AnalyticsChartCardProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          Loading…
        </div>
      ) : empty ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
