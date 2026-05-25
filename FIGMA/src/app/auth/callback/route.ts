import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertActivityLog } from "@/lib/data/activity-logs";
import { ensureUserBootstrap } from "@/lib/supabase/user-bootstrap";

function buildRedirectUrl(requestUrl: URL, path: string) {
  return new URL(path.startsWith("/") ? path : "/app", requestUrl.origin);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/app";
  const loginUrl = buildRedirectUrl(requestUrl, "/login");

  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  if (!supabase) {
    loginUrl.searchParams.set("error", "auth_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    loginUrl.searchParams.set("error", "oauth_exchange_failed");
    return NextResponse.redirect(loginUrl);
  }

  if (data.user) {
    try {
      await ensureUserBootstrap(supabase, data.user);
      await insertActivityLog(supabase, data.user.id, "login", {
        method: "oauth_google",
      });
    } catch (bootstrapError) {
      console.error("Failed to bootstrap authenticated user", bootstrapError);
    }
  }

  return NextResponse.redirect(buildRedirectUrl(requestUrl, nextPath));
}
