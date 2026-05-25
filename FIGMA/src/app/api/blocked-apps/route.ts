import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  addBlockedApp,
  enableWorkMode,
  getBlockedApps,
  removeBlockedApp,
  setBlockedAppsByCategory,
  toggleBlockedApp,
} from "@/lib/data/blocked-apps";

const addSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.union([
    z.literal("social"),
    z.literal("video"),
    z.literal("chat"),
    z.literal("forum"),
    z.literal("other"),
  ]),
});

const patchSchema = z.union([
  z.object({
    action: z.literal("toggle"),
    appId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("set-category"),
    category: z.union([
      z.literal("social"),
      z.literal("video"),
      z.literal("chat"),
      z.literal("forum"),
      z.literal("other"),
    ]),
    blocked: z.boolean(),
  }),
  z.object({
    action: z.literal("work-mode"),
  }),
]);

const deleteSchema = z.object({
  appId: z.string().uuid(),
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
    const blockedApps = await getBlockedApps(auth.supabase, auth.user.id);
    return NextResponse.json({ blockedApps });
  } catch (error) {
    console.error("Failed to load blocked apps", error);
    return NextResponse.json({ error: "Failed to load blocked apps" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const body = addSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid blocked app request" }, { status: 400 });
  }

  try {
    const blockedApps = await addBlockedApp(
      auth.supabase,
      auth.user.id,
      body.data.name,
      body.data.category,
    );

    return NextResponse.json({ blockedApps });
  } catch (error) {
    console.error("Failed to add blocked app", error);
    return NextResponse.json({ error: "Failed to add blocked app" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const body = patchSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid blocked app update" }, { status: 400 });
  }

  try {
    const blockedApps =
      body.data.action === "toggle"
        ? await toggleBlockedApp(auth.supabase, auth.user.id, body.data.appId)
        : body.data.action === "set-category"
          ? await setBlockedAppsByCategory(
              auth.supabase,
              auth.user.id,
              body.data.category,
              body.data.blocked,
            )
          : await enableWorkMode(auth.supabase, auth.user.id);

    return NextResponse.json({ blockedApps });
  } catch (error) {
    console.error("Failed to update blocked apps", error);
    return NextResponse.json({ error: "Failed to update blocked apps" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const url = new URL(request.url);
  const body = deleteSchema.safeParse({
    appId: url.searchParams.get("appId"),
  });

  if (!body.success) {
    return NextResponse.json({ error: "Invalid blocked app delete request" }, { status: 400 });
  }

  try {
    const blockedApps = await removeBlockedApp(auth.supabase, auth.user.id, body.data.appId);
    return NextResponse.json({ blockedApps });
  } catch (error) {
    console.error("Failed to remove blocked app", error);
    return NextResponse.json({ error: "Failed to remove blocked app" }, { status: 500 });
  }
}
