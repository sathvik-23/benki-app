/**
 * Shared types for the Bolt app
 */

export type RecordingStatus = "idle" | "recording" | "uploading" | "transcribing" | "done" | "error";

// Re-export Supabase types for convenience
export type { Session, TranscriptionChunk, SessionWithChunks, SessionType, SessionStatus } from "./supabase";


