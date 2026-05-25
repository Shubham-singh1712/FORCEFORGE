"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BlockedAppCategory, FocusSessionStatus } from "@/types/database";

export type TimerMode = 25 | 50;

export interface BlockedApp {
  id: string;
  name: string;
  category: BlockedAppCategory;
  timeToday: string;
  blocked: boolean;
}

interface FocusState {
  sessionId: string | null;
  sessionStatus: "idle" | FocusSessionStatus;
  mode: TimerMode;
  secondsLeft: number;
  isRunning: boolean;
  isComplete: boolean;
  isBusy: boolean;
  isHydrated: boolean;
  isBlockedAppsHydrated: boolean;
  xp: number;
  streak: number;
  completedSessions: number;
  completedHours: number;
  weekSessions: number;
  blockedApps: BlockedApp[];
  hydrate: () => Promise<void>;
  hydrateBlockedApps: () => Promise<void>;
  setMode: (mode: TimerMode) => void;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  end: () => Promise<void>;
  tick: () => Promise<void>;
  completeSession: () => Promise<void>;
  toggleBlockedApp: (id: string) => Promise<void>;
  addBlockedApp: (name: string, category?: BlockedApp["category"]) => Promise<void>;
  removeBlockedApp: (id: string) => Promise<void>;
  blockByCategory: (category: BlockedApp["category"]) => Promise<void>;
  enableWorkMode: () => Promise<void>;
}

type FocusSessionApiResponse = {
  currentSession: {
    id: string;
    durationMinutes: number;
    completedSeconds: number;
    secondsLeft: number;
    status: FocusSessionStatus;
    xpAwarded: number;
  } | null;
  xp: number;
  streak: number;
  completedSessions: number;
  completedHours: number;
  weekSessions: number;
};

type BlockedAppsApiResponse = {
  blockedApps: BlockedApp[];
};

async function requestFocusState(
  method: "GET" | "POST" | "PATCH",
  body?: Record<string, string | number>,
) {
  const response = await fetch("/api/focus-sessions", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as FocusSessionApiResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Focus session request failed.");
  }

  return data;
}

async function requestBlockedApps(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, string | boolean>,
) {
  const query =
    method === "DELETE" && body?.appId
      ? `?appId=${encodeURIComponent(String(body.appId))}`
      : "";

  const response = await fetch(`/api/blocked-apps${query}`, {
    method,
    headers: method !== "GET" && method !== "DELETE" ? { "Content-Type": "application/json" } : undefined,
    body:
      method !== "GET" && method !== "DELETE" && body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as BlockedAppsApiResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Blocked apps request failed.");
  }

  return data;
}

function applyServerState(
  state: FocusState,
  payload: FocusSessionApiResponse,
): Partial<FocusState> {
  const currentSession = payload.currentSession;
  const nextMode = currentSession
    ? ((currentSession.durationMinutes === 50 ? 50 : 25) as TimerMode)
    : state.mode;

  return {
    sessionId: currentSession?.id ?? null,
    sessionStatus: currentSession?.status ?? "idle",
    mode: nextMode,
    secondsLeft: currentSession?.secondsLeft ?? nextMode * 60,
    isRunning: currentSession?.status === "active",
    isComplete: currentSession?.status === "completed" ? true : false,
    xp: payload.xp,
    streak: payload.streak,
    completedSessions: payload.completedSessions,
    completedHours: payload.completedHours,
    weekSessions: payload.weekSessions,
    isHydrated: true,
  };
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      sessionStatus: "idle",
      mode: 25,
      secondsLeft: 25 * 60,
      isRunning: false,
      isComplete: false,
      isBusy: false,
      isHydrated: false,
      isBlockedAppsHydrated: false,
      xp: 0,
      streak: 0,
      completedSessions: 0,
      completedHours: 0,
      weekSessions: 0,
      blockedApps: [],
      hydrate: async () => {
        set({ isBusy: true });

        try {
          const payload = await requestFocusState("GET");
          set((state) => ({
            ...applyServerState(state, payload),
            isBusy: false,
          }));
        } catch (error) {
          console.error("Failed to hydrate focus state", error);
          set({ isBusy: false, isHydrated: true });
          throw error;
        }
      },
      hydrateBlockedApps: async () => {
        set({ isBusy: true });

        try {
          const payload = await requestBlockedApps("GET");
          set({
            blockedApps: payload.blockedApps,
            isBlockedAppsHydrated: true,
            isBusy: false,
          });
        } catch (error) {
          console.error("Failed to hydrate blocked apps", error);
          set({ isBusy: false, isBlockedAppsHydrated: true });
          throw error;
        }
      },
      setMode: (mode) =>
        set({
          mode,
          secondsLeft: mode * 60,
          isComplete: false,
        }),
      start: async () => {
        set({ isBusy: true, isComplete: false });

        try {
          const payload = await requestFocusState("POST", {
            durationMinutes: get().mode,
          });
          set((state) => ({
            ...applyServerState(state, payload),
            isBusy: false,
          }));
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      pause: async () => {
        const { sessionId } = get();

        if (!sessionId) {
          return;
        }

        set({ isBusy: true });

        try {
          const payload = await requestFocusState("PATCH", {
            sessionId,
            action: "pause",
          });
          set((state) => ({
            ...applyServerState(state, payload),
            isBusy: false,
          }));
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      resume: async () => {
        const { sessionId } = get();

        if (!sessionId) {
          return;
        }

        set({ isBusy: true });

        try {
          const payload = await requestFocusState("PATCH", {
            sessionId,
            action: "resume",
          });
          set((state) => ({
            ...applyServerState(state, payload),
            isBusy: false,
          }));
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      end: async () => {
        const { sessionId, mode } = get();

        if (!sessionId) {
          set({
            sessionStatus: "idle",
            isRunning: false,
            isComplete: false,
            secondsLeft: mode * 60,
          });
          return;
        }

        set({ isBusy: true });

        try {
          const payload = await requestFocusState("PATCH", {
            sessionId,
            action: "end",
          });
          set((state) => ({
            ...applyServerState(state, payload),
            isBusy: false,
            isComplete: false,
          }));
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      tick: async () => {
        const { secondsLeft } = get();
        if (secondsLeft <= 1) {
          await get().completeSession();
          return;
        }
        set({ secondsLeft: secondsLeft - 1 });
      },
      completeSession: async () => {
        const { sessionId } = get();

        if (!sessionId) {
          return;
        }

        set({ isBusy: true });

        try {
          const payload = await requestFocusState("PATCH", {
            sessionId,
            action: "complete",
          });
          set((state) => ({
            ...applyServerState(state, payload),
            isBusy: false,
            isComplete: true,
            sessionStatus: "completed",
            secondsLeft: 0,
          }));
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      toggleBlockedApp: async (id) => {
        set({ isBusy: true });

        try {
          const payload = await requestBlockedApps("PATCH", {
            action: "toggle",
            appId: id,
          });
          set({
            blockedApps: payload.blockedApps,
            isBusy: false,
            isBlockedAppsHydrated: true,
          });
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      addBlockedApp: async (name, category = "other") => {
        set({ isBusy: true });

        try {
          const payload = await requestBlockedApps("POST", { name, category });
          set({
            blockedApps: payload.blockedApps,
            isBusy: false,
            isBlockedAppsHydrated: true,
          });
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      removeBlockedApp: async (id) => {
        set({ isBusy: true });

        try {
          const payload = await requestBlockedApps("DELETE", { appId: id });
          set({
            blockedApps: payload.blockedApps,
            isBusy: false,
            isBlockedAppsHydrated: true,
          });
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      blockByCategory: async (category) => {
        set({ isBusy: true });

        try {
          const payload = await requestBlockedApps("PATCH", {
            action: "set-category",
            category,
            blocked: true,
          });
          set({
            blockedApps: payload.blockedApps,
            isBusy: false,
            isBlockedAppsHydrated: true,
          });
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
      enableWorkMode: async () => {
        set({ isBusy: true });

        try {
          const payload = await requestBlockedApps("PATCH", {
            action: "work-mode",
          });
          set({
            blockedApps: payload.blockedApps,
            isBusy: false,
            isBlockedAppsHydrated: true,
          });
        } catch (error) {
          set({ isBusy: false });
          throw error;
        }
      },
    }),
    {
      name: "focusforge-state",
      partialize: (state) => ({
        mode: state.mode,
      }),
    },
  ),
);
