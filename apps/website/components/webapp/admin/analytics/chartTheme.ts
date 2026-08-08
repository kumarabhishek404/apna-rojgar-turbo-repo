/** Apna Rojgar brand palette for ApexCharts admin dashboards. */
export const ANALYTICS_CHART_COLORS = {
  primary: "#22409a",
  primaryLight: "#4f6fd8",
  primaryDark: "#162b6b",
  amber: "#FFC107",
  orange: "#FF7A00",
  slate: "#64748b",
  slateLight: "#94a3b8",
  success: "#0f766e",
  danger: "#dc2626",
  grid: "#e2e8f0",
  label: "#64748b",
  tooltipBg: "#0f172a",
} as const;

export const SERIES_PALETTE = [
  ANALYTICS_CHART_COLORS.primary,
  ANALYTICS_CHART_COLORS.primaryLight,
  ANALYTICS_CHART_COLORS.amber,
  ANALYTICS_CHART_COLORS.orange,
  ANALYTICS_CHART_COLORS.success,
  ANALYTICS_CHART_COLORS.slate,
  ANALYTICS_CHART_COLORS.primaryDark,
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  sessions: ANALYTICS_CHART_COLORS.primary,
  views: ANALYTICS_CHART_COLORS.primaryLight,
  calls: ANALYTICS_CHART_COLORS.orange,
  conversions: ANALYTICS_CHART_COLORS.success,
  web: ANALYTICS_CHART_COLORS.amber,
  other: ANALYTICS_CHART_COLORS.slate,
};

export const PLATFORM_COLORS: Record<string, string> = {
  android: ANALYTICS_CHART_COLORS.success,
  ios: ANALYTICS_CHART_COLORS.primary,
  web: ANALYTICS_CHART_COLORS.orange,
  unknown: ANALYTICS_CHART_COLORS.slate,
};

export function baseChartOptions(): Record<string, unknown> {
  return {
    chart: {
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 500 },
      background: "transparent",
    },
    colors: [...SERIES_PALETTE],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    grid: {
      borderColor: ANALYTICS_CHART_COLORS.grid,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      padding: { left: 8, right: 8 },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "12px",
      labels: { colors: ANALYTICS_CHART_COLORS.label },
      markers: { width: 8, height: 8, radius: 8 },
    },
    xaxis: {
      labels: {
        style: { colors: ANALYTICS_CHART_COLORS.label, fontSize: "11px" },
        rotate: -35,
        rotateAlways: false,
      },
      axisBorder: { color: ANALYTICS_CHART_COLORS.grid },
      axisTicks: { color: ANALYTICS_CHART_COLORS.grid },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: ANALYTICS_CHART_COLORS.label, fontSize: "11px" },
        formatter: (v: number) =>
          Number.isFinite(v) ? String(Math.round(v)) : "0",
      },
    },
    tooltip: {
      theme: "dark",
      style: { fontSize: "12px" },
    },
  };
}

export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
