"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { PublicShell } from "../components/PublicShell";
import { Mail, Lock, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Use at least 6 characters"),
});

type AuthForm = z.infer<typeof authSchema>;

const authErrorMessages: Record<string, string> = {
  auth_not_configured: "Supabase auth is not configured yet.",
  missing_code: "The sign-in provider did not return an authorization code.",
  oauth_exchange_failed: "Could not finish Google sign-in. Please try again.",
};

export function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });
  const authError = searchParams.get("error");

  const logActivity = async (eventType: "login", metadata: Record<string, string>) => {
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, metadata }),
      });
    } catch (error) {
      console.error("Failed to write auth activity log", error);
    }
  };

  useEffect(() => {
    if (!authError) {
      return;
    }

    toast.error(authErrorMessages[authError] ?? "Authentication failed. Please try again.");
  }, [authError]);

  const getCallbackUrl = () => {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/app");
    return callbackUrl.toString();
  };

  const handleSubmit = async (values: AuthForm) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      if (!supabase) {
        toast.error("Supabase auth is not configured. Add the public auth environment variables.");
        return;
      }

      const result = isSignUp
        ? await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: { emailRedirectTo: getCallbackUrl() },
          })
        : await supabase.auth.signInWithPassword(values);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      if (isSignUp && !result.data.session) {
        toast.success("Account created. Check your email to confirm sign-in.");
        return;
      }

      await logActivity("login", {
        method: isSignUp ? "email_signup" : "email_password",
      });

      toast.success(isSignUp ? "Account created" : "Welcome back");
      router.replace("/app");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const supabase = createClient();

    if (!supabase) {
      toast.error("Supabase auth is not configured. Add the public auth environment variables.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getCallbackUrl() },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email");
    const parsedEmail = z.string().email().safeParse(email);

    if (!parsedEmail.success) {
      toast.error("Enter your email first");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      toast.error("Supabase auth is not configured. Password reset is unavailable.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent");
  };

  return (
    <PublicShell narrow>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-12 flex flex-col items-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C] shadow-xl shadow-[#FF9F1C]/30">
            <Zap className="h-10 w-10 text-[#0B0B0F]" fill="#0B0B0F" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-gray-400">
            {isSignUp ? "Start your focus journey" : "Continue your progress"}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
        >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-[#FF9F1C] focus:outline-none"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-2 text-xs text-red-300">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-[#FF9F1C] focus:outline-none"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && (
                <p className="mt-2 text-xs text-red-300">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#FF9F1C] transition-colors hover:text-[#FF8F0C]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#FF9F1C] to-[#FF6B1C] font-semibold text-[#0B0B0F] shadow-lg shadow-[#FF9F1C]/30 transition-all hover:shadow-xl hover:shadow-[#FF9F1C]/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Securing session..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={handleGoogleAuth}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 font-medium text-white transition-all hover:bg-white/10 active:scale-95"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0B0B0F]">
              G
            </span>
            Continue with Google
          </button>
        </motion.div>

        <div className="text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-gray-400">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <span className="text-[#FF9F1C] transition-colors hover:text-[#FF8F0C]">
              {isSignUp ? "Sign In" : "Sign Up"}
            </span>
          </button>
        </div>
      </div>
    </PublicShell>
  );
}
