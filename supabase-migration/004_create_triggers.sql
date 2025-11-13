-- Migration: Create triggers for automatic timestamp updates
-- Description: Creates trigger function and trigger to update updated_at timestamp
-- Date: 2024-11-13

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

