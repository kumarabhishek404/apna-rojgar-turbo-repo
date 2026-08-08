"use client";

import { useMemo } from "react";
import ApexChart from "./ApexChart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import { ANALYTICS_CHART_COLORS, baseChartOptions } from "./chartTheme";
import type { HeatmapSeries } from "./types";

type Props = {
  data?: HeatmapSeries[];
  loading?: boolean;
};

export default function ActivityHeatmapChart({ data = [], loading }: Props) {
  const hasData = data.some((s) =>
    s.data?.some((cell) => Number(cell.y || 0) > 0),
  );

  const { series, options } = useMemo(() => {
    const series = data.map((s) => ({
      name: s.name,
      data: (s.data || []).map((cell) => ({
        x: `${cell.x}:00`,
        y: Number(cell.y || 0),
      })),
    }));
    const options = {
      ...baseChartOptions(),
      chart: {
        ...(baseChartOptions().chart as object),
        type: "heatmap",
        height: 320,
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      colors: [ANALYTICS_CHART_COLORS.primary],
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          radius: 2,
          useFillColorAsStroke: false,
          colorScale: {
            ranges: [
              { from: 0, to: 0, color: "#f1f5f9", name: "None" },
              { from: 1, to: 5, color: "#c7d2fe", name: "Low" },
              { from: 6, to: 20, color: "#4f6fd8", name: "Medium" },
              { from: 21, to: 999999, color: "#162b6b", name: "High" },
            ],
          },
        },
      },
      xaxis: {
        ...(baseChartOptions().xaxis as object),
        labels: {
          style: { colors: ANALYTICS_CHART_COLORS.label, fontSize: "10px" },
          rotate: 0,
        },
      },
      yaxis: {
        labels: {
          style: { colors: ANALYTICS_CHART_COLORS.label, fontSize: "11px" },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} events`,
        },
      },
    };
    return { series, options };
  }, [data]);

  return (
    <AnalyticsChartCard
      title="Activity heatmap"
      subtitle="Weekday × hour (Asia/Kolkata)"
      loading={loading}
      empty={!loading && !hasData}
      className="md:col-span-2"
    >
      <ApexChart
        type="heatmap"
        height={320}
        series={series}
        options={options as object}
      />
    </AnalyticsChartCard>
  );
}
