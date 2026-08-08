"use client";

import { useMemo } from "react";
import ApexChart from "./ApexChart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  ANALYTICS_CHART_COLORS,
  baseChartOptions,
  formatShortDate,
} from "./chartTheme";
import type { DailyPoint } from "./types";
import { sumSeries } from "./types";

type Props = {
  data?: DailyPoint[];
  loading?: boolean;
};

export default function SessionsAreaChart({ data = [], loading }: Props) {
  const total = sumSeries(data, [
    "session_start",
    "app_foreground",
    "app_background",
  ]);

  const { series, options } = useMemo(() => {
    const categories = data.map((d) => formatShortDate(String(d.date)));
    const series = [
      {
        name: "Session start",
        data: data.map((d) => Number(d.session_start || 0)),
      },
      {
        name: "App open (foreground)",
        data: data.map((d) => Number(d.app_foreground || 0)),
      },
      {
        name: "App close (background)",
        data: data.map((d) => Number(d.app_background || 0)),
      },
    ];
    const options = {
      ...baseChartOptions(),
      chart: {
        ...(baseChartOptions().chart as object),
        type: "area",
        stacked: true,
        height: 280,
      },
      colors: [
        ANALYTICS_CHART_COLORS.primary,
        ANALYTICS_CHART_COLORS.primaryLight,
        ANALYTICS_CHART_COLORS.slateLight,
      ],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 0.35,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      stroke: { curve: "smooth", width: 2 },
      xaxis: {
        ...(baseChartOptions().xaxis as object),
        categories,
      },
    };
    return { series, options };
  }, [data]);

  return (
    <AnalyticsChartCard
      title="App open & close"
      subtitle="Daily session_start, foreground, and background"
      loading={loading}
      empty={!loading && total === 0}
      className="md:col-span-2"
    >
      <ApexChart
        type="area"
        height={280}
        series={series}
        options={options as object}
      />
    </AnalyticsChartCard>
  );
}
