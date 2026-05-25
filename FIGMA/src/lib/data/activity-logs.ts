import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEventType, Database, Json } from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

export async function insertActivityLog(
  supabase: AppSupabaseClient,
  userId: string,
  eventType: ActivityEventType,
  metadata: Json = {},
) {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    event_type: eventType,
    metadata,
  });

  if (error) {
    throw error;
  }
}
