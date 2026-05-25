import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfileData, updateProfileData } from "@/lib/data/profile";
import { ensureUserBootstrap } from "@/lib/supabase/user-bootstrap";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
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
    await ensureUserBootstrap(auth.supabase, auth.user);
    const profile = await getProfileData(auth.supabase, auth.user.id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to load profile", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthedClient();

  if ("error" in auth) {
    return auth.error;
  }

  const body = updateProfileSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid profile update" }, { status: 400 });
  }

  try {
    await ensureUserBootstrap(auth.supabase, auth.user);
    const profile = await updateProfileData(auth.supabase, auth.user.id, body.data);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
