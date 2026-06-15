export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; username: string; created_at: string };
        Insert: { id?: string; username: string; created_at?: string };
        Update: { username?: string };
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
          format: "bracket" | "round_robin" | "free";
          status: "draft" | "active" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          game: string;
          format: "bracket" | "round_robin" | "free";
          status?: "draft" | "active" | "completed";
        };
        Update: { name?: string; status?: "draft" | "active" | "completed"; format?: "bracket" | "round_robin" | "free" };
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
        Update: { name?: string; color?: string; points?: number; team_a_id?: string | null; team_b_id?: string | null };
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
