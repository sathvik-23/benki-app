-- Migration: Create database functions
-- Description: Creates helper function to get full transcript for a session
-- Date: 2024-11-13

-- Function to get full transcript for a session
CREATE OR REPLACE FUNCTION get_full_transcript(session_uuid UUID)
RETURNS TEXT AS $$
  SELECT string_agg(transcript_text, ' ' ORDER BY chunk_index)
  FROM transcription_chunks
  WHERE session_id = session_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION get_full_transcript(UUID) IS 'Returns the concatenated transcript text for a given session';


