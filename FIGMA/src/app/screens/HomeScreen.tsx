"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Clock,
  TrendingUp,
  Flame,
  Zap,
  ChevronRight,
  Smartphone,
  Brain,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { DashboardPayload } from "@/types/dashboard";

const EMPTY_DASHBOARD: DashboardPayload = {
  greetingName: "there",
  focusScore: 0,
  focusDelta: 0,
  weeklyProgress: [
    { day: "Mon", hours: 0 },
    { day: "Tue", hours: 0 },
    { day: "Wed", hours: 0 },
    { day: "Thu", hours: 0 },
    { day: "Fri", hours: 0 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ],
  screenTimeSeries: [],
  screenTimeHoursToday: 0,
  screenTimeDeltaMinutes: 0,
  streak: 0,
  xp: 0,
  xpToday: 0,
  goalCompletion: 0,
  appUsageToday: [],
  categoryBreakdown: [],
  weeklyTrend: [],
  heatmap: [],
  aiInsight: "Complete your first focus session to unlock personalized insights.",
  peakDistraction: {
    label: "No distraction data yet",
    risk: "Low Risk",
    percent: 0,
    summary: "Once usage logs are collected, this panel will become personalized.",
  },
};

function formatDeltaMinutes(value: number) {
  if (value === 0) {
    return "0min";
  }

  return `${value > 0 ? "+" : "-"}${Math.abs(value)}min`;
}

export function HomeScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardPayload>(EMPTY_DASHBOARD);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard?period=week", { cache: "no-store" });
        const payload = (await response.json()) as DashboardPayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load dashboard data.");
        }

        setDashboard(payload);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      }
    };

    void loadDashboard();
  }, []);

  const focusDeltaLabel = `${dashboard.focusDelta >= 0 ? "+" : ""}${dashboard.focusDelta}%`;
  const screenTimeDeltaLabel = formatDeltaMinutes(dashboard.screenTimeDeltaMinutes);
  const topUsageApps = dashboard.appUsageToday.slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-center justify-between"
        >
          <div>
            <h1 className="mb-1 text-2xl font-bold text-white">Good Evening, {dashboard.greetingName}</h1>
            <p className="text-sm text-gray-400">Let&apos;s crush your goals today</p>
          </div>
          <button
            onClick={() => router.push("/app/ai-coach")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C] shadow-lg shadow-[#FF9F1C]/30"
          >
            <Sparkles className="h-5 w-5 text-[#0B0B0F]" />
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl border border-[#FF9F1C]/30 bg-gradient-to-br from-[#FF9F1C]/20 to-[#FF6B1C]/10 p-6 shadow-2xl backdrop-blur-xl lg:p-8"
      >
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF9F1C]/10 blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-400">Focus Score</p>
              <h2 className="text-5xl font-bold text-white">{dashboard.focusScore}</h2>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C]">
              <Zap className="h-8 w-8 text-[#0B0B0F]" fill="#0B0B0F" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dashboard.focusScore}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF9F1C] to-[#10D980]"
              />
            </div>
            <span className="text-sm font-semibold text-[#10D980]">{focusDeltaLabel}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <Clock className="mb-3 h-6 w-6 text-[#FF9F1C]" />
          <p className="mb-1 text-xs text-gray-400">Screen Time</p>
          <h3 className="text-2xl font-bold text-white">{dashboard.screenTimeHoursToday}h</h3>
          <p className="mt-1 text-xs text-[#10D980]">{screenTimeDeltaLabel}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <Flame className="mb-3 h-6 w-6 text-[#FF9F1C]" />
          <p className="mb-1 text-xs text-gray-400">Streak</p>
          <h3 className="text-2xl font-bold text-white">{dashboard.streak}</h3>
          <p className="mt-1 text-xs text-gray-400">days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <Sparkles className="mb-3 h-6 w-6 text-[#10D980]" />
          <p className="mb-1 text-xs text-gray-400">XP Earned</p>
          <h3 className="text-2xl font-bold text-white">{dashboard.xp}</h3>
          <p className="mt-1 text-xs text-[#10D980]">+{dashboard.xpToday} today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <TrendingUp className="mb-3 h-6 w-6 text-[#10D980]" />
          <p className="mb-1 text-xs text-gray-400">Daily Goal</p>
          <h3 className="text-2xl font-bold text-white">{dashboard.goalCompletion}%</h3>
          <p className="mt-1 text-xs text-gray-400">completed</p>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="mb-1 font-semibold text-white">Weekly Progress</h3>
              <p className="text-xs text-gray-400">Productive hours</p>
            </div>
            <button
              onClick={() => router.push("/app/stats")}
              className="flex items-center gap-1 text-xs text-[#FF9F1C]"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={dashboard.weeklyProgress}>
              <Line type="monotone" dataKey="hours" stroke="#FF9F1C" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-between">
            {dashboard.weeklyProgress.map((item) => (
              <span key={item.day} className="text-xs text-gray-500">
                {item.day}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Today&apos;s App Usage</h3>
            <button
              onClick={() => router.push("/app/blocking")}
              className="flex items-center gap-1 text-xs text-[#FF9F1C]"
            >
              Manage
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {topUsageApps.length > 0 ? (
            <div className="space-y-3">
              {topUsageApps.map((app) => (
                <div key={app.name} className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${app.color}, #111827)` }}
                  >
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-white">{app.name}</span>
                      <span className="text-sm text-gray-400">{app.hoursLabel}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${app.share}%`,
                          background: `linear-gradient(90deg, ${app.color}, #FF9F1C)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No usage logs yet. Start tracking usage to see your top apps.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => router.push("/app/ai-coach")}
          className="cursor-pointer rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-blue-500/10 p-5 backdrop-blur-xl transition-transform active:scale-95 lg:col-span-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-semibold text-white">AI Insight</h4>
              <p className="text-sm leading-relaxed text-gray-300">{dashboard.aiInsight}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
