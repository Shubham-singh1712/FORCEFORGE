import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockedAppCategory, Database } from "@/types/database";
import { insertActivityLog } from "@/lib/data/activity-logs";

type AppSupabaseClient = SupabaseClient<Database>;
type BlockedAppRow = Database["public"]["Tables"]["blocked_apps"]["Row"];

export type BlockedAppPayload = {
  id: string;
  name: string;
  category: BlockedAppCategory;
  blocked: boolean;
  timeToday: string;
};

const DEFAULT_BLOCKED_APPS: Array<{
  name: string;
  category: BlockedAppCategory;
  blocked: boolean;
}> = [
  { name: "Instagram", category: "social", blocked: true },
  { name: "YouTube", category: "video", blocked: true },
  { name: "X / Twitter", category: "social", blocked: false },
  { name: "TikTok", category: "video", blocked: true },
  { name: "WhatsApp", category: "chat", blocked: false },
  { name: "Reddit", category: "forum", blocked: false },
];

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`;
}

async function ensureDefaultBlockedApps(supabase: AppSupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("blocked_apps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error: insertError } = await supabase.from("blocked_apps").insert(
    DEFAULT_BLOCKED_APPS.map((app) => ({
      user_id: userId,
      app_name: app.name,
      category: app.category,
      is_blocked: app.blocked,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

function mapBlockedApps(
  blockedApps: BlockedAppRow[],
  usageTotals: Map<string, number>,
): BlockedAppPayload[] {
  return blockedApps.map((app) => ({
    id: app.id,
    name: app.app_name,
    category: app.category,
    blocked: app.is_blocked,
    timeToday: formatHours(usageTotals.get(app.app_name.toLowerCase()) ?? 0),
  }));
}

export async function getBlockedApps(supabase: AppSupabaseClient, userId: string) {
  await ensureDefaultBlockedApps(supabase, userId);

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [{ data: blockedApps, error: blockedAppsError }, { data: usageLogs, error: usageLogsError }] =
    await Promise.all([
      supabase.from("blocked_apps").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase
        .from("usage_logs")
        .select("app_name, minutes")
        .eq("user_id", userId)
        .gte("logged_at", dayStart.toISOString()),
    ]);

  if (blockedAppsError) {
    throw blockedAppsError;
  }

  if (usageLogsError) {
    throw usageLogsError;
  }

  const usageTotals = usageLogs.reduce((totals, entry) => {
    const key = entry.app_name.toLowerCase();
    const nextMinutes = (totals.get(key) ?? 0) + entry.minutes;
    totals.set(key, nextMinutes);
    return totals;
  }, new Map<string, number>());

  return mapBlockedApps(blockedApps, usageTotals);
}

export async function addBlockedApp(
  supabase: AppSupabaseClient,
  userId: string,
  name: string,
  category: BlockedAppCategory,
) {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("Blocked app name is required.");
  }

  const { data: existingApp, error: lookupError } = await supabase
    .from("blocked_apps")
    .select("id")
    .eq("user_id", userId)
    .ilike("app_name", cleanName)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingApp) {
    const { error: updateError } = await supabase
      .from("blocked_apps")
      .update({ category, is_blocked: true })
      .eq("id", existingApp.id)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    await insertActivityLog(supabase, userId, "app_blocked", {
      appId: existingApp.id,
      appName: cleanName,
      category,
      source: "existing_app",
    });

    return getBlockedApps(supabase, userId);
  }

  const { error: insertError } = await supabase.from("blocked_apps").insert({
    user_id: userId,
    app_name: cleanName,
    category,
    is_blocked: true,
  });

  if (insertError) {
    throw insertError;
  }

  const { data: insertedApp, error: insertedAppError } = await supabase
    .from("blocked_apps")
    .select("id")
    .eq("user_id", userId)
    .ilike("app_name", cleanName)
    .single();

  if (insertedAppError) {
    throw insertedAppError;
  }

  await insertActivityLog(supabase, userId, "app_blocked", {
    appId: insertedApp.id,
    appName: cleanName,
    category,
    source: "new_app",
  });

  return getBlockedApps(supabase, userId);
}

export async function toggleBlockedApp(
  supabase: AppSupabaseClient,
  userId: string,
  appId: string,
) {
  const { data: app, error } = await supabase
    .from("blocked_apps")
    .select("id, is_blocked")
    .eq("id", appId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  const { error: updateError } = await supabase
    .from("blocked_apps")
    .update({ is_blocked: !app.is_blocked })
    .eq("id", appId)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  await insertActivityLog(supabase, userId, app.is_blocked ? "app_unblocked" : "app_blocked", {
    appId,
  });

  return getBlockedApps(supabase, userId);
}

export async function setBlockedAppsByCategory(
  supabase: AppSupabaseClient,
  userId: string,
  category: BlockedAppCategory,
  blocked: boolean,
) {
  const { error } = await supabase
    .from("blocked_apps")
    .update({ is_blocked: blocked })
    .eq("user_id", userId)
    .eq("category", category);

  if (error) {
    throw error;
  }

  await insertActivityLog(supabase, userId, blocked ? "app_blocked" : "app_unblocked", {
    category,
    source: "category_update",
  });

  return getBlockedApps(supabase, userId);
}

export async function enableWorkMode(supabase: AppSupabaseClient, userId: string) {
  const { data: blockedApps, error } = await supabase
    .from("blocked_apps")
    .select("id, category")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  await Promise.all(
    blockedApps.map(async (app) => {
      const shouldBlock =
        app.category === "social" || app.category === "video" || app.category === "forum";

      const { error: updateError } = await supabase
        .from("blocked_apps")
        .update({ is_blocked: shouldBlock })
        .eq("id", app.id)
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }
    }),
  );

  await insertActivityLog(supabase, userId, "app_blocked", {
    source: "work_mode",
    categories: ["social", "video", "forum"],
  });

  return getBlockedApps(supabase, userId);
}

export async function removeBlockedApp(
  supabase: AppSupabaseClient,
  userId: string,
  appId: string,
) {
  const { error } = await supabase
    .from("blocked_apps")
    .delete()
    .eq("id", appId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  await insertActivityLog(supabase, userId, "app_unblocked", {
    appId,
    source: "removed_from_blocklist",
  });

  return getBlockedApps(supabase, userId);
}
