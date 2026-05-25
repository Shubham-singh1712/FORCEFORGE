import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

type AIInsightRow = Database["public"]["Tables"]["ai_insights"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type AILogExportData = {
  user: {
    email: string;
    fullName: string | null;
  };
  insights: Pick<AIInsightRow, "title" | "body" | "created_at">[];
  generationEvents: Pick<ActivityLogRow, "created_at" | "metadata">[];
};

export async function getAILogExportData(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<AILogExportData> {
  const [{ data: user, error: userError }, { data: insights, error: insightsError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase.from("users").select("email, full_name").eq("id", userId).single(),
      supabase
        .from("ai_insights")
        .select("title, body, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("activity_logs")
        .select("created_at, metadata")
        .eq("user_id", userId)
        .eq("event_type", "ai_insight_generated")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (userError) {
    throw userError;
  }

  if (insightsError) {
    throw insightsError;
  }

  if (eventsError) {
    throw eventsError;
  }

  return {
    user: {
      email: user.email,
      fullName: user.full_name,
    },
    insights: insights ?? [],
    generationEvents: events ?? [],
  };
}
