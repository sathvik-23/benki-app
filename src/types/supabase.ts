/**
 * Supabase database types
 */

export type SessionType = "single_record" | "live_transcription";
export type SessionStatus = "active" | "completed" | "cancelled";

export interface Session {
  id: string;
  user_id: string;
  session_type: SessionType;
  status: SessionStatus;
  title: string | null;
  created_at: string;
  updated_at: string;
  total_duration_ms: number | null;
}

export interface TranscriptionChunk {
  id: string;
  session_id: string;
  chunk_index: number;
  transcript_text: string;
  duration_ms: number | null;
  created_at: string;
}

export interface SessionWithChunks extends Session {
  chunks?: TranscriptionChunk[];
  full_transcript?: string;
}

