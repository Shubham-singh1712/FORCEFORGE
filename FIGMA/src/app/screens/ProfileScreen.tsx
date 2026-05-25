"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  Moon,
  Palette,
  Save,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useThemeStore } from "@/store/theme-store";
import { createClient } from "@/lib/supabase/client";
import type { ProfilePayload } from "@/lib/data/profile";

interface SettingItem {
  icon: LucideIcon;
  label: string;
  value?: string | boolean;
  displayValue?: string;
  toggle?: boolean;
  path?: string;
  action?: string;
  onChange?: (value: boolean) => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export function ProfileScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState("4h focus time");
  const [focusHours, setFocusHours] = useState("9-11 AM, 2-4 PM");
  const [profileName, setProfileName] = useState("FocusForge User");
  const [profileEmail, setProfileEmail] = useState("");
  const [dndEnabled, setDndEnabled] = useState(true);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const data = (await response.json()) as ProfilePayload & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load profile.");
        }

        setProfile(data);
        setProfileName(data.name);
        setProfileEmail(data.email);
      } catch (error) {
        console.error("Failed to load profile", error);
        toast.error("Could not load your real profile data.");
      }
    };

    void loadProfile();
  }, []);

  const settingsSections: SettingSection[] = [
    {
      title: "Goals & Preferences",
      items: [
        { icon: Target, label: "Daily Goals", value: dailyGoal, action: "goals" },
        { icon: Clock, label: "Focus Hours", value: focusHours, action: "focus-hours" },
        { icon: Moon, label: "Do Not Disturb", value: dndEnabled ? "Enabled" : "Disabled", action: "dnd" },
      ],
    },
    {
      title: "App Settings",
      items: [
        { icon: Bell, label: "Notifications", toggle: true, value: notifications, onChange: setNotifications },
        { icon: Palette, label: "Theme", toggle: true, value: theme === "dark", displayValue: theme === "dark" ? "Dark" : "Light", action: "theme" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", action: "profile" },
        { icon: Shield, label: "Privacy & Security", action: "privacy" },
        { icon: FileText, label: "Weekly Report", path: "/app/weekly-report" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", action: "help" },
        { icon: Mail, label: "Contact Support", action: "support" },
      ],
    },
  ];

  const openSetting = (item: SettingItem) => {
    if (item.toggle) {
      if (item.action === "theme") {
        toggleTheme();
        toast.success(`Theme changed to ${theme === "dark" ? "Light" : "Dark"}`);
        return;
      }

      item.onChange?.(!item.value);
      toast.success(`${item.label} ${item.value ? "disabled" : "enabled"}`);
      return;
    }

    if (item.path) {
      router.push(item.path);
      return;
    }

    if (item.action) {
      setActivePanel(item.action);
    }
  };

  const savePanel = async () => {
    if (activePanel === "dnd") {
      setDndEnabled((current) => !current);
      toast.success("Profile settings saved");
      setActivePanel(null);
      return;
    }

    if (activePanel === "profile") {
      setIsSavingProfile(true);

      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profileName,
            email: profileEmail,
          }),
        });
        const data = (await response.json()) as ProfilePayload & { error?: string };

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Could not save your profile. If you changed the email, Supabase may require email confirmation.",
          );
        }

        setProfile(data);
        setProfileName(data.name);
        setProfileEmail(data.email);
        toast.success("Profile settings saved");
        setActivePanel(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save profile.");
      } finally {
        setIsSavingProfile(false);
      }

      return;
    }

    toast.success("Profile settings saved");
    setActivePanel(null);
  };

  const handleSignOut = async () => {
    const supabase = createClient();

    if (!supabase) {
      toast.error("Supabase auth is not configured. Unable to sign out cleanly.");
      router.replace("/login");
      return;
    }

    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "logout",
          metadata: { source: "profile_screen" },
        }),
      });
    } catch (activityError) {
      console.error("Failed to record logout activity", activityError);
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed out");
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="mb-1 text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm text-gray-400">Manage your account</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-[#FF9F1C]/30 bg-gradient-to-br from-[#FF9F1C]/20 to-[#FF6B1C]/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#FF9F1C]/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-2xl font-bold text-white">
            {profile?.initials ?? "FF"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mb-1 truncate text-xl font-bold text-white">{profileName}</h2>
            <p className="mb-2 truncate text-sm text-gray-400">{profileEmail}</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-xl">
                <span className="text-xs font-semibold text-[#FF9F1C]">Level {profile?.level ?? 1}</span>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-xl">
                <span className="text-xs font-semibold text-[#10D980]">{profile?.xp ?? 0} XP</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Total Hours", `${profile?.totalHours ?? 0}`],
          ["Streak", `${profile?.streak ?? 0}`],
          ["Sessions", `${profile?.completedSessions ?? 0}`],
        ].map(([label, value], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl"
          >
            <p className="mb-1 text-xs text-gray-400">{label}</p>
            <h3 className="text-xl font-bold text-white">{value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + sectionIndex * 0.05 }}
          >
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => openSetting(item)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                        <Icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-medium text-white">{item.label}</p>
                        {item.value && !item.toggle && (
                          <p className="truncate text-xs text-gray-400">{item.value}</p>
                        )}
                        {item.toggle && item.displayValue && (
                          <p className="text-xs text-gray-400">{item.displayValue}</p>
                        )}
                      </div>
                    </div>
                    {item.toggle ? (
                      <span
                        role="switch"
                        aria-checked={Boolean(item.value)}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (item.action === "theme") {
                            toggleTheme();
                            toast.success(`Theme changed to ${theme === "dark" ? "Light" : "Dark"}`);
                            return;
                          }

                          item.onChange?.(!item.value);
                          toast.success(`${item.label} ${item.value ? "disabled" : "enabled"}`);
                        }}
                        className={`relative h-7 w-12 rounded-full transition-colors ${
                          item.value ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C]" : "bg-white/10"
                        }`}
                      >
                        <motion.span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg ${
                            item.value ? "left-6" : "left-1"
                          }`}
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </span>
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {activePanel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-popover p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">{panelTitle(activePanel)}</h3>
              <button onClick={() => setActivePanel(null)} aria-label="Close settings panel">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

          {activePanel === "goals" && (
            <TextInput label="Daily focus goal" value={dailyGoal} onChange={setDailyGoal} />
          )}

          {activePanel === "focus-hours" && (
            <TextInput label="Preferred focus windows" value={focusHours} onChange={setFocusHours} />
          )}

          {activePanel === "dnd" && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white">Do Not Disturb is {dndEnabled ? "enabled" : "disabled"}.</p>
              <p className="mt-1 text-xs text-gray-400">Saving will toggle this setting for future focus sessions.</p>
            </div>
          )}

          {activePanel === "profile" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Name" value={profileName} onChange={setProfileName} />
              <TextInput label="Email" value={profileEmail} onChange={setProfileEmail} />
            </div>
          )}

          {activePanel === "privacy" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {["Export data", "Delete usage logs", "Revoke sessions"].map((action) => (
                <button
                  key={action}
                  onClick={() => toast.success(`${action} request queued`)}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {activePanel === "help" && (
            <div className="space-y-3 text-sm text-gray-300">
              <p>Start a focus session, keep distracting apps blocked, and earn XP when the timer completes.</p>
              <p>Analytics, AI coaching, and reports now pull from your Supabase data once your account has activity.</p>
            </div>
          )}

          {activePanel === "support" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                toast.success("Support message sent");
                setActivePanel(null);
              }}
              className="space-y-3"
            >
              <textarea
                placeholder="Tell the FocusForge team what you need..."
                className="min-h-28 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none focus:border-[#FF9F1C]"
              />
              <button className="rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] px-5 py-2 text-sm font-semibold text-[#0B0B0F]">
                Send Message
              </button>
            </form>
          )}

          {!["help", "support", "privacy"].includes(activePanel) && (
            <button
              onClick={() => void savePanel()}
              disabled={isSavingProfile}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] px-5 py-2 text-sm font-semibold text-[#0B0B0F] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSavingProfile ? "Saving..." : "Save"}
            </button>
          )}
          </motion.div>
        </div>
      )}

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={handleSignOut}
        className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 font-semibold text-red-400 transition-colors hover:bg-red-500/20 active:scale-95"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </motion.button>

      <p className="mt-6 text-center text-xs text-gray-500">FocusForge AI v1.0.0</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-gray-400">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-[#FF9F1C]"
      />
    </label>
  );
}

function panelTitle(panel: string) {
  const titles: Record<string, string> = {
    goals: "Daily Goals",
    "focus-hours": "Focus Hours",
    dnd: "Do Not Disturb",
    profile: "Edit Profile",
    privacy: "Privacy & Security",
    help: "Help Center",
    support: "Contact Support",
  };

  return titles[panel] ?? "Settings";
}
