import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { insertActivityLog } from "@/lib/data/activity-logs";
import type { Json } from "@/types/database";

const activitySchema = z.object({
  eventType: z.union([
    z.literal("login"),
    z.literal("logout"),
    z.literal("session_started"),
    z.literal("session_paused"),
    z.literal("session_completed"),
    z.literal("reward_earned"),
    z.literal("app_blocked"),
    z.literal("app_unblocked"),
    z.literal("ai_insight_generated"),
    z.literal("weekly_report_generated"),
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = activitySchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid activity log request" }, { status: 400 });
  }

  try {
    await insertActivityLog(
      supabase,
      user.id,
      body.data.eventType,
      (body.data.metadata ?? {}) as Json,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to write activity log", error);
    return NextResponse.json({ error: "Failed to write activity log" }, { status: 500 });
  }
}
