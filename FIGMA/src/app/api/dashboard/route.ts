import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data/dashboard";

const querySchema = z.object({
  period: z.union([z.literal("week"), z.literal("month")]).default("week"),
});

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const query = querySchema.safeParse({
    period: url.searchParams.get("period") ?? "week",
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid dashboard query" }, { status: 400 });
  }

  try {
    const payload = await getDashboardData(supabase, user.id, query.data.period);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load dashboard data", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
