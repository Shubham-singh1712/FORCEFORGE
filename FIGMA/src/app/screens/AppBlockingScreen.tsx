"use client";

import { motion } from "framer-motion";
import { Clock, Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useFocusStore, type BlockedApp } from "@/store/focus-store";

export function AppBlockingScreen() {
  const apps = useFocusStore((state) => state.blockedApps);
  const isBusy = useFocusStore((state) => state.isBusy);
  const isBlockedAppsHydrated = useFocusStore((state) => state.isBlockedAppsHydrated);
  const hydrateBlockedApps = useFocusStore((state) => state.hydrateBlockedApps);
  const toggleBlockedApp = useFocusStore((state) => state.toggleBlockedApp);
  const addBlockedApp = useFocusStore((state) => state.addBlockedApp);
  const removeBlockedApp = useFocusStore((state) => state.removeBlockedApp);
  const blockByCategory = useFocusStore((state) => state.blockByCategory);
  const enableWorkMode = useFocusStore((state) => state.enableWorkMode);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppCategory, setNewAppCategory] = useState<BlockedApp["category"]>("social");
  const blockedCount = apps.filter((app) => app.blocked).length;

  useEffect(() => {
    if (isBlockedAppsHydrated) {
      return;
    }

    void hydrateBlockedApps().catch(() => {
      toast.error("Could not load your blocked apps.");
    });
  }, [hydrateBlockedApps, isBlockedAppsHydrated]);

  const toggleBlock = async (id: string) => {
    try {
      await toggleBlockedApp(id);
      toast.success("Blocked apps saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update blocked apps.");
    }
  };

  const handleAddApp = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = newAppName.trim();

    if (!cleanName) {
      toast.error("Enter an app name first");
      return;
    }

    try {
      await addBlockedApp(cleanName, newAppCategory);
      setNewAppName("");
      setShowAddApp(false);
      toast.success(`${cleanName} added to focus blocking`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the blocked app.");
    }
  };

  const handleRemoveApp = async (id: string, name: string) => {
    try {
      await removeBlockedApp(id);
      toast.success(`${name} removed from focus blocking`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the blocked app.");
    }
  };

  const handleBlockAll = async () => {
    try {
      await blockByCategory("social");
      await blockByCategory("video");
      await blockByCategory("forum");
      toast.success("All major distraction categories are blocked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update focus blocking.");
    }
  };

  const handleWorkMode = async () => {
    try {
      await enableWorkMode();
      toast.success("Work Mode enabled. Chat stays available, high-distraction apps are blocked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable Work Mode.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="mb-1 text-2xl font-bold text-white">App Blocking</h1>
        <p className="text-sm text-gray-400">Control your digital environment</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#FF9F1C]/30 bg-gradient-to-br from-[#FF9F1C]/20 to-[#FF6B1C]/10 p-5 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C]">
              <Shield className="h-6 w-6 text-[#0B0B0F]" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Focus Mode</h3>
              <p className="text-xs text-gray-400">{blockedCount} apps blocked</p>
            </div>
          </div>
          <button
            onClick={() => setShowSchedule((current) => !current)}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition-colors hover:bg-white/20"
          >
            Schedule
          </button>
        </div>
      </motion.div>

      {showSchedule && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Blocking Schedule</h3>
              <p className="text-xs text-gray-400">MVP simulation applied during focus sessions.</p>
            </div>
            <button onClick={() => setShowSchedule(false)} aria-label="Close schedule">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["9:00-11:00 AM", "2:00-4:00 PM", "7:00-9:00 PM"].map((slot) => (
              <button
                key={slot}
                onClick={() => toast.success(`${slot} saved as a focus block`)}
                className="rounded-xl border border-[#FF9F1C]/30 bg-[#FF9F1C]/10 px-3 py-3 text-left text-sm text-white hover:bg-[#FF9F1C]/15"
              >
                {slot}
                <span className="mt-1 block text-xs text-gray-400">Tap to save</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C] text-lg font-bold text-[#0B0B0F] shadow-lg">
                {app.name.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h4 className="mb-1 truncate font-semibold text-white">{app.name}</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{app.timeToday} today</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleBlock(app.id)}
              disabled={isBusy}
              aria-pressed={app.blocked}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                app.blocked ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C]" : "bg-white/10"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <motion.div
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg ${
                  app.blocked ? "left-7" : "left-1"
                }`}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>

            <button
              onClick={() => void handleRemoveApp(app.id, app.name)}
              disabled={isBusy}
              aria-label={`Remove ${app.name}`}
              className="ml-3 rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => setShowAddApp((current) => !current)}
        disabled={isBusy}
        className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 font-medium text-white backdrop-blur-xl transition-colors hover:bg-white/10"
      >
        <Plus className="mr-2 inline h-4 w-4" />
        Add More Apps
      </motion.button>

      {showAddApp && (
        <form
          onSubmit={handleAddApp}
          className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:grid-cols-[1fr_180px_auto]"
        >
          <input
            value={newAppName}
            onChange={(event) => setNewAppName(event.target.value)}
            placeholder="App or website name"
            className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#FF9F1C]"
          />
          <select
            value={newAppCategory}
            onChange={(event) => setNewAppCategory(event.target.value as BlockedApp["category"])}
            className="h-11 rounded-xl border border-white/10 bg-[#11111d] px-4 text-sm text-white outline-none focus:border-[#FF9F1C]"
          >
            <option value="social">Social</option>
            <option value="video">Video</option>
            <option value="chat">Chat</option>
            <option value="forum">Forum</option>
            <option value="other">Other</option>
          </select>
          <button className="h-11 rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] px-5 text-sm font-semibold text-[#0B0B0F]">
            Add
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => void handleBlockAll()}
          disabled={isBusy}
          className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/20 to-red-600/10 p-4 text-left"
        >
          <h4 className="mb-1 text-sm font-semibold text-white">Block All</h4>
          <p className="text-xs text-gray-400">Social Media</p>
        </button>
        <button
          onClick={() => void handleWorkMode()}
          disabled={isBusy}
          className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 text-left"
        >
          <h4 className="mb-1 text-sm font-semibold text-white">Work Mode</h4>
          <p className="text-xs text-gray-400">Unblock Productive</p>
        </button>
      </div>
    </div>
  );
}
