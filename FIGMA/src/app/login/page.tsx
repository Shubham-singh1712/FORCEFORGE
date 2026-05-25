import { redirect } from "next/navigation";
import { LoginScreen } from "@/features/auth/login-screen";
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

  return <LoginScreen />;
}
