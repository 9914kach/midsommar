export type Role = "admin" | "lekledare" | "värd" | "gäst";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; username: string; role: Role; created_at: string };
        Insert: { id?: string; username: string; role?: Role; created_at?: string };
        Update: { username?: string; role?: Role };
        Relationships: [];
      };
      official_teams: {
        Row: { id: string; name: string; color: string; emoji: string; created_at: string };
        Insert: { id?: string; name: string; color: string; emoji?: string };
        Update: { name?: string; color?: string; emoji?: string };
        Relationships: [];
      };
      official_team_members: {
        Row: { user_id: string; team_id: string };
        Insert: { user_id: string; team_id: string };
        Update: { user_id?: string; team_id?: string };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          game: string;
          format: "bracket" | "round_robin" | "free" | "multi_event";
          status: "draft" | "active" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          game: string;
          format: "bracket" | "round_robin" | "free" | "multi_event";
          status?: "draft" | "active" | "completed";
        };
        Update: { name?: string; status?: "draft" | "active" | "completed"; format?: "bracket" | "round_robin" | "free" | "multi_event" };
        Relationships: [];
      };
      tournament_teams: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          color: string | null;
          official_team_id: string | null;
          points: number;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          name: string;
          color?: string;
          official_team_id?: string;
          points?: number;
        };
        Update: { name?: string; color?: string; points?: number; official_team_id?: string | null };
        Relationships: [];
      };
      tournament_team_members: {
        Row: { tournament_team_id: string; user_id: string };
        Insert: { tournament_team_id: string; user_id: string };
        Update: { tournament_team_id?: string; user_id?: string };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          team_a_id: string | null;
          team_b_id: string | null;
          score_a: number;
          score_b: number;
          status: "pending" | "active" | "completed";
          round: number;
          bracket_position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          team_a_id?: string | null;
          team_b_id?: string | null;
          score_a?: number;
          score_b?: number;
          status?: "pending" | "active" | "completed";
          round?: number;
          bracket_position?: number;
        };
        Update: {
          score_a?: number;
          score_b?: number;
          status?: "pending" | "active" | "completed";
          team_a_id?: string | null;
          team_b_id?: string | null;
        };
        Relationships: [];
      };
      tournament_events: {
        Row: { id: string; tournament_id: string; name: string; scoring_type: string; description: string | null; created_at: string };
        Insert: { id?: string; tournament_id: string; name: string; scoring_type?: string; description?: string | null };
        Update: { name?: string; scoring_type?: string; description?: string | null };
        Relationships: [];
      };
      tournament_event_results: {
        Row: { id: string; event_id: string; tournament_team_id: string; value: number | null };
        Insert: { id?: string; event_id: string; tournament_team_id: string; value?: number | null };
        Update: { value?: number | null };
        Relationships: [];
      };
      schedule_entries: {
        Row: { id: string; time: string; title: string; description: string | null; sort_order: number };
        Insert: { id?: string; time: string; title: string; description?: string | null; sort_order?: number };
        Update: { time?: string; title?: string; description?: string | null; sort_order?: number };
        Relationships: [];
      };
      site_info: {
        Row: { key: string; value: string | null; updated_at: string };
        Insert: { key: string; value?: string | null };
        Update: { value?: string | null };
        Relationships: [];
      };
      packing_items: {
        Row: { id: string; text: string; category: string; sort_order: number };
        Insert: { id?: string; text: string; category?: string; sort_order?: number };
        Update: { text?: string; category?: string; sort_order?: number };
        Relationships: [];
      };
      task_assignments: {
        Row: { id: string; task: string; assigned_to: string | null; description: string | null; sort_order: number };
        Insert: { id?: string; task: string; assigned_to?: string | null; description?: string | null; sort_order?: number };
        Update: { task?: string; assigned_to?: string | null; description?: string | null; sort_order?: number };
        Relationships: [];
      };
      app_settings: {
        Row: { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string };
        Update: { value?: string };
        Relationships: [];
      };
      bets: {
        Row: { id: string; created_by: string | null; description: string; status: "open" | "closed" | "resolved"; winner_side: "for" | "against" | null; created_at: string };
        Insert: { id?: string; created_by?: string | null; description: string; status?: "open" | "closed" | "resolved"; winner_side?: "for" | "against" | null };
        Update: { status?: "open" | "closed" | "resolved"; winner_side?: "for" | "against" | null };
        Relationships: [];
      };
      bet_entries: {
        Row: { id: string; bet_id: string; user_id: string; side: "for" | "against"; klunkar: number; created_at: string };
        Insert: { id?: string; bet_id: string; user_id: string; side: "for" | "against"; klunkar: number };
        Update: { side?: "for" | "against"; klunkar?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
