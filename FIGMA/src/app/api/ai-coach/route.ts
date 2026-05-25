import { NextResponse } from "next/server";
import { z } from "zod";
import { insertActivityLog } from "@/lib/data/activity-logs";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data/dashboard";

const coachRequestSchema = z.object({
  prompt: z.string().min(3).max(1000),
});

const systemPrompt =
  "You are FocusForge AI, a concise productivity coach. Use the user's real focus sessions, streaks, blocked apps, and usage patterns. Return 4 short bullet points with specific times or actions when possible.";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

type CoachPayload = {
  insights: Array<{
    id: string;
    icon: "clock" | "trend" | "calendar";
    title: string;
    message: string;
    actionLabel: string;
    color: string;
  }>;
  recommendations: Array<{
    id: string;
    text: string;
    impact: string;
  }>;
  productivityTrend: {
    change: number;
    progress: number;
  };
  defaultPrompt: string;
};

function formatHourWindow(hour: number) {
  const start = `${hour}:00`;
  const end = `${(hour + 2) % 24}:00`;
  return `${start}-${end}`;
}

async function callOpenRouter(prompt: string, requestOrigin: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": requestOrigin,
      "X-Title": "FocusForge AI",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenRouter request failed");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}
async function getAuthedClient() {
  const supabase = await createClient();

  if (!supabase) {
    return {
      error: NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user };
}

async function loadCoachContext(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
) {
  const dashboard = await getDashboardData(supabase, userId, "week");

  const since = new Date();
  since.setDate(since.getDate() - 14);
  since.setHours(0, 0, 0, 0);

  const [
    { data: blockedApps, error: blockedAppsError },
    { data: usageLogs, error: usageLogsError },
    { data: focusSessions, error: focusSessionsError },
  ] = await Promise.all([
    supabase
      .from("blocked_apps")
      .select("app_name, is_blocked, category")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("usage_logs")
      .select("app_name, category, minutes, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", since.toISOString()),
    supabase
      .from("focus_sessions")
      .select("completed_seconds, ended_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("ended_at", since.toISOString()),
  ]);

  if (blockedAppsError) {
    throw blockedAppsError;
  }

  if (usageLogsError) {
    throw usageLogsError;
  }

  if (focusSessionsError) {
    throw focusSessionsError;
  }

  const activeBlockedApps = blockedApps.filter((app) => app.is_blocked).map((app) => app.app_name);

  const productiveByHour = new Map<number, number>();
  const distractingByApp = new Map<string, number>();

  for (const log of usageLogs) {
    const hour = new Date(log.logged_at).getHours();

    if (log.category === "productive") {
      productiveByHour.set(hour, (productiveByHour.get(hour) ?? 0) + log.minutes);
    }

    if (log.category === "distracting") {
      distractingByApp.set(log.app_name, (distractingByApp.get(log.app_name) ?? 0) + log.minutes);
    }
  }

  let bestProductiveHour = 9;
  let bestProductiveMinutes = 0;

  for (const [hour, minutes] of productiveByHour.entries()) {
    if (minutes > bestProductiveMinutes) {
      bestProductiveHour = hour;
      bestProductiveMinutes = minutes;
    }
  }

  const topDistractingApps = Array.from(distractingByApp.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([name]) => name);

  const focusHours = focusSessions.reduce(
    (total, session) => total + (session.completed_seconds ?? 0) / 3600,
    0,
  );

  return {
    dashboard,
    activeBlockedApps,
    topDistractingApps,
    focusHours,
    optimalWindow: formatHourWindow(bestProductiveHour),
  };
}

function buildFallbackInsight(context: Awaited<ReturnType<typeof loadCoachContext>>, prompt: string) {
  const appsToBlock =
    context.topDistractingApps.length > 0
      ? context.topDistractingApps.join(", ")
      : context.activeBlockedApps.slice(0, 3).join(", ");

  return [
    `Protect ${context.dashboard.peakDistraction.label} because that is still your highest-risk distraction window.`,
    `Your best recent productivity window is ${context.optimalWindow}, so schedule deep work there first.`,
    `You have ${context.dashboard.streak} active streak days and ${Math.round(context.focusHours)} focus hours in the last two weeks. Keep sessions consistent instead of longer.`,
    `For this request: "${prompt}", start by blocking ${appsToBlock || "your top social apps"} and aim for one 25-minute sprint today.`,
  ].join("\n");
}

function buildCoachPayload(context: Awaited<ReturnType<typeof loadCoachContext>>) {
  const recommendationApps =
    context.topDistractingApps.length > 0
      ? context.topDistractingApps.slice(0, 2).join(" and ")
      : "social apps";

  return {
    insights: [
      {
        id: "peak-distraction",
        icon: "clock",
        title: "Peak Distraction Hours",
        message: `You are most distracted around ${context.dashboard.peakDistraction.label}. Protect that window before entertainment apps take over.`,
        actionLabel: "Schedule Focus Session",
        color: "from-[#FF9F1C] to-[#FF6B1C]",
      },
      {
        id: "productivity-window",
        icon: "trend",
        title: "Optimal Productivity Window",
        message: `Your strongest recent productive block is ${context.optimalWindow}. That is the best time to stack deep work sessions.`,
        actionLabel: "Set Morning Goal",
        color: "from-[#10D980] to-[#06B55E]",
      },
      {
        id: "weekly-pattern",
        icon: "calendar",
        title: "Weekly Pattern",
        message: `Your focus score moved ${context.dashboard.focusDelta >= 0 ? "up" : "down"} by ${Math.abs(context.dashboard.focusDelta)} points this week, with a ${context.dashboard.streak}-day streak now in progress.`,
        actionLabel: "Configure Weekend Mode",
        color: "from-[#8B5CF6] to-[#7C3AED]",
      },
    ],
    recommendations: [
      {
        id: "block-distraction",
        text: `Block ${recommendationApps} during your peak risk window`,
        impact: `Lower distraction risk during ${context.dashboard.peakDistraction.label}`,
      },
      {
        id: "protect-window",
        text: `Reserve ${context.optimalWindow} for deep work`,
        impact: `Align sessions with your best productive hours`,
      },
      {
        id: "streak-recovery",
        text: "Use one 25-minute recovery sprint on low-focus days",
        impact: `Keep your ${context.dashboard.streak}-day streak moving`,
      },
    ],
    productivityTrend: {
      change: context.dashboard.focusDelta,
      progress: context.dashboard.focusScore,
    },
    defaultPrompt: `How can I protect ${context.dashboard.peakDistraction.label} and improve my ${context.dashboard.focusScore} focus score this week?`,
  } satisfies CoachPayload;
}

async function saveInsight(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  prompt: string,
  insight: string,
) {
  const title = prompt.slice(0, 80);

  const { error } = await supabase.from("ai_insights").insert({
    user_id: userId,
    title,
    body: insight,
  });

  if (error) {
    throw error;
  }
}

export async function GET() {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  try {
    const context = await loadCoachContext(auth.supabase, auth.user.id);
    return NextResponse.json(buildCoachPayload(context));
  } catch (error) {
    console.error("Failed to load AI coach context", error);
    return NextResponse.json({ error: "Failed to load AI coach context" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const body = coachRequestSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid coach request" }, { status: 400 });
  }

  try {
    const context = await loadCoachContext(auth.supabase, auth.user.id);
    const promptContext = [
      `User request: ${body.data.prompt}`,
      `Focus score: ${context.dashboard.focusScore}`,
      `Focus delta this week: ${context.dashboard.focusDelta}`,
      `Current streak: ${context.dashboard.streak}`,
      `Peak distraction window: ${context.dashboard.peakDistraction.label}`,
      `Best productivity window: ${context.optimalWindow}`,
      `Two-week focus hours: ${context.focusHours.toFixed(1)}`,
      `Blocked apps: ${context.activeBlockedApps.join(", ") || "none configured"}`,
      `Top distracting apps: ${context.topDistractingApps.join(", ") || "no distracting app data"}`,
      `AI insight baseline: ${context.dashboard.aiInsight}`,
    ].join("\n");

    const requestOrigin = new URL(request.url).origin;
    const insight = process.env.OPENROUTER_API_KEY
      ? await callOpenRouter(promptContext, requestOrigin)
      : buildFallbackInsight(context, body.data.prompt);

    await saveInsight(auth.supabase, auth.user.id, body.data.prompt, insight);
    await insertActivityLog(auth.supabase, auth.user.id, "ai_insight_generated", {
      prompt: body.data.prompt,
      provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "fallback",
      model: process.env.OPENROUTER_API_KEY ? OPENROUTER_MODEL : "fallback",
    });

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Failed to generate AI coach insight", error);

    try {
      const context = await loadCoachContext(auth.supabase, auth.user.id);
      const fallbackInsight = buildFallbackInsight(context, body.data.prompt);
      await saveInsight(auth.supabase, auth.user.id, body.data.prompt, fallbackInsight);
      await insertActivityLog(auth.supabase, auth.user.id, "ai_insight_generated", {
        prompt: body.data.prompt,
        provider: "fallback",
      });
      return NextResponse.json({ insight: fallbackInsight }, { status: 200 });
    } catch (fallbackError) {
      console.error("Failed to build fallback AI insight", fallbackError);
      return NextResponse.json(
        {
          error: "Failed to generate AI coach insight",
        },
        { status: 500 },
      );
    }
  }
}
