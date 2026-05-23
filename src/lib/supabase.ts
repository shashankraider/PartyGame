import { createClient } from "@supabase/supabase-js";

export type SessionStatus = "lobby" | "in_progress" | "paused" | "finished";
export type SessionPhase = "briefing" | "interrogation" | "accusation" | "reveal";
export type SessionScene =
  | "lobby"
  | "brief"
  | "case_board"
  | "interview"
  | "phone_hack"
  | "accusation"
  | "reveal";

export type SessionRow = {
  id: string;
  case_id: string;
  case_version: string;
  join_code: string;
  mode: "solo" | "multi";
  status: SessionStatus;
  phase: SessionPhase;
  current_scene: SessionScene;
  current_chapter_id: string | null;
  current_interviewer_player_id: string | null;
  current_interview_suspect_id: string | null;
  unlocked_evidence: string[];
  presented_evidence_by_suspect: Record<string, unknown>;
  accusation_target_suspect_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  expires_at: string;
};

export type PlayerRow = {
  id: string;
  session_id: string;
  name: string;
  seat_number: number;
  is_host: boolean;
  is_observer: boolean;
  device_id: string;
  joined_at: string;
  last_seen_at: string;
};

export type AccusationVoteRow = {
  session_id: string;
  player_id: string;
  suspect_id: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  session_id: string;
  suspect_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  presented_evidence_id: string | null;
  asked_by_player_id: string | null;
  is_streaming: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
};

export type InterviewUnlockStateRow = {
  session_id: string;
  suspect_id: string;
  condition_id: string;
  attempts: number;
  pressure_count: number;
  max_adjacency: number;
  last_reason: string | null;
  last_evaluated_at: string;
  met_at: string | null;
  met_via: "adjudicator" | "host" | "evidence-only" | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: SessionRow;
        Insert: Partial<SessionRow> &
          Pick<SessionRow, "case_id" | "case_version" | "join_code" | "mode">;
        Update: Partial<SessionRow>;
      };
      players: {
        Row: PlayerRow;
        Insert: Partial<PlayerRow> &
          Pick<PlayerRow, "session_id" | "name" | "seat_number" | "device_id">;
        Update: Partial<PlayerRow>;
      };
      events: {
        Row: {
          id: string;
          session_id: string;
          type: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          session_id: string;
          type: string;
          payload?: Record<string, unknown>;
        };
        Update: never;
      };
      accusation_votes: {
        Row: AccusationVoteRow;
        Insert: Pick<AccusationVoteRow, "session_id" | "player_id" | "suspect_id"> &
          Partial<AccusationVoteRow>;
        Update: Partial<AccusationVoteRow>;
      };
      messages: {
        Row: MessageRow;
        Insert: Pick<MessageRow, "session_id" | "suspect_id" | "role" | "sequence"> &
          Partial<MessageRow>;
        Update: Partial<MessageRow>;
      };
      interview_unlock_state: {
        Row: InterviewUnlockStateRow;
        Insert: Pick<InterviewUnlockStateRow, "session_id" | "suspect_id" | "condition_id"> &
          Partial<InterviewUnlockStateRow>;
        Update: Partial<InterviewUnlockStateRow>;
      };
    };
  };
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getMissingSupabaseServerEnv(): string[] {
  return ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((name) => !process.env[name]);
}

export function hasSupabaseServerEnv(): boolean {
  return getMissingSupabaseServerEnv().length === 0;
}

export function createSupabaseBrowserClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function createSupabaseServerClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
