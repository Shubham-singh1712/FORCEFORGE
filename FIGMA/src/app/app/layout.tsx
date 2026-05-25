import { redirect } from "next/navigation";
import { MainLayout } from "../components/MainLayout";
import { createClient } from "@/lib/supabase/server";
import { ensureUserBootstrap } from "@/lib/supabase/user-bootstrap";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  try {
    await ensureUserBootstrap(supabase, user);
  } catch (bootstrapError) {
    console.error("Failed to bootstrap app session", bootstrapError);
  }

  return <MainLayout>{children}</MainLayout>;
}
