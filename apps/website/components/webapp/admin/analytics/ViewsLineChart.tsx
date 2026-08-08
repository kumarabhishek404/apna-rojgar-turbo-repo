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

export default function ViewsLineChart({ data = [], loading }: Props) {
  const total = sumSeries(data, ["service_view", "profile_view"]);

  const { series, options } = useMemo(() => {
    const categories = data.map((d) => formatShortDate(String(d.date)));
    const series = [
      {
        name: "Service views",
        data: data.map((d) => Number(d.service_view || 0)),
      },
      {
        name: "Profile views",
        data: data.map((d) => Number(d.profile_view || 0)),
      },
    ];
    const options = {
      ...baseChartOptions(),
      chart: {
        ...(baseChartOptions().chart as object),
        type: "line",
        height: 280,
      },
      colors: [
        ANALYTICS_CHART_COLORS.primary,
        ANALYTICS_CHART_COLORS.amber,
      ],
      markers: { size: 3, strokeWidth: 0 },
      xaxis: {
        ...(baseChartOptions().xaxis as object),
        categories,
      },
    };
    return { series, options };
  }, [data]);

  return (
    <AnalyticsChartCard
      title="Service & profile views"
      subtitle="Daily content engagement"
      loading={loading}
      empty={!loading && total === 0}
    >
      <ApexChart
        type="line"
        height={280}
        series={series}
        options={options as object}
      />
    </AnalyticsChartCard>
  );
}
