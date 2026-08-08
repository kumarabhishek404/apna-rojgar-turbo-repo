export type AnalyticsKpis = {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  sessionStarts: number;
  appForeground: number;
  appBackground: number;
  serviceViews: number;
  profileViews: number;
  callTaps: number;
  serviceApplies: number;
  serviceUnapplies: number;
  bookingRequests: number;
};

export type DailyPoint = {
  date: string;
  [eventName: string]: string | number;
};

export type CategorySlice = { category: string; count: number };
export type PlatformSlice = { platform: string; count: number };
export type HeatmapSeries = {
  name: string;
  data: Array<{ x: string; y: number }>;
};

export type AnalyticsSummaryData = {
  range: { from: string; to: string };
  kpis: AnalyticsKpis;
  dailySessions: DailyPoint[];
  dailyViews: DailyPoint[];
  dailyCalls: DailyPoint[];
  dailyConversions: DailyPoint[];
  byCategory: CategorySlice[];
  byPlatform: PlatformSlice[];
  byHourWeekday: HeatmapSeries[];
  byEvent: Array<{ eventName: string; count: number }>;
};

export function sumSeries(
  rows: DailyPoint[] | undefined,
  keys: string[],
): number {
  if (!rows?.length) return 0;
  return rows.reduce((acc, row) => {
    let n = 0;
    for (const key of keys) n += Number(row[key] || 0);
    return acc + n;
  }, 0);
}
