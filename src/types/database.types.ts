export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      parent_accounts: {
        Row: {
          id: string;
          email: string;
          name: string;
          photo_url: string | null;
          subscription_tier: string;
          max_children: number;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          photo_url?: string | null;
          subscription_tier?: string;
          max_children?: number;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          photo_url?: string | null;
          subscription_tier?: string;
          max_children?: number;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      child_accounts: {
        Row: {
          id: string;
          name: string;
          age: number;
          photo_url: string | null;
          access_pin: string;
          pin_hash: string;
          qr_code_hash: string | null;
          color_theme: string;
          icon_emoji: string;
          sensory_profile: Json | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          age: number;
          photo_url?: string | null;
          access_pin: string;
          pin_hash: string;
          qr_code_hash?: string | null;
          color_theme?: string;
          icon_emoji?: string;
          sensory_profile?: Json | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          name?: string;
          age?: number;
          photo_url?: string | null;
          access_pin?: string;
          pin_hash?: string;
          color_theme?: string;
          icon_emoji?: string;
          sensory_profile?: Json | null;
          notes?: string | null;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      routines: {
        Row: {
          id: string;
          child_id: string;
          name: string;
          type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          name: string;
          type: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          routine_id: string;
          name: string;
          icon_emoji: string;
          order_index: number;
          estimated_minutes: number;
          has_sensory_issues: boolean;
          sensory_category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          name: string;
          icon_emoji: string;
          order_index: number;
          estimated_minutes?: number;
          has_sensory_issues?: boolean;
          sensory_category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          icon_emoji?: string;
          order_index?: number;
          estimated_minutes?: number;
          has_sensory_issues?: boolean;
          sensory_category?: string | null;
          updated_at?: string;
        };
      };
      task_progress: {
        Row: {
          id: string;
          child_id: string;
          routine_id: string;
          task_id: string | null;
          completed_at: string;
          completion_date: string;
          took_minutes: number | null;
          mood: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          routine_id: string;
          task_id?: string | null;
          completed_at?: string;
          completion_date?: string;
          took_minutes?: number | null;
          mood?: string | null;
        };
        Update: {
          took_minutes?: number | null;
          mood?: string | null;
        };
      };
      educational_strategies: {
        Row: {
          id: string;
          category: string;
          problem_type: string;
          title: string;
          description: string;
          tips: Json | null;
          video_url: string | null;
          order_index: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          problem_type: string;
          title: string;
          description: string;
          tips?: Json | null;
          video_url?: string | null;
          order_index?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          tips?: Json | null;
          video_url?: string | null;
          order_index?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
