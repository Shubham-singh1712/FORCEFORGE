"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Target,
  AlertCircle,
  Sparkles,
  Download,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import type { WeeklyReportPayload } from "@/types/weekly-report";

const EMPTY_REPORT: WeeklyReportPayload = {
  weekLabel: "This Week",
  totalFocusHours: 0,
  sessionsCompleted: 0,
  xpEarned: 0,
  avgFocusScore: 0,
  focusScoreDelta: 0,
  goalsCompleted: 0,
  goalCompletionRate: 0,
  improvement: 0,
  streakGrowth: 0,
  distractionRatio: 0,
  distractionRatioDelta: 0,
  mostUsedApps: [],
  dailyFocus: [
    { day: "Mon", hours: 0 },
    { day: "Tue", hours: 0 },
    { day: "Wed", hours: 0 },
    { day: "Thu", hours: 0 },
    { day: "Fri", hours: 0 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ],
  aiSummary: "Complete a few sessions and track usage to generate your first weekly report.",
};

export function WeeklyReportScreen() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReportPayload>(EMPTY_REPORT);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await fetch("/api/weekly-report", { cache: "no-store" });
        const data = (await response.json()) as WeeklyReportPayload & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load weekly report.");
        }

        setReport(data);
      } catch (error) {
        console.error("Failed to load weekly report", error);
        toast.error("Could not load weekly report");
      }
    };

    void loadReport();
  }, []);

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "focusforge-weekly-report.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Weekly report downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push("/app")}
          className="mb-3 flex items-center gap-1 text-sm text-gray-400"
        >
          Back to Home
        </button>
        <h1 className="mb-1 text-2xl font-bold text-white">Weekly Report</h1>
        <p className="text-sm text-gray-400">{report.weekLabel}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-[#FF9F1C]/30 bg-gradient-to-br from-[#FF9F1C]/20 to-[#10D980]/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#10D980]/10 blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#10D980]" />
            <h2 className="text-lg font-semibold text-white">Great Progress!</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">
            You improved focus by <span className="font-semibold text-[#10D980]">{report.improvement}%</span> this week
            and earned <span className="font-semibold text-[#10D980]">{report.xpEarned} XP</span>. Keep protecting your
            best focus windows.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <Clock className="mb-3 h-6 w-6 text-[#FF9F1C]" />
          <p className="mb-1 text-xs text-gray-400">Total Focus Hours</p>
          <h3 className="mb-1 text-3xl font-bold text-white">{report.totalFocusHours}h</h3>
          <div className="flex items-center gap-1 text-xs text-[#10D980]">
            <TrendingUp className="h-3 w-3" />
            <span>{report.improvement}% from last week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <Zap className="mb-3 h-6 w-6 text-[#10D980]" />
          <p className="mb-1 text-xs text-gray-400">Avg Focus Score</p>
          <h3 className="mb-1 text-3xl font-bold text-white">{report.avgFocusScore}</h3>
          <div className="flex items-center gap-1 text-xs text-[#10D980]">
            <TrendingUp className="h-3 w-3" />
            <span>{report.focusScoreDelta >= 0 ? "+" : ""}{report.focusScoreDelta} points</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <Target className="mb-3 h-6 w-6 text-[#8B5CF6]" />
          <p className="mb-1 text-xs text-gray-400">Goals Completed</p>
          <h3 className="mb-1 text-3xl font-bold text-white">{report.goalsCompleted}/7</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>{report.goalCompletionRate}% completion rate</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <AlertCircle className="mb-3 h-6 w-6 text-[#FF9F1C]" />
          <p className="mb-1 text-xs text-gray-400">Streak Growth</p>
          <h3 className="mb-1 text-3xl font-bold text-white">+{report.streakGrowth}</h3>
          <div className="flex items-center gap-1 text-xs text-[#10D980]">
            <TrendingUp className="h-3 w-3" />
            <span>days added this week</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <h3 className="mb-4 font-semibold text-white">Daily Focus Hours</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={report.dailyFocus}>
            <Bar dataKey="hours" fill="url(#weeklyGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10D980" />
                <stop offset="100%" stopColor="#06B55E" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-between">
          {report.dailyFocus.map((item) => (
            <span key={item.day} className="text-xs text-gray-500">
              {item.day}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <h3 className="mb-4 font-semibold text-white">Most Used Apps</h3>
        <div className="space-y-3">
          {report.mostUsedApps.length > 0 ? (
            report.mostUsedApps.map((app) => (
              <div key={app.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-semibold text-white">
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{app.name}</p>
                    <p className="text-xs text-gray-400">{app.time} this week</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${app.change <= 0 ? "text-[#10D980]" : "text-red-400"}`}>
                  {app.change <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  <span>{Math.abs(app.change)}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No app usage was logged this week.</p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-red-500/10 p-5 backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[#FF9F1C]" />
          <h3 className="font-semibold text-white">Distraction Ratio</h3>
        </div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h4 className="text-4xl font-bold text-white">{report.distractionRatio}</h4>
            <p className="text-xs text-gray-400">percent of tracked usage</p>
          </div>
          <div className={`flex items-center gap-1 text-sm ${report.distractionRatioDelta <= 0 ? "text-[#10D980]" : "text-red-400"}`}>
            {report.distractionRatioDelta <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            <span>{Math.abs(report.distractionRatioDelta)} from last week</span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#10D980] to-[#06B55E]"
            style={{ width: `${report.distractionRatio}%` }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-blue-500/10 p-5 backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">AI Weekly Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-300">{report.aiSummary}</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={downloadReport}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] font-semibold text-[#0B0B0F] shadow-lg shadow-[#FF9F1C]/30 transition-all hover:shadow-xl hover:shadow-[#FF9F1C]/40 active:scale-95"
      >
        <Download className="h-5 w-5" />
        Download Full Report
      </motion.button>
    </div>
  );
}
