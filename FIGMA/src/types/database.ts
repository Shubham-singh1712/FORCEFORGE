export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FocusSessionStatus = "planned" | "active" | "paused" | "completed" | "cancelled";
export type UsageAppCategory = "productive" | "distracting" | "neutral";
export type BlockedAppCategory = "social" | "video" | "chat" | "forum" | "other";
export type ActivityEventType =
  | "login"
  | "logout"
  | "session_started"
  | "session_paused"
  | "session_completed"
  | "reward_earned"
  | "app_blocked"
  | "app_unblocked"
  | "ai_insight_generated"
  | "weekly_report_generated";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          focus_score: number;
          xp: number;
          level: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          duration_minutes: number;
          completed_minutes: number;
          completed_seconds: number;
          status: FocusSessionStatus;
          xp_awarded: number;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["focus_sessions"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["focus_sessions"]["Row"]>;
      };
      blocked_apps: {
        Row: {
          id: string;
          user_id: string;
          app_name: string;
          category: BlockedAppCategory;
          is_blocked: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["blocked_apps"]["Row"]> & {
          user_id: string;
          app_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocked_apps"]["Row"]>;
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          app_name: string;
          category: UsageAppCategory;
          minutes: number;
          logged_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["usage_logs"]["Row"]> & {
          user_id: string;
          app_name: string;
          minutes: number;
        };
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Row"]>;
      };
      ai_insights: {
        Row: { id: string; user_id: string; title: string; body: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["ai_insights"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["ai_insights"]["Row"]>;
      };
      weekly_reports: {
        Row: { id: string; user_id: string; week_start: string; metrics: Json; ai_summary: string };
        Insert: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]>;
      };
      badges: {
        Row: { id: string; code: string; title: string; description: string; xp_required: number };
        Insert: Partial<Database["public"]["Tables"]["badges"]["Row"]> & { code: string; title: string };
        Update: Partial<Database["public"]["Tables"]["badges"]["Row"]>;
      };
      streaks: {
        Row: { id: string; user_id: string; current_count: number; longest_count: number; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["streaks"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["streaks"]["Row"]>;
      };
      rewards: {
        Row: { id: string; user_id: string; reward_type: string; amount: number; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["rewards"]["Row"]> & { user_id: string; reward_type: string };
        Update: Partial<Database["public"]["Tables"]["rewards"]["Row"]>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          event_type: ActivityEventType;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & {
          user_id: string;
          event_type: ActivityEventType;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
      };
    };
  };
}
