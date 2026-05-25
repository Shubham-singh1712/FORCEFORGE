"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Zap,
  Target,
  Star,
  Crown,
  Award,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { RewardAchievement, RewardsPayload } from "@/lib/data/rewards";

const EMPTY_REWARDS: RewardsPayload = {
  level: 1,
  xp: 0,
  nextLevelXp: 500,
  badgesUnlocked: 0,
  rewardPoints: 0,
  streak: 0,
  achievements: [],
  recentRewards: [],
};

function getAchievementIcon(icon: RewardAchievement["icon"]) {
  if (icon === "zap") return Zap;
  if (icon === "target") return Target;
  if (icon === "star") return Star;
  if (icon === "crown") return Crown;
  if (icon === "award") return Award;
  return Trophy;
}

export function RewardsScreen() {
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [rewards, setRewards] = useState<RewardsPayload>(EMPTY_REWARDS);

  useEffect(() => {
    const loadRewards = async () => {
      try {
        const response = await fetch("/api/rewards", { cache: "no-store" });
        const data = (await response.json()) as RewardsPayload & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load rewards.");
        }

        setRewards(data);
      } catch (error) {
        console.error("Failed to load rewards", error);
        toast.error("Could not load your rewards data.");
      }
    };

    void loadRewards();
  }, []);

  const xpProgress = Math.min(100, (rewards.xp / rewards.nextLevelXp) * 100);
  const visibleRewards = showAllRewards ? rewards.recentRewards : rewards.recentRewards.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="mb-1 text-2xl font-bold text-white">Rewards</h1>
        <p className="text-sm text-gray-400">Track your achievements</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-[#FF9F1C]/30 bg-gradient-to-br from-[#FF9F1C]/20 to-[#FF6B1C]/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF9F1C]/10 blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C]">
                <Trophy className="h-8 w-8 text-[#0B0B0F]" />
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">Level</p>
                <h2 className="text-3xl font-bold text-white">{rewards.level}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="mb-1 text-xs text-gray-400">XP</p>
              <h3 className="text-2xl font-bold text-white">{rewards.xp.toLocaleString()}</h3>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">Progress to Level {rewards.level + 1}</span>
              <span className="text-xs text-gray-400">
                {Math.max(0, rewards.nextLevelXp - rewards.xp)} XP needed
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF9F1C] to-[#10D980]"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl"
        >
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-[#10D980]" />
          <p className="text-xl font-bold text-white">{rewards.badgesUnlocked}</p>
          <p className="text-xs text-gray-400">Badges</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl"
        >
          <Zap className="mx-auto mb-2 h-6 w-6 text-[#FF9F1C]" />
          <p className="text-xl font-bold text-white">{rewards.rewardPoints.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Reward Points</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl"
        >
          <Trophy className="mx-auto mb-2 h-6 w-6 text-[#8B5CF6]" />
          <p className="text-xl font-bold text-white">{rewards.streak}</p>
          <p className="text-xs text-gray-400">Current Streak</p>
        </motion.div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Achievements</h2>
          <span className="text-xs text-gray-400">
            {rewards.achievements.filter((item) => item.unlocked).length}/{rewards.achievements.length} Unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {rewards.achievements.map((achievement, index) => {
            const Icon = getAchievementIcon(achievement.icon);

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`rounded-2xl border p-4 text-center ${
                  achievement.unlocked
                    ? "border-white/10 bg-white/5"
                    : "border-white/5 bg-white/[0.02] opacity-50"
                }`}
              >
                <div
                  className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${achievement.color}`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="mb-1 text-xs font-semibold text-white">{achievement.title}</h4>
                <p className="text-[10px] leading-tight text-gray-400">{achievement.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent Reward Activity</h2>
          <button
            onClick={() => {
              setShowAllRewards((current) => !current);
              toast.success(showAllRewards ? "Showing latest rewards" : "Expanded reward history");
            }}
            className="flex items-center gap-1 text-xs text-[#FF9F1C]"
          >
            {showAllRewards ? "Latest" : "View All"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {visibleRewards.length > 0 ? (
            visibleRewards.map((reward, index) => (
              <div
                key={reward.id}
                className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                  index === 0
                    ? "border border-[#FF9F1C]/30 bg-gradient-to-r from-[#FF9F1C]/20 to-[#FF6B1C]/10"
                    : "bg-white/5"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white">
                  {reward.label
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{reward.label}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(reward.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#10D980]">+{reward.amount}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white/5 p-4 text-sm text-gray-400">
              Complete focus sessions to start earning rewards and unlock achievements.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
