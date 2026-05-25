import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FocusSessionStatus } from "@/types/database";
import { insertActivityLog } from "@/lib/data/activity-logs";

type AppSupabaseClient = SupabaseClient<Database>;
type FocusSessionRow = Database["public"]["Tables"]["focus_sessions"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type StreakRow = Database["public"]["Tables"]["streaks"]["Row"];

export type FocusSessionSnapshot = {
  id: string;
  durationMinutes: number;
  completedSeconds: number;
  secondsLeft: number;
  status: FocusSessionStatus;
  xpAwarded: number;
};

export type FocusSessionStatePayload = {
  currentSession: FocusSessionSnapshot | null;
  xp: number;
  streak: number;
  completedSessions: number;
  completedHours: number;
  weekSessions: number;
};

const XP_REWARDS: Record<number, number> = {
  25: 90,
  50: 180,
};

function getReward(durationMinutes: number) {
  return XP_REWARDS[durationMinutes] ?? Math.max(60, durationMinutes * 3);
}

function deriveLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 500) + 1);
}

function getElapsedSince(dateString: string | null) {
  if (!dateString) {
    return 0;
  }

  const startedAt = new Date(dateString).getTime();

  if (Number.isNaN(startedAt)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

function getCompletedSeconds(session: FocusSessionRow) {
  const storedSeconds = session.completed_seconds ?? 0;

  if (session.status !== "active") {
    return storedSeconds;
  }

  return storedSeconds + getElapsedSince(session.started_at);
}

function serializeSession(session: FocusSessionRow): FocusSessionSnapshot {
  const completedSeconds = Math.min(getCompletedSeconds(session), session.duration_minutes * 60);

  return {
    id: session.id,
    durationMinutes: session.duration_minutes,
    completedSeconds,
    secondsLeft: Math.max(0, session.duration_minutes * 60 - completedSeconds),
    status: session.status,
    xpAwarded: session.xp_awarded,
  };
}

async function getUserStats(supabase: AppSupabaseClient, userId: string) {
  const [{ data: user, error: userError }, { data: streakRow, error: streakError }, { data: sessions, error: sessionsError }] =
    await Promise.all([
      supabase.from("users").select("xp").eq("id", userId).single(),
      supabase.from("streaks").select("current_count").eq("user_id", userId).maybeSingle(),
      supabase
        .from("focus_sessions")
        .select("duration_minutes, completed_seconds, status, ended_at")
        .eq("user_id", userId)
        .eq("status", "completed"),
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

  const completedSessions = sessions.length;
  const completedHours =
    Math.round(
      (sessions.reduce((total, session) => total + (session.completed_seconds ?? session.duration_minutes * 60), 0) /
        3600) *
        10,
    ) / 10;

  const weekBoundary = new Date();
  weekBoundary.setDate(weekBoundary.getDate() - 7);

  const weekSessions = sessions.filter((session) => {
    if (!session.ended_at) {
      return false;
    }

    return new Date(session.ended_at).getTime() >= weekBoundary.getTime();
  }).length;

  return {
    xp: user.xp,
    streak: streakRow?.current_count ?? 0,
    completedSessions,
    completedHours,
    weekSessions,
  };
}

async function getLatestOpenSession(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function cancelOpenSessions(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "paused"]);

  if (error) {
    throw error;
  }

  await Promise.all(
    data.map(async (session) => {
      const completedSeconds = getCompletedSeconds(session);
      const { error: updateError } = await supabase
        .from("focus_sessions")
        .update({
          status: "cancelled",
          started_at: null,
          ended_at: new Date().toISOString(),
          completed_seconds: completedSeconds,
          completed_minutes: Math.floor(completedSeconds / 60),
        })
        .eq("id", session.id)
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }
    }),
  );
}

async function awardCompletionProgress(
  supabase: AppSupabaseClient,
  userId: string,
  session: FocusSessionRow,
): Promise<void> {
  const reward = getReward(session.duration_minutes);
  const [{ data: user, error: userError }, { data: streakRow, error: streakError }] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (userError) {
    throw userError;
  }

  if (streakError) {
    throw streakError;
  }

  const nextXp = user.xp + reward;
  const nextLevel = deriveLevel(nextXp);

  const { error: updateUserError } = await supabase
    .from("users")
    .update({ xp: nextXp, level: nextLevel })
    .eq("id", userId);

  if (updateUserError) {
    throw updateUserError;
  }

  if (!streakRow) {
    const { error: createStreakError } = await supabase.from("streaks").insert({
      user_id: userId,
      current_count: 1,
      longest_count: 1,
    });

    if (createStreakError) {
      throw createStreakError;
    }
  } else {
    const nextCount = streakRow.current_count + 1;
    const { error: updateStreakError } = await supabase
      .from("streaks")
      .update({
        current_count: nextCount,
        longest_count: Math.max(streakRow.longest_count, nextCount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", streakRow.id)
      .eq("user_id", userId);

    if (updateStreakError) {
      throw updateStreakError;
    }
  }

  const { error: rewardError } = await supabase.from("rewards").insert({
    user_id: userId,
    reward_type: "focus_session_completion",
    amount: reward,
  });

  if (rewardError) {
    throw rewardError;
  }

  await insertActivityLog(supabase, userId, "reward_earned", {
    rewardType: "focus_session_completion",
    amount: reward,
    durationMinutes: session.duration_minutes,
  });
}

async function completeSessionRecord(
  supabase: AppSupabaseClient,
  userId: string,
  session: FocusSessionRow,
) {
  const reward = getReward(session.duration_minutes);
  const completedSeconds = session.duration_minutes * 60;
  const { data: updatedSession, error: updateError } = await supabase
    .from("focus_sessions")
    .update({
      status: "completed",
      started_at: null,
      ended_at: new Date().toISOString(),
      xp_awarded: reward,
      completed_seconds: completedSeconds,
      completed_minutes: session.duration_minutes,
    })
    .eq("id", session.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  await awardCompletionProgress(supabase, userId, updatedSession);
  await insertActivityLog(supabase, userId, "session_completed", {
    sessionId: updatedSession.id,
    durationMinutes: updatedSession.duration_minutes,
    xpAwarded: updatedSession.xp_awarded,
  });

  return updatedSession;
}

export async function getFocusSessionState(supabase: AppSupabaseClient, userId: string) {
  let currentSession = await getLatestOpenSession(supabase, userId);

  if (currentSession?.status === "active") {
    const elapsed = getCompletedSeconds(currentSession);

    if (elapsed >= currentSession.duration_minutes * 60) {
      await completeSessionRecord(supabase, userId, currentSession);
      currentSession = null;
    }
  }

  const stats = await getUserStats(supabase, userId);

  return {
    currentSession: currentSession ? serializeSession(currentSession) : null,
    ...stats,
  } satisfies FocusSessionStatePayload;
}

export async function createFocusSession(
  supabase: AppSupabaseClient,
  userId: string,
  durationMinutes: number,
) {
  await cancelOpenSessions(supabase, userId);

  const { error } = await supabase.from("focus_sessions").insert({
    user_id: userId,
    duration_minutes: durationMinutes,
    completed_seconds: 0,
    completed_minutes: 0,
    xp_awarded: 0,
    status: "active",
    started_at: new Date().toISOString(),
    ended_at: null,
  });

  if (error) {
    throw error;
  }

  const { data: sessionRecord, error: sessionLookupError } = await supabase
    .from("focus_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (sessionLookupError) {
    throw sessionLookupError;
  }

  await insertActivityLog(supabase, userId, "session_started", {
    sessionId: sessionRecord.id,
    durationMinutes,
  });

  return getFocusSessionState(supabase, userId);
}

export async function updateFocusSession(
  supabase: AppSupabaseClient,
  userId: string,
  sessionId: string,
  action: "pause" | "resume" | "end" | "complete",
) {
  const { data: session, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  if (action === "pause") {
    const completedSeconds = getCompletedSeconds(session);
    const { error: updateError } = await supabase
      .from("focus_sessions")
      .update({
        status: "paused",
        started_at: null,
        completed_seconds: completedSeconds,
        completed_minutes: Math.floor(completedSeconds / 60),
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    await insertActivityLog(supabase, userId, "session_paused", {
      sessionId,
      completedSeconds,
      durationMinutes: session.duration_minutes,
    });
  }

  if (action === "resume") {
    const { error: updateError } = await supabase
      .from("focus_sessions")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }
  }

  if (action === "end") {
    const completedSeconds = getCompletedSeconds(session);
    const { error: updateError } = await supabase
      .from("focus_sessions")
      .update({
        status: "cancelled",
        started_at: null,
        ended_at: new Date().toISOString(),
        completed_seconds: completedSeconds,
        completed_minutes: Math.floor(completedSeconds / 60),
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }
  }

  if (action === "complete") {
    await completeSessionRecord(supabase, userId, session);
  }

  return getFocusSessionState(supabase, userId);
}
