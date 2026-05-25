import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

export type RewardAchievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  color: string;
  icon: "zap" | "target" | "star" | "crown" | "award" | "trophy";
};

export type RewardActivity = {
  id: string;
  label: string;
  amount: number;
  createdAt: string;
};

export type RewardsPayload = {
  level: number;
  xp: number;
  nextLevelXp: number;
  badgesUnlocked: number;
  rewardPoints: number;
  streak: number;
  achievements: RewardAchievement[];
  recentRewards: RewardActivity[];
};

function deriveFocusScore(totalHours: number, streak: number, xp: number) {
  return Math.min(100, Math.max(0, Math.round(45 + totalHours * 4 + streak * 2 + xp / 300)));
}

export async function getRewardsData(supabase: AppSupabaseClient, userId: string) {
  const [
    { data: user, error: userError },
    { data: streakRow, error: streakError },
    { data: sessions, error: sessionsError },
    { data: rewards, error: rewardsError },
  ] = await Promise.all([
    supabase.from("users").select("level, xp").eq("id", userId).single(),
    supabase.from("streaks").select("current_count").eq("user_id", userId).maybeSingle(),
    supabase
      .from("focus_sessions")
      .select("completed_seconds, completed_minutes")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("rewards")
      .select("id, reward_type, amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
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

  if (rewardsError) {
    throw rewardsError;
  }

  const streak = streakRow?.current_count ?? 0;
  const totalHours =
    sessions.reduce((total, session) => {
      const seconds = session.completed_seconds ?? ((session.completed_minutes ?? 0) * 60);
      return total + seconds / 3600;
    }, 0);
  const focusScore = deriveFocusScore(totalHours, streak, user.xp);
  const rewardPoints = rewards.reduce((total, reward) => total + reward.amount, 0);
  const nextLevelXp = Math.max(user.level * 500, user.xp + 1);

  const achievements = [
    {
      id: "first-focus",
      icon: "zap",
      title: "First Focus",
      description: "Complete your first focus session",
      unlocked: sessions.length >= 1,
      color: "from-[#FF9F1C] to-[#FF6B1C]",
    },
    {
      id: "seven-day-streak",
      icon: "target",
      title: "7 Day Streak",
      description: "Keep your streak alive for 7 days",
      unlocked: streak >= 7,
      color: "from-[#10D980] to-[#06B55E]",
    },
    {
      id: "focus-master",
      icon: "star",
      title: "Focus Master",
      description: "Reach a focus score of 100",
      unlocked: focusScore >= 100,
      color: "from-[#8B5CF6] to-[#7C3AED]",
    },
    {
      id: "productivity-king",
      icon: "crown",
      title: "Productivity King",
      description: "Keep a 30 day streak",
      unlocked: streak >= 30,
      color: "from-gray-600 to-gray-700",
    },
    {
      id: "milestone",
      icon: "award",
      title: "Milestone",
      description: "Earn 5000 XP",
      unlocked: user.xp >= 5000,
      color: "from-gray-600 to-gray-700",
    },
    {
      id: "champion",
      icon: "trophy",
      title: "Champion",
      description: "Complete 100 sessions",
      unlocked: sessions.length >= 100,
      color: "from-gray-600 to-gray-700",
    },
  ] satisfies RewardAchievement[];

  return {
    level: user.level,
    xp: user.xp,
    nextLevelXp,
    badgesUnlocked: achievements.filter((item) => item.unlocked).length,
    rewardPoints,
    streak,
    achievements,
    recentRewards: rewards.map((reward) => ({
      id: reward.id,
      label: reward.reward_type.replace(/_/g, " "),
      amount: reward.amount,
      createdAt: reward.created_at,
    })),
  } satisfies RewardsPayload;
}
