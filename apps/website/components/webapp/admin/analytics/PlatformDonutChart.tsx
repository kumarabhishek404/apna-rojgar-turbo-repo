"use client";

import { useMemo } from "react";
import ApexChart from "./ApexChart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  PLATFORM_COLORS,
  ANALYTICS_CHART_COLORS,
  baseChartOptions,
} from "./chartTheme";
import type { PlatformSlice } from "./types";

type Props = {
  data?: PlatformSlice[];
  loading?: boolean;
};

export default function PlatformDonutChart({ data = [], loading }: Props) {
  const total = data.reduce((n, s) => n + Number(s.count || 0), 0);

  const { series, options } = useMemo(() => {
    const labels = data.map((s) => s.platform);
    const series = data.map((s) => Number(s.count || 0));
    const colors = data.map(
      (s) => PLATFORM_COLORS[s.platform] || ANALYTICS_CHART_COLORS.slate,
    );
    const options = {
      ...baseChartOptions(),
      chart: {
        ...(baseChartOptions().chart as object),
        type: "donut",
        height: 280,
      },
      labels,
      colors,
      legend: {
        position: "bottom",
        fontSize: "12px",
        labels: { colors: ANALYTICS_CHART_COLORS.label },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Platform",
                fontSize: "12px",
                color: ANALYTICS_CHART_COLORS.label,
                formatter: () => String(total),
              },
            },
          },
        },
      },
      stroke: { width: 2, colors: ["#fff"] },
      dataLabels: { enabled: false },
    };
    return { series, options };
  }, [data, total]);

  return (
    <AnalyticsChartCard
      title="Platform split"
      subtitle="Android, iOS, and web"
      loading={loading}
      empty={!loading && total === 0}
    >
      <ApexChart
        type="donut"
        height={280}
        series={series}
        options={options as object}
      />
    </AnalyticsChartCard>
  );
}
