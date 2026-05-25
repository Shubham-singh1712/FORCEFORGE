import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createFocusSession,
  getFocusSessionState,
  updateFocusSession,
} from "@/lib/data/focus-sessions";

const createSchema = z.object({
  durationMinutes: z.union([z.literal(25), z.literal(50)]),
});

const updateSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.union([
    z.literal("pause"),
    z.literal("resume"),
    z.literal("end"),
    z.literal("complete"),
  ]),
});

async function getAuthedClient() {
  const supabase = await createClient();

  if (!supabase) {
    return {
      error: NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user };
}

export async function GET() {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  try {
    const state = await getFocusSessionState(auth.supabase, auth.user.id);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to load focus session state", error);
    return NextResponse.json({ error: "Failed to load focus state" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const body = createSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid focus session request" }, { status: 400 });
  }

  try {
    const state = await createFocusSession(auth.supabase, auth.user.id, body.data.durationMinutes);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to create focus session", error);
    return NextResponse.json({ error: "Failed to start focus session" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const body = updateSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid focus session update" }, { status: 400 });
  }

  try {
    const state = await updateFocusSession(
      auth.supabase,
      auth.user.id,
      body.data.sessionId,
      body.data.action,
    );
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to update focus session", error);
    return NextResponse.json({ error: "Failed to update focus session" }, { status: 500 });
  }
}
