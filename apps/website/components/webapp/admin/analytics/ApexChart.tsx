"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-sm text-slate-400">
      Loading chart…
    </div>
  ),
});

export type ApexChartProps = ComponentProps<typeof ReactApexChart>;

export default function ApexChart(props: ApexChartProps) {
  return <ReactApexChart {...props} />;
}
