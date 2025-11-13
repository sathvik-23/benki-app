-- Migration: Create Row Level Security policies
-- Description: Creates RLS policies to ensure users can only access their own data
-- Date: 2024-11-13

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

