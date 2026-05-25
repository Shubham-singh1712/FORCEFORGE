import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  AppUsagePoint,
  CategoryBreakdownPoint,
  DashboardPayload,
  DashboardSeriesPoint,
  PeakDistractionPayload,
  WeeklyTrendPoint,
} from "@/types/dashboard";

type AppSupabaseClient = SupabaseClient<Database>;

const CATEGORY_COLORS = {
  Productive: "#10D980",
  Distraction: "#FF9F1C",
  Neutral: "#94A3B8",
} satisfies Record<CategoryBreakdownPoint["name"], string>;

const APP_USAGE_COLORS = ["#EC4899", "#EF4444", "#3B82F6", "#8B5CF6", "#10D980"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function startOfDay(offsetDays = 0) {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  return value;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatWeekLabel(date: Date) {
  return `W${Math.ceil(date.getDate() / 7)}`;
}

function getDurationHours(session: {
  completed_seconds?: number | null;
  completed_minutes?: number | null;
}) {
  const completedSeconds =
    session.completed_seconds ?? ((session.completed_minutes ?? 0) * 60);
  return completedSeconds / 3600;
}

function bucketHoursIntoHeat(value: number) {
  if (value <= 0) {
    return 0;
  }

  if (value < 0.5) {
    return 1;
  }

  if (value < 1.5) {
    return 2;
  }

  if (value < 3) {
    return 3;
  }

  return 4;
}

function normalizeCategory(category: string) {
  if (category === "productive") {
    return "Productive" as const;
  }

  if (category === "distracting") {
    return "Distraction" as const;
  }

  return "Neutral" as const;
}

function buildCategoryBreakdown(categoryTotals: Map<string, number>) {
  const productive = categoryTotals.get("productive") ?? 0;
  const distraction = categoryTotals.get("distracting") ?? 0;
  const neutral = categoryTotals.get("neutral") ?? 0;
  const total = productive + distraction + neutral;

  const toPercent = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return [
    {
      name: "Productive",
      value: toPercent(productive),
      color: CATEGORY_COLORS.Productive,
    },
    {
      name: "Distraction",
      value: toPercent(distraction),
      color: CATEGORY_COLORS.Distraction,
    },
    {
      name: "Neutral",
      value: toPercent(neutral),
      color: CATEGORY_COLORS.Neutral,
    },
  ] satisfies CategoryBreakdownPoint[];
}

function buildInsight(
  peakDistraction: PeakDistractionPayload,
  goalCompletion: number,
  streak: number,
  focusHoursWeek: number,
) {
  if (peakDistraction.percent > 0) {
    return `Your biggest distraction window is ${peakDistraction.label}. Keep that time protected and you can push today's goal past ${goalCompletion}%.`;
  }

  if (focusHoursWeek > 0) {
    return `You banked ${round(focusHoursWeek)} focused hours this week with a ${streak}-day streak. Keep stacking sessions to strengthen your consistency.`;
  }

  return "Complete your first focus session to unlock personalized patterns, streaks, and coaching insights.";
}

function buildPeakDistraction(hourTotals: Map<number, number>) {
  let peakHour = -1;
  let peakMinutes = 0;

  for (const [hour, minutes] of hourTotals.entries()) {
    if (minutes > peakMinutes) {
      peakHour = hour;
      peakMinutes = minutes;
    }
  }

  if (peakHour < 0 || peakMinutes <= 0) {
    return {
      label: "No distraction data yet",
      risk: "Low Risk",
      percent: 0,
      summary: "Once usage logs are collected, this panel will flag your highest-risk distraction window.",
    } satisfies PeakDistractionPayload;
  }

  const endHour = (peakHour + 2) % 24;
  const label = `${peakHour}:00-${endHour}:00`;
  const percent = clamp(Math.round((peakMinutes / 180) * 100), 10, 100);
  const risk = percent >= 75 ? "High Risk" : percent >= 45 ? "Medium Risk" : "Low Risk";

  return {
    label,
    risk,
    percent,
    summary: `Distraction activity peaks around ${label}. Scheduling a focus session before that window should lower context switching.`,
  } satisfies PeakDistractionPayload;
}

export async function getDashboardData(
  supabase: AppSupabaseClient,
  userId: string,
  period: "week" | "month",
) {
  const seriesStart = period === "month" ? startOfDay(-29) : startOfDay(-6);
  const weeklyProgressStart = startOfDay(-6);
  const weeklyTrendStart = startOfDay(-27);
  const heatmapStart = startOfDay(-27);
  const todayStart = startOfDay(0);
  const yesterdayStart = startOfDay(-1);
  const previousWeekStart = startOfDay(-13);

  const [
    { data: user, error: userError },
    { data: streak, error: streakError },
    { data: sessions, error: sessionsError },
    { data: usageLogs, error: usageLogsError },
    { data: rewards, error: rewardsError },
    { data: aiInsights, error: insightsError },
  ] = await Promise.all([
    supabase.from("users").select("full_name, xp").eq("id", userId).single(),
    supabase.from("streaks").select("current_count").eq("user_id", userId).maybeSingle(),
    supabase
      .from("focus_sessions")
      .select("completed_seconds, completed_minutes, ended_at, created_at, status")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("ended_at", heatmapStart.toISOString()),
    supabase
      .from("usage_logs")
      .select("app_name, category, minutes, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", heatmapStart.toISOString()),
    supabase
      .from("rewards")
      .select("amount, created_at")
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("ai_insights")
      .select("body")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (userError) {
    throw userError;
  }

  if (streakError) {
    throw streakError;
  }

  if (sessionsError) {
    throw sessionsError;
  }

  if (usageLogsError) {
    throw usageLogsError;
  }

  if (rewardsError) {
    throw rewardsError;
  }

  if (insightsError) {
    throw insightsError;
  }

  const screenTimeBuckets = new Map<string, number>();
  const weeklyProgressBuckets = new Map<string, number>();
  const heatmapBuckets = new Map<string, number>();
  const usageByAppToday = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  const distractionByHour = new Map<number, number>();
  const currentWeekScoreBuckets = new Map<string, number>();
  const previousWeekScoreBuckets = new Map<string, number>();
  const weeklyTrendBuckets = new Map<string, { focusHours: number; productive: number; distracting: number }>();

  const streakCount = streak?.current_count ?? 0;
  const xpToday = rewards.reduce((total, reward) => total + reward.amount, 0);

  for (const session of sessions) {
    const endedAt = session.ended_at ? new Date(session.ended_at) : new Date(session.created_at ?? Date.now());
    const dayKey = endedAt.toISOString().slice(0, 10);
    const durationHours = getDurationHours(session);

    if (endedAt >= weeklyProgressStart) {
      weeklyProgressBuckets.set(dayKey, (weeklyProgressBuckets.get(dayKey) ?? 0) + durationHours);
      currentWeekScoreBuckets.set(dayKey, (currentWeekScoreBuckets.get(dayKey) ?? 0) + durationHours);
    }

    if (endedAt >= previousWeekStart && endedAt < weeklyProgressStart) {
      previousWeekScoreBuckets.set(dayKey, (previousWeekScoreBuckets.get(dayKey) ?? 0) + durationHours);
    }

    if (endedAt >= seriesStart) {
      heatmapBuckets.set(dayKey, (heatmapBuckets.get(dayKey) ?? 0) + durationHours);
    }

    if (endedAt >= weeklyTrendStart) {
      const weekKey = `${endedAt.getFullYear()}-${endedAt.getMonth()}-${Math.floor(endedAt.getDate() / 7)}`;
      const currentBucket = weeklyTrendBuckets.get(weekKey) ?? {
        focusHours: 0,
        productive: 0,
        distracting: 0,
      };
      currentBucket.focusHours += durationHours;
      weeklyTrendBuckets.set(weekKey, currentBucket);
    }
  }

  let screenTimeTodayMinutes = 0;
  let screenTimeYesterdayMinutes = 0;

  for (const log of usageLogs) {
    const loggedAt = new Date(log.logged_at);
    const dayKey = loggedAt.toISOString().slice(0, 10);

    if (loggedAt >= seriesStart) {
      screenTimeBuckets.set(dayKey, (screenTimeBuckets.get(dayKey) ?? 0) + log.minutes / 60);
    }

    if (loggedAt >= todayStart) {
      screenTimeTodayMinutes += log.minutes;
      usageByAppToday.set(log.app_name, (usageByAppToday.get(log.app_name) ?? 0) + log.minutes);
    } else if (loggedAt >= yesterdayStart) {
      screenTimeYesterdayMinutes += log.minutes;
    }

    categoryTotals.set(log.category, (categoryTotals.get(log.category) ?? 0) + log.minutes);

    if (loggedAt >= weeklyTrendStart) {
      const weekKey = `${loggedAt.getFullYear()}-${loggedAt.getMonth()}-${Math.floor(loggedAt.getDate() / 7)}`;
      const currentBucket = weeklyTrendBuckets.get(weekKey) ?? {
        focusHours: 0,
        productive: 0,
        distracting: 0,
      };

      if (log.category === "productive") {
        currentBucket.productive += log.minutes;
      }

      if (log.category === "distracting") {
        currentBucket.distracting += log.minutes;
        distractionByHour.set(
          loggedAt.getHours(),
          (distractionByHour.get(loggedAt.getHours()) ?? 0) + log.minutes,
        );
      }

      weeklyTrendBuckets.set(weekKey, currentBucket);
    }
  }

  const weeklyProgress = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDay(index - 6);
    const key = date.toISOString().slice(0, 10);

    return {
      day: formatDay(date),
      hours: round(weeklyProgressBuckets.get(key) ?? 0),
    } satisfies DashboardSeriesPoint;
  });

  const screenTimeSeries = Array.from(
    { length: period === "month" ? 30 : 7 },
    (_, index) => {
      const offset = period === "month" ? index - 29 : index - 6;
      const date = startOfDay(offset);
      const key = date.toISOString().slice(0, 10);

      return {
        day: period === "month" ? `${date.getDate()}` : formatDay(date),
        hours: round(screenTimeBuckets.get(key) ?? 0),
      } satisfies DashboardSeriesPoint;
    },
  );

  const heatmapDays = Array.from({ length: 28 }, (_, index) => startOfDay(index - 27));
  const heatmap: number[][] = [];

  for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
    heatmap.push(
      heatmapDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((date) => {
        const key = date.toISOString().slice(0, 10);
        return bucketHoursIntoHeat(heatmapBuckets.get(key) ?? 0);
      }),
    );
  }

  const categoryBreakdown = buildCategoryBreakdown(categoryTotals);
  const distractionRatio = categoryBreakdown.find((item) => item.name === "Distraction")?.value ?? 0;
  const productiveRatio = categoryBreakdown.find((item) => item.name === "Productive")?.value ?? 0;
  const focusHoursWeek = weeklyProgress.reduce((total, item) => total + item.hours, 0);
  const goalCompletion = clamp(Math.round((focusHoursWeek / 14) * 100), 0, 100);

  const focusScore = clamp(
    Math.round(45 + focusHoursWeek * 4 + productiveRatio * 0.25 - distractionRatio * 0.2 + streakCount * 1.5),
    0,
    100,
  );

  const previousFocusHours = Array.from(previousWeekScoreBuckets.values()).reduce(
    (total, value) => total + value,
    0,
  );
  const previousScore = clamp(
    Math.round(45 + previousFocusHours * 4 + streakCount),
    0,
    100,
  );
  const focusDelta = focusScore - previousScore;

  const weeklyTrend = Array.from(weeklyTrendBuckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-4)
    .map(([weekKey, value]) => {
      const [, month, dayBucket] = weekKey.split("-");
      const pseudoDate = new Date();
      pseudoDate.setMonth(Number(month));
      pseudoDate.setDate(Number(dayBucket) * 7 + 1);

      const totalUsageMinutes = value.productive + value.distracting;
      const productiveShare = totalUsageMinutes > 0 ? value.productive / totalUsageMinutes : 0.5;
      const score = clamp(
        Math.round(40 + value.focusHours * 6 + productiveShare * 25 - (1 - productiveShare) * 10),
        0,
        100,
      );

      return {
        week: formatWeekLabel(pseudoDate),
        score,
      } satisfies WeeklyTrendPoint;
    });

  while (weeklyTrend.length < 4) {
    weeklyTrend.unshift({
      week: `W${4 - weeklyTrend.length}`,
      score: 0,
    });
  }

  const totalUsageToday = Array.from(usageByAppToday.values()).reduce((total, value) => total + value, 0);
  const appUsageToday = Array.from(usageByAppToday.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, minutes], index) => ({
      name,
      minutes,
      hoursLabel: `${round(minutes / 60)}h`,
      share: totalUsageToday > 0 ? clamp(Math.round((minutes / totalUsageToday) * 100), 8, 100) : 0,
      color: APP_USAGE_COLORS[index % APP_USAGE_COLORS.length],
    })) satisfies AppUsagePoint[];

  const peakDistraction = buildPeakDistraction(distractionByHour);
  const aiInsight =
    aiInsights?.body ??
    buildInsight(peakDistraction, goalCompletion, streakCount, focusHoursWeek);

  return {
    greetingName: user.full_name?.split(" ")[0] ?? "there",
    focusScore,
    focusDelta,
    weeklyProgress,
    screenTimeSeries,
    screenTimeHoursToday: round(screenTimeTodayMinutes / 60),
    screenTimeDeltaMinutes: screenTimeTodayMinutes - screenTimeYesterdayMinutes,
    streak: streakCount,
    xp: user.xp,
    xpToday,
    goalCompletion,
    appUsageToday,
    categoryBreakdown,
    weeklyTrend,
    heatmap,
    aiInsight,
    peakDistraction,
  } satisfies DashboardPayload;
}
