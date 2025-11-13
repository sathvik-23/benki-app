-- Migration: Create tables for Bolt mobile app
-- Description: Creates sessions and transcription_chunks tables
-- Date: 2024-11-13

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('single_record', 'live_transcription')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_duration_ms BIGINT
);

-- Create transcription_chunks table
CREATE TABLE IF NOT EXISTS transcription_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  transcript_text TEXT NOT NULL,
  duration_ms BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to tables
COMMENT ON TABLE sessions IS 'Stores recording sessions for users';
COMMENT ON TABLE transcription_chunks IS 'Stores individual transcription chunks for each session';

