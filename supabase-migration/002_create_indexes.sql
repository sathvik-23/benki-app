-- Migration: Create indexes for better query performance
-- Description: Creates indexes on sessions and transcription_chunks tables
-- Date: 2024-11-13

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON sessions(user_id, status);

-- Indexes for transcription_chunks table
CREATE INDEX IF NOT EXISTS idx_chunks_session_id ON transcription_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON transcription_chunks(session_id, chunk_index);

