import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

function getFullName(user: User) {
  const metadata = user.user_metadata;

  if (typeof metadata?.full_name === "string" && metadata.full_name.trim()) {
    return metadata.full_name.trim();
  }

  if (typeof metadata?.name === "string" && metadata.name.trim()) {
    return metadata.name.trim();
  }

  return null;
}

export async function ensureUserBootstrap(supabase: AppSupabaseClient, user: User) {
  if (!user.email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const { error: userError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: getFullName(user),
    },
    { onConflict: "id" },
  );

  if (userError) {
    throw userError;
  }

  const { data: existingStreak, error: streakLookupError } = await supabase
    .from("streaks")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (streakLookupError) {
    throw streakLookupError;
  }

  if (!existingStreak) {
    const { error: streakInsertError } = await supabase.from("streaks").insert({
      user_id: user.id,
      current_count: 0,
      longest_count: 0,
    });

    if (streakInsertError) {
      throw streakInsertError;
    }
  }
}
