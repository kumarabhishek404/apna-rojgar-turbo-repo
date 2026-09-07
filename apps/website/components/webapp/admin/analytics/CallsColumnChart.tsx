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

export default function CallsColumnChart({ data = [], loading }: Props) {
  const total = sumSeries(data, ["call_tap"]);

  const { series, options } = useMemo(() => {
    const categories = data.map((d) => formatShortDate(String(d.date)));
    const series = [
      {
        name: "Call taps",
        data: data.map((d) => Number(d.call_tap || 0)),
      },
    ];
    const options = {
      ...baseChartOptions(),
      chart: {
        ...(baseChartOptions().chart as object),
        type: "bar",
        height: 280,
      },
      colors: [ANALYTICS_CHART_COLORS.orange],
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: "55%",
        },
      },
      xaxis: {
        ...(baseChartOptions().xaxis as object),
        categories,
      },
    };
    return { series, options };
  }, [data]);

  return (
    <AnalyticsChartCard
      title="Call taps"
      subtitle="Users tapping to call from the app"
      loading={loading}
      empty={!loading && total === 0}
    >
      <ApexChart
        type="bar"
        height={280}
        series={series}
        options={options as object}
      />
    </AnalyticsChartCard>
  );
}
