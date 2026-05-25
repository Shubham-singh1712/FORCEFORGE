import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserBootstrap } from "@/lib/supabase/user-bootstrap";
import { getRewardsData } from "@/lib/data/rewards";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureUserBootstrap(supabase, user);
    const payload = await getRewardsData(supabase, user.id);
    return NextResponse.json(payload);
  } catch (rewardsError) {
    console.error("Failed to load rewards", rewardsError);
    return NextResponse.json({ error: "Failed to load rewards" }, { status: 500 });
  }
}
