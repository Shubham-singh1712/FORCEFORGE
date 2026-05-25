export type WeeklyReportApp = {
  name: string;
  time: string;
  change: number;
};

export type WeeklyReportPayload = {
  weekLabel: string;
  totalFocusHours: number;
  sessionsCompleted: number;
  xpEarned: number;
  avgFocusScore: number;
  focusScoreDelta: number;
  goalsCompleted: number;
  goalCompletionRate: number;
  improvement: number;
  streakGrowth: number;
  distractionRatio: number;
  distractionRatioDelta: number;
  mostUsedApps: WeeklyReportApp[];
  dailyFocus: Array<{ day: string; hours: number }>;
  aiSummary: string;
};
