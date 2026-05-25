"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, TrendingUp, Clock, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type InsightCard = {
  id: string;
  icon: "clock" | "trend" | "calendar";
  title: string;
  message: string;
  actionLabel: string;
  color: string;
};

type Recommendation = {
  id: string;
  text: string;
  impact: string;
};

type CoachPayload = {
  insights: InsightCard[];
  recommendations: Recommendation[];
  productivityTrend: {
    change: number;
    progress: number;
  };
  defaultPrompt: string;
};

const EMPTY_COACH_PAYLOAD: CoachPayload = {
  insights: [],
  recommendations: [],
  productivityTrend: {
    change: 0,
    progress: 0,
  },
  defaultPrompt: "",
};

function getInsightIcon(icon: InsightCard["icon"]) {
  if (icon === "clock") {
    return Clock;
  }

  if (icon === "trend") {
    return TrendingUp;
  }

  return Calendar;
}

export function AICoachScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [coachReply, setCoachReply] = useState("");
  const [coachData, setCoachData] = useState<CoachPayload>(EMPTY_COACH_PAYLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const loadCoach = async () => {
      try {
        const response = await fetch("/api/ai-coach", { cache: "no-store" });
        const data = (await response.json()) as CoachPayload & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load AI coach.");
        }

        setCoachData(data);
        setPrompt(data.defaultPrompt);
      } catch (error) {
        console.error("Failed to load AI coach", error);
        toast.error("Could not load AI coach context");
      } finally {
        setIsHydrating(false);
      }
    };

    void loadCoach();
  }, []);

  const askCoach = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await response.json()) as { insight?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate AI insight.");
      }

      setCoachReply(data.insight ?? "No insight returned.");
      toast.success("AI coach updated your plan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reach AI coach");
    } finally {
      setIsLoading(false);
    }
  };

  const runInsightAction = (label: string) => {
    if (label.includes("Schedule")) {
      router.push("/app/focus");
      toast.success("Opening Focus Session");
      return;
    }

    if (label.includes("Goal")) {
      toast.success("Loaded your best productivity window into the coach context");
      return;
    }

    router.push("/app/blocking");
    toast.success("Opening app blocking settings");
  };

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Coach</h1>
            <p className="text-sm text-gray-400">Personalized insights</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm uppercase tracking-wide text-gray-400">Smart Insights</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coachData.insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.icon);

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${insight.color}`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-white">{insight.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-300">{insight.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => runInsightAction(insight.actionLabel)}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${insight.color} font-medium text-white transition-shadow hover:shadow-lg`}
                >
                  {insight.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
        {!isHydrating && coachData.insights.length === 0 && (
          <p className="text-sm text-gray-400">No coach insights are available yet. Complete a focus session to generate patterns.</p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-purple-500/10 p-5 backdrop-blur-xl"
      >
        <h3 className="mb-3 font-semibold text-white">Productivity Trends</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Focus Score (7 days)</span>
            <span className="text-sm font-semibold text-[#10D980]">
              {coachData.productivityTrend.change >= 0 ? "+" : ""}
              {coachData.productivityTrend.change}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coachData.productivityTrend.progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>This Week</span>
          </div>
        </div>
      </motion.div>

      <div>
        <h2 className="mb-4 text-sm uppercase tracking-wide text-gray-400">Quick Wins</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coachData.recommendations.map((rec, index) => (
            <motion.button
              key={rec.id}
              onClick={() => {
                setPrompt(rec.text);
                toast.success("Recommendation loaded into coach prompt");
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#FF9F1C]/30 bg-[#FF9F1C]/20">
                  <span className="text-xs text-[#FF9F1C]">+</span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-white">{rec.text}</p>
                  <p className="text-xs text-gray-400">{rec.impact}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-white" />
            </motion.button>
          ))}
        </div>
      </div>

      {coachReply && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#10D980]/30 bg-[#10D980]/10 p-5"
        >
          <h3 className="mb-2 font-semibold text-white">Personalized Coach Response</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{coachReply}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
      >
        <form onSubmit={askCoach} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask AI Coach anything..."
            className="min-h-11 flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] px-5 py-2 text-sm font-semibold text-[#0B0B0F] disabled:opacity-60"
          >
            {isLoading ? "Thinking..." : "Ask"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
