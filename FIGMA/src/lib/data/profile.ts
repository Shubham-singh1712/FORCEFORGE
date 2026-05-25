import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

export type ProfilePayload = {
  name: string;
  email: string;
  initials: string;
  level: number;
  xp: number;
  streak: number;
  totalHours: number;
  completedSessions: number;
};

function buildInitials(name: string, email: string) {
  const base = name.trim() || email.trim();

  if (!base) {
    return "FF";
  }

  const parts = base.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

export async function getProfileData(supabase: AppSupabaseClient, userId: string) {
  const [{ data: user, error: userError }, { data: streak, error: streakError }, { data: sessions, error: sessionsError }] =
    await Promise.all([
      supabase.from("users").select("full_name, email, level, xp").eq("id", userId).single(),
      supabase.from("streaks").select("current_count").eq("user_id", userId).maybeSingle(),
      supabase
        .from("focus_sessions")
        .select("completed_seconds, completed_minutes")
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

  const totalHours =
    Math.round(
      (sessions.reduce((total, session) => {
        const seconds = session.completed_seconds ?? ((session.completed_minutes ?? 0) * 60);
        return total + seconds;
      }, 0) /
        3600) *
        10,
    ) / 10;

  const name = user.full_name?.trim() || user.email.split("@")[0] || "FocusForge User";

  return {
    name,
    email: user.email,
    initials: buildInitials(name, user.email),
    level: user.level,
    xp: user.xp,
    streak: streak?.current_count ?? 0,
    totalHours,
    completedSessions: sessions.length,
  } satisfies ProfilePayload;
}

export async function updateProfileData(
  supabase: AppSupabaseClient,
  userId: string,
  values: {
    name: string;
    email: string;
  },
) {
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim().toLowerCase();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser?.email) {
    throw authError ?? new Error("Unable to load authenticated user.");
  }

  if (trimmedEmail && trimmedEmail !== authUser.email.toLowerCase()) {
    const { error: updateAuthError } = await supabase.auth.updateUser({ email: trimmedEmail });

    if (updateAuthError) {
      throw updateAuthError;
    }
  }

  const { error: updateProfileError } = await supabase
    .from("users")
    .update({
      full_name: trimmedName || null,
      email: trimmedEmail || authUser.email,
    })
    .eq("id", userId);

  if (updateProfileError) {
    throw updateProfileError;
  }

  return getProfileData(supabase, userId);
}
