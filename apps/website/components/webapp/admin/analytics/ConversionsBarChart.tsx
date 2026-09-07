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

export default function ConversionsBarChart({ data = [], loading }: Props) {
  const total = sumSeries(data, [
    "service_apply_success",
    "service_unapply_success",
    "worker_booking_request_success",
  ]);

  const { series, options } = useMemo(() => {
    const categories = data.map((d) => formatShortDate(String(d.date)));
    const series = [
      {
        name: "Apply success",
        data: data.map((d) => Number(d.service_apply_success || 0)),
      },
      {
        name: "Unapply",
        data: data.map((d) => Number(d.service_unapply_success || 0)),
      },
      {
        name: "Booking request",
        data: data.map((d) =>
          Number(d.worker_booking_request_success || 0),
        ),
      },
    ];
    const options = {
      ...baseChartOptions(),
      chart: {
        ...(baseChartOptions().chart as object),
        type: "bar",
        height: 280,
      },
      colors: [
        ANALYTICS_CHART_COLORS.success,
        ANALYTICS_CHART_COLORS.slate,
        ANALYTICS_CHART_COLORS.primary,
      ],
      plotOptions: {
        bar: {
          borderRadius: 3,
          columnWidth: "70%",
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
      title="Conversions"
      subtitle="Applies, unapplies, and booking requests"
      loading={loading}
      empty={!loading && total === 0}
      className="md:col-span-2"
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
