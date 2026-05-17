import { createClient } from "@supabase/supabase-js";

export interface Database {
  public: {
    Tables: {
      user_credits: {
        Row: {
          user_id: string;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          thumbnail: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      canvas_elements: {
        Row: {
          id: string;
          project_id: string;
          element_data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          element_data: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          element_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
