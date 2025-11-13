-- Combined Migration: All migrations in one file
-- Description: Run this file to set up the entire database schema at once
-- Date: 2024-11-13
-- 
-- This file combines all individual migration files for convenience.
-- You can run this single file in Supabase SQL Editor to set up everything.

-- ============================================================================
-- 001: Create Tables
-- ============================================================================

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

-- Add comments to tables
COMMENT ON TABLE sessions IS 'Stores recording sessions for users';
COMMENT ON TABLE transcription_chunks IS 'Stores individual transcription chunks for each session';

-- ============================================================================
-- 002: Create Indexes
-- ============================================================================

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON sessions(user_id, status);

-- Indexes for transcription_chunks table
CREATE INDEX IF NOT EXISTS idx_chunks_session_id ON transcription_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON transcription_chunks(session_id, chunk_index);

-- ============================================================================
-- 003: Create Functions
-- ============================================================================

-- Function to get full transcript for a session
CREATE OR REPLACE FUNCTION get_full_transcript(session_uuid UUID)
RETURNS TEXT AS $$
  SELECT string_agg(transcript_text, ' ' ORDER BY chunk_index)
  FROM transcription_chunks
  WHERE session_id = session_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION get_full_transcript(UUID) IS 'Returns the concatenated transcript text for a given session';

-- ============================================================================
-- 004: Create Triggers
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on sessions table
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_updated_at();

-- Add comment to function
COMMENT ON FUNCTION update_session_updated_at() IS 'Automatically updates the updated_at timestamp when a session is updated';

-- ============================================================================
-- 005: Enable Row Level Security
-- ============================================================================

-- Enable Row Level Security on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on transcription_chunks table
ALTER TABLE transcription_chunks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 006: Create RLS Policies
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view own chunks" ON transcription_chunks;
DROP POLICY IF EXISTS "Users can insert own chunks" ON transcription_chunks;
DROP POLICY IF EXISTS "Users can delete own chunks" ON transcription_chunks;

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Transcription chunks policies
CREATE POLICY "Users can view own chunks" ON transcription_chunks
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own chunks" ON transcription_chunks
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own chunks" ON transcription_chunks
  FOR DELETE USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- All migrations have been applied successfully!
-- 
-- Next steps:
-- 1. Verify tables exist in Table Editor
-- 2. Test authentication flow
-- 3. Test creating a session
-- 4. Verify RLS policies are working
-- 
-- ============================================================================

