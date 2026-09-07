"use client";

import type { AnalyticsKpis } from "./types";

type Props = {
  kpis?: AnalyticsKpis | null;
  loading?: boolean;
};

const CARDS: Array<{
  key: keyof AnalyticsKpis;
  label: string;
  accent: string;
}> = [
  { key: "totalEvents", label: "Total events", accent: "text-[#22409a]" },
  { key: "uniqueUsers", label: "Unique users", accent: "text-[#162b6b]" },
  { key: "uniqueSessions", label: "Sessions", accent: "text-[#4f6fd8]" },
  { key: "serviceViews", label: "Service views", accent: "text-[#22409a]" },
  { key: "profileViews", label: "Profile views", accent: "text-[#4f6fd8]" },
  { key: "callTaps", label: "Call taps", accent: "text-[#FF7A00]" },
  {
    key: "sessionStarts",
    label: "App opens",
    accent: "text-[#0f766e]",
  },
  {
    key: "appBackground",
    label: "App closes",
    accent: "text-slate-600",
  },
  {
    key: "serviceApplies",
    label: "Applies",
    accent: "text-[#0f766e]",
  },
  {
    key: "bookingRequests",
    label: "Booking requests",
    accent: "text-[#22409a]",
  },
];

export default function AnalyticsKpiStrip({ kpis, loading }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${card.accent}`}>
            {loading ? "—" : Number(kpis?.[card.key] || 0).toLocaleString("en-IN")}
          </p>
        </div>
      ))}
    </div>
  );
}
