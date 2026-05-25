import { redirect } from "next/navigation";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/app");
    }
  }

  return <OnboardingScreen />;
}
