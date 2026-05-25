"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardPayload } from "@/types/dashboard";

const EMPTY_DASHBOARD: DashboardPayload = {
  greetingName: "there",
  focusScore: 0,
  focusDelta: 0,
  weeklyProgress: [],
  screenTimeSeries: [],
  screenTimeHoursToday: 0,
  screenTimeDeltaMinutes: 0,
  streak: 0,
  xp: 0,
  xpToday: 0,
  goalCompletion: 0,
  appUsageToday: [],
  categoryBreakdown: [
    { name: "Productive", value: 0, color: "#10D980" },
    { name: "Distraction", value: 0, color: "#FF9F1C" },
    { name: "Neutral", value: 0, color: "#94A3B8" },
  ],
  weeklyTrend: [
    { week: "W1", score: 0 },
    { week: "W2", score: 0 },
    { week: "W3", score: 0 },
    { week: "W4", score: 0 },
  ],
  heatmap: Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => 0)),
  aiInsight: "",
  peakDistraction: {
    label: "No distraction data yet",
    risk: "Low Risk",
    percent: 0,
    summary: "Once usage logs are collected, this panel will flag your peak distraction window.",
  },
};

function getTrendDelta(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  return values[values.length - 1] - values[0];
}

export function StatsScreen() {
  const [timePeriod, setTimePeriod] = useState<"week" | "month">("week");
  const [dashboard, setDashboard] = useState<DashboardPayload>(EMPTY_DASHBOARD);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(`/api/dashboard?period=${timePeriod}`, { cache: "no-store" });
        const payload = (await response.json()) as DashboardPayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load statistics.");
        }

        setDashboard(payload);
      } catch (error) {
        console.error("Failed to load statistics", error);
      }
    };

    void loadDashboard();
  }, [timePeriod]);

  const screenTimeDelta = dashboard.screenTimeDeltaMinutes;
  const weeklyTrendDelta = useMemo(
    () => getTrendDelta(dashboard.weeklyTrend.map((point) => point.score)),
    [dashboard.weeklyTrend],
  );

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="mb-1 text-2xl font-bold text-white">Statistics</h1>
        <p className="text-sm text-gray-400">Your digital wellness insights</p>
      </div>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 sm:max-w-sm">
        <button
          onClick={() => setTimePeriod("week")}
          className={`h-10 flex-1 rounded-xl font-medium transition-all ${
            timePeriod === "week"
              ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] text-[#0B0B0F]"
              : "border border-white/10 bg-white/5 text-gray-400"
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setTimePeriod("month")}
          className={`h-10 flex-1 rounded-xl font-medium transition-all ${
            timePeriod === "month"
              ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] text-[#0B0B0F]"
              : "border border-white/10 bg-white/5 text-gray-400"
          }`}
        >
          Month
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="mb-1 font-semibold text-white">Screen Time</h3>
            <p className="text-xs text-gray-400">Daily breakdown</p>
          </div>
          <div className={`flex items-center gap-1 text-sm ${screenTimeDelta <= 0 ? "text-[#10D980]" : "text-[#FF9F1C]"}`}>
            <TrendingDown className="h-4 w-4" />
            <span>{screenTimeDelta}min</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dashboard.screenTimeSeries}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
            <Bar dataKey="hours" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF9F1C" />
                <stop offset="100%" stopColor="#FF6B1C" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <h3 className="mb-4 font-semibold text-white">App Category Breakdown</h3>
          <div className="flex items-center justify-between">
            <div className="h-[180px] min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                  >
                    {dashboard.categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {dashboard.categoryBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="mb-1 font-semibold text-white">Focus Consistency</h3>
              <p className="text-xs text-gray-400">Weekly trend</p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${weeklyTrendDelta >= 0 ? "text-[#10D980]" : "text-[#FF9F1C]"}`}>
              <TrendingUp className="h-4 w-4" />
              <span>{weeklyTrendDelta >= 0 ? "+" : ""}{weeklyTrendDelta}%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dashboard.weeklyTrend}>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#10D980" strokeWidth={3} dot={{ fill: "#10D980", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#FF9F1C]" />
            <h3 className="font-semibold text-white">Focus Heatmap</h3>
          </div>
          <div className="space-y-2">
            {dashboard.heatmap.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="flex gap-2">
                {week.map((value, dayIndex) => (
                  <div
                    key={`day-${dayIndex}`}
                    className="h-8 flex-1 rounded-lg"
                    style={{
                      backgroundColor:
                        value === 0
                          ? "rgba(255, 255, 255, 0.05)"
                          : value === 1
                            ? "rgba(255, 159, 28, 0.2)"
                            : value === 2
                              ? "rgba(255, 159, 28, 0.4)"
                              : value === 3
                                ? "rgba(255, 159, 28, 0.6)"
                                : "rgba(255, 159, 28, 0.8)",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="text-xs text-gray-500">
                {day}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/20 to-orange-500/10 p-5 backdrop-blur-xl"
        >
          <h3 className="mb-3 font-semibold text-white">Peak Distraction Times</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{dashboard.peakDistraction.label}</span>
              <span className="text-sm font-semibold text-red-400">{dashboard.peakDistraction.risk}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                style={{ width: `${dashboard.peakDistraction.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{dashboard.peakDistraction.summary}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
