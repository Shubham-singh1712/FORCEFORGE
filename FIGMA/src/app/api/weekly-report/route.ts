import { NextResponse } from "next/server";
import { insertActivityLog } from "@/lib/data/activity-logs";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data/dashboard";
import type { WeeklyReportPayload } from "@/types/weekly-report";

function startOfWeek(offsetWeeks = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff + offsetWeeks * 7);
  return date;
}

function formatWeekLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getCompletedHours(session: { completed_seconds?: number | null; completed_minutes?: number | null }) {
  const completedSeconds =
    session.completed_seconds ?? ((session.completed_minutes ?? 0) * 60);
  return completedSeconds / 3600;
}

function calculatePercentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentWeekStart = startOfWeek(0);
  const previousWeekStart = startOfWeek(-1);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 7);
  const previousWeekEnd = new Date(previousWeekStart);
  previousWeekEnd.setDate(previousWeekStart.getDate() + 7);

  try {
    const dashboard = await getDashboardData(supabase, user.id, "week");

    const [
      { data: currentSessions, error: currentSessionsError },
      { data: previousSessions, error: previousSessionsError },
      { data: currentUsage, error: currentUsageError },
      { data: previousUsage, error: previousUsageError },
      { data: currentRewards, error: currentRewardsError },
      { data: streak, error: streakError },
    ] = await Promise.all([
      supabase
        .from("focus_sessions")
        .select("completed_seconds, completed_minutes, ended_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("ended_at", currentWeekStart.toISOString())
        .lt("ended_at", currentWeekEnd.toISOString()),
      supabase
        .from("focus_sessions")
        .select("completed_seconds, completed_minutes, ended_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("ended_at", previousWeekStart.toISOString())
        .lt("ended_at", previousWeekEnd.toISOString()),
      supabase
        .from("usage_logs")
        .select("app_name, category, minutes, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", currentWeekStart.toISOString())
        .lt("logged_at", currentWeekEnd.toISOString()),
      supabase
        .from("usage_logs")
        .select("app_name, category, minutes")
        .eq("user_id", user.id)
        .gte("logged_at", previousWeekStart.toISOString())
        .lt("logged_at", previousWeekEnd.toISOString()),
      supabase
        .from("rewards")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", currentWeekStart.toISOString())
        .lt("created_at", currentWeekEnd.toISOString()),
      supabase.from("streaks").select("current_count").eq("user_id", user.id).maybeSingle(),
    ]);

    if (currentSessionsError) {
      throw currentSessionsError;
    }

    if (previousSessionsError) {
      throw previousSessionsError;
    }

    if (currentUsageError) {
      throw currentUsageError;
    }

    if (previousUsageError) {
      throw previousUsageError;
    }

    if (currentRewardsError) {
      throw currentRewardsError;
    }

    if (streakError) {
      throw streakError;
    }

    const totalFocusHours = round(
      currentSessions.reduce((total, session) => total + getCompletedHours(session), 0),
    );
    const previousFocusHours = round(
      previousSessions.reduce((total, session) => total + getCompletedHours(session), 0),
    );
    const sessionsCompleted = currentSessions.length;
    const xpEarned = currentRewards.reduce((total, reward) => total + reward.amount, 0);
    const avgFocusScore = dashboard.focusScore;
    const focusScoreDelta = dashboard.focusDelta;
    const goalsCompleted = currentSessions.length;
    const goalCompletionRate = Math.min(100, Math.round((currentSessions.length / 7) * 100));
    const improvement = calculatePercentChange(totalFocusHours, previousFocusHours);

    const currentWeekDays = new Set(
      currentSessions
        .filter((session) => session.ended_at)
        .map((session) => String(session.ended_at).slice(0, 10)),
    );
    const streakGrowth = Math.min(streak?.current_count ?? 0, currentWeekDays.size);

    const currentDistractingMinutes = currentUsage
      .filter((entry) => entry.category === "distracting")
      .reduce((total, entry) => total + entry.minutes, 0);
    const currentUsageMinutes = currentUsage.reduce((total, entry) => total + entry.minutes, 0);
    const previousDistractingMinutes = previousUsage
      .filter((entry) => entry.category === "distracting")
      .reduce((total, entry) => total + entry.minutes, 0);
    const previousUsageMinutes = previousUsage.reduce((total, entry) => total + entry.minutes, 0);

    const distractionRatio =
      currentUsageMinutes > 0 ? Math.round((currentDistractingMinutes / currentUsageMinutes) * 100) : 0;
    const previousDistractionRatio =
      previousUsageMinutes > 0
        ? Math.round((previousDistractingMinutes / previousUsageMinutes) * 100)
        : 0;
    const distractionRatioDelta = distractionRatio - previousDistractionRatio;

    const currentAppTotals = currentUsage.reduce((totals, entry) => {
      totals.set(entry.app_name, (totals.get(entry.app_name) ?? 0) + entry.minutes);
      return totals;
    }, new Map<string, number>());
    const previousAppTotals = previousUsage.reduce((totals, entry) => {
      totals.set(entry.app_name, (totals.get(entry.app_name) ?? 0) + entry.minutes);
      return totals;
    }, new Map<string, number>());

    const mostUsedApps = Array.from(currentAppTotals.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([name, minutes]) => {
        const previousMinutes = previousAppTotals.get(name) ?? 0;
        return {
          name,
          time: `${round(minutes / 60)}h`,
          change: calculatePercentChange(minutes, previousMinutes),
        };
      });

    const dailyFocus = dashboard.weeklyProgress;
    const aiSummary =
      dashboard.aiInsight ||
      `You completed ${sessionsCompleted} focus sessions for ${totalFocusHours} hours this week. Your distraction ratio is ${distractionRatio}% and your best improvement lever is protecting ${dashboard.peakDistraction.label}.`;

    const payload = {
      weekLabel: formatWeekLabel(currentWeekStart),
      totalFocusHours,
      sessionsCompleted,
      xpEarned,
      avgFocusScore,
      focusScoreDelta,
      goalsCompleted,
      goalCompletionRate,
      improvement,
      streakGrowth,
      distractionRatio,
      distractionRatioDelta,
      mostUsedApps,
      dailyFocus,
      aiSummary,
    } satisfies WeeklyReportPayload;

    const { error: upsertError } = await supabase.from("weekly_reports").upsert(
      {
        user_id: user.id,
        week_start: currentWeekStart.toISOString().slice(0, 10),
        metrics: payload,
        ai_summary: aiSummary,
      },
      { onConflict: "user_id,week_start" },
    );

    if (upsertError) {
      throw upsertError;
    }

    await insertActivityLog(supabase, user.id, "weekly_report_generated", {
      weekStart: currentWeekStart.toISOString().slice(0, 10),
      totalFocusHours,
      sessionsCompleted,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to generate weekly report", error);
    return NextResponse.json({ error: "Failed to generate weekly report" }, { status: 500 });
  }
}
