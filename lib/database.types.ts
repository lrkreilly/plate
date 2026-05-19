// Hand-written to match db/schema.sql. After the Supabase project exists,
// regenerate with: supabase gen types typescript --project-id <id> > lib/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; display_name: string | null } & Timestamps;
        Insert: { id: string; email: string; display_name?: string | null; created_at?: string };
        Update: { email?: string; display_name?: string | null };
        Relationships: [];
      };
      households: {
        Row: { id: string; name: string } & Timestamps;
        Insert: { id?: string; name: string; created_at?: string };
        Update: { name?: string };
        Relationships: [];
      };
      household_members: {
        Row: { household_id: string; user_id: string; role: "owner" | "member" } & Timestamps;
        Insert: { household_id: string; user_id: string; role?: "owner" | "member"; created_at?: string };
        Update: { role?: "owner" | "member" };
        Relationships: [];
      };
      app_config: {
        Row: { id: boolean; household_id: string | null; owner_email: string | null };
        Insert: { id?: boolean; household_id?: string | null; owner_email?: string | null };
        Update: { household_id?: string | null; owner_email?: string | null };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          protein_tag: string | null;
          prep_time: string;
          cooking_method: string | null;
          ingredients: Json;
          notes: string | null;
          steps: Json;
          image_url: string | null;
          image_search_term: string | null;
          cook_double: boolean;
          default_servings: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          protein_tag?: string | null;
          prep_time: string;
          cooking_method?: string | null;
          ingredients: Json;
          notes?: string | null;
          steps: Json;
          image_url?: string | null;
          image_search_term?: string | null;
          cook_double?: boolean;
          default_servings?: number;
        };
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          current_week: number;
          week_started_on: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          current_week?: number;
          week_started_on: string;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      meal_slots: {
        Row: {
          id: string;
          plan_id: string;
          week: number;
          day_of_week: number;
          meal_type: "breakfast" | "lunch" | "dinner";
          recipe_id: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          week: number;
          day_of_week: number;
          meal_type: "breakfast" | "lunch" | "dinner";
          recipe_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_slots"]["Insert"]>;
        Relationships: [];
      };
      grocery_items: {
        Row: {
          id: string;
          plan_id: string;
          week: number;
          name: string;
          quantity: string | null;
          category: "protein" | "produce" | "pantry" | "dairy";
          display_order: number;
        };
        Insert: {
          id?: string;
          plan_id: string;
          week: number;
          name: string;
          quantity?: string | null;
          category: "protein" | "produce" | "pantry" | "dairy";
          display_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["grocery_items"]["Insert"]>;
        Relationships: [];
      };
      supplements: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dose: string;
          schedule: string;
          notification_time: string | null;
          enabled: boolean;
          display_order: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dose: string;
          schedule: string;
          notification_time?: string | null;
          enabled?: boolean;
          display_order?: number;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["supplements"]["Insert"]>;
        Relationships: [];
      };
      supplement_logs: {
        Row: { id: string; user_id: string; supplement_id: string; date: string; taken_at: string };
        Insert: { id?: string; user_id: string; supplement_id: string; date: string; taken_at?: string };
        Update: Partial<Database["public"]["Tables"]["supplement_logs"]["Insert"]>;
        Relationships: [];
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          meal_slot_id: string;
          date: string;
          rating: number | null;
          kids_verdict: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_slot_id: string;
          date: string;
          rating?: number | null;
          kids_verdict?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["meal_logs"]["Insert"]>;
        Relationships: [];
      };
      grocery_checks: {
        Row: {
          id: string;
          household_id: string;
          grocery_item_id: string;
          week_starting: string;
          checked: boolean;
          checked_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          grocery_item_id: string;
          week_starting: string;
          checked?: boolean;
          checked_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["grocery_checks"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          user_id: string;
          kind: "morning_stack" | "slow_cooker" | "evening_magnesium";
          dedupe_key: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: "morning_stack" | "slow_cooker" | "evening_magnesium";
          dedupe_key: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
