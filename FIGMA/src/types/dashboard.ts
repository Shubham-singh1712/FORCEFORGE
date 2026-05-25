export type DashboardSeriesPoint = {
  day: string;
  hours: number;
};

export type WeeklyTrendPoint = {
  week: string;
  score: number;
};

export type CategoryBreakdownPoint = {
  name: "Productive" | "Distraction" | "Neutral";
  value: number;
  color: string;
};

export type AppUsagePoint = {
  name: string;
  minutes: number;
  hoursLabel: string;
  share: number;
  color: string;
};

export type PeakDistractionPayload = {
  label: string;
  risk: string;
  percent: number;
  summary: string;
};

export type DashboardPayload = {
  greetingName: string;
  focusScore: number;
  focusDelta: number;
  weeklyProgress: DashboardSeriesPoint[];
  screenTimeSeries: DashboardSeriesPoint[];
  screenTimeHoursToday: number;
  screenTimeDeltaMinutes: number;
  streak: number;
  xp: number;
  xpToday: number;
  goalCompletion: number;
  appUsageToday: AppUsagePoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  weeklyTrend: WeeklyTrendPoint[];
  heatmap: number[][];
  aiInsight: string;
  peakDistraction: PeakDistractionPayload;
};
