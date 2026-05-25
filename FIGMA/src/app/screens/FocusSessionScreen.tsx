"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Sparkles, Lock, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { useFocusStore, type TimerMode } from '@/store/focus-store';

export function FocusSessionScreen() {
  const {
    sessionId,
    sessionStatus,
    mode,
    secondsLeft,
    isRunning,
    isComplete,
    isBusy,
    isHydrated,
    xp,
    streak,
    completedSessions,
    completedHours,
    weekSessions,
    blockedApps,
    hydrate,
    hydrateBlockedApps,
    setMode,
    start,
    pause,
    resume,
    end,
    tick,
  } = useFocusStore();
  const [lastCelebratedSessionId, setLastCelebratedSessionId] = useState<string | null>(null);

  useEffect(() => {
    void hydrate().catch(() => {
      toast.error('Could not load your latest focus session.');
    });
    void hydrateBlockedApps().catch(() => {
      toast.error('Could not load your blocked apps.');
    });
  }, [hydrate, hydrateBlockedApps]);

  useEffect(() => {
    if (!isHydrated || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      void tick().catch(() => {
        toast.error('Could not update the focus session.');
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHydrated, isRunning, tick]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
  }, [isRunning]);

  useEffect(() => {
    if (isComplete && sessionId && lastCelebratedSessionId !== sessionId) {
      setLastCelebratedSessionId(sessionId);
      toast.success('Session complete. XP awarded.');
    }
  }, [isComplete, lastCelebratedSessionId, sessionId]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((mode * 60 - secondsLeft) / (mode * 60)) * 100;
  const projectedXpReward = mode === 50 ? 180 : 90;

  const handleStart = async () => {
    try {
      await start();
      setLastCelebratedSessionId(null);
      toast.info('Focus mode is active. Distracting apps are simulated as blocked.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start the focus session.');
    }
  };

  const handlePause = async () => {
    try {
      await pause();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not pause the focus session.');
    }
  };

  const handleResume = async () => {
    try {
      await resume();
      toast.info('Focus session resumed.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resume the focus session.');
    }
  };

  const handleStop = async () => {
    try {
      await end();
      setLastCelebratedSessionId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not end the focus session.');
    }
  };

  const activeBlockedApps = blockedApps.filter((app) => app.blocked);
  const hasPausedSession = sessionStatus === 'paused';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:hidden">
        <h1 className="text-2xl font-bold text-white mb-1">Focus Session</h1>
        <p className="text-gray-400 text-sm">Stay focused, earn rewards</p>
      </div>

      {/* Timer Circle */}
      <div className="grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md">
        {[25, 50].map((duration) => (
          <button
            key={duration}
            onClick={() => setMode(duration as TimerMode)}
            disabled={isRunning || isBusy}
            className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-all ${
              mode === duration
                ? 'border-[#FF9F1C]/50 bg-[#FF9F1C]/20 text-[#FF9F1C]'
                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <TimerReset className="h-4 w-4" />
            {duration} min
          </button>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center"
      >
        <div className="relative w-72 h-72">
          {/* Background Circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="130"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              fill="none"
            />
            <motion.circle
              cx="144"
              cy="144"
              r="130"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={816.8}
              strokeDashoffset={816.8 - (816.8 * progress) / 100}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF9F1C" />
                <stop offset="100%" stopColor="#10D980" />
              </linearGradient>
            </defs>
          </svg>

          {/* Glow Effect */}
          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,159,28,0.3) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-6xl font-bold text-white mb-2">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </h2>
            <p className="text-gray-400 text-sm mb-4">Pomodoro Timer</p>

            {/* XP Counter */}
            {isRunning && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#10D980]/20 border border-[#10D980]/30"
              >
                <Sparkles className="w-4 h-4 text-[#10D980]" />
                <span className="text-[#10D980] text-sm font-semibold">
                  +{projectedXpReward} XP
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRunning && !hasPausedSession ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={isBusy}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C] flex items-center justify-center shadow-lg shadow-[#FF9F1C]/30"
          >
            <Play className="w-8 h-8 text-[#0B0B0F]" fill="#0B0B0F" />
          </motion.button>
        ) : hasPausedSession ? (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleResume}
              disabled={isBusy}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C] flex items-center justify-center shadow-lg shadow-[#FF9F1C]/30"
            >
              <Play className="w-8 h-8 text-[#0B0B0F]" fill="#0B0B0F" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              disabled={isBusy}
              className="w-16 h-16 rounded-2xl bg-red-500/20 backdrop-blur-xl border border-red-500/30 flex items-center justify-center"
            >
              <Square className="w-8 h-8 text-red-400" />
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePause}
              disabled={isBusy}
              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
            >
              <Pause className="w-8 h-8 text-white" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              disabled={isBusy}
              className="w-16 h-16 rounded-2xl bg-red-500/20 backdrop-blur-xl border border-red-500/30 flex items-center justify-center"
            >
              <Square className="w-8 h-8 text-red-400" />
            </motion.button>
          </>
        )}
      </div>

      {/* Blocked Apps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-[#FF9F1C]" />
          <h3 className="text-white font-semibold">
            {isRunning ? 'Blocked During Session' : 'Will Be Blocked'}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeBlockedApps.map((app) => (
            <div
              key={app.id}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                isRunning
                  ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                  : 'bg-white/5 border border-white/10 text-gray-400'
              }`}
            >
              {app.name}
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-4 bottom-24 z-50 rounded-2xl border border-[#FF9F1C]/40 bg-[#0B0B0F]/95 p-4 shadow-2xl shadow-[#FF9F1C]/20 backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF9F1C]/20">
                <Lock className="h-5 w-5 text-[#FF9F1C]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Blocked During Focus Session</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  {activeBlockedApps.map((app) => app.name).join(', ')} are unavailable until this session ends.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <p className="text-gray-400 text-xs mb-1">Sessions</p>
          <h4 className="text-xl font-bold text-white">{completedSessions}</h4>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <p className="text-gray-400 text-xs mb-1">Hours</p>
          <h4 className="text-xl font-bold text-white">{completedHours}</h4>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <p className="text-gray-400 text-xs mb-1">This Week</p>
          <h4 className="text-xl font-bold text-white">{weekSessions}</h4>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <p className="text-gray-400 text-xs mb-1">XP</p>
          <h4 className="text-xl font-bold text-white">{xp}</h4>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
          <p className="text-gray-400 text-xs mb-1">Streak</p>
          <h4 className="text-xl font-bold text-white">{streak}</h4>
        </div>
      </div>
    </div>
  );
}
