-- Migration: Enable Row Level Security
-- Description: Enables RLS on sessions and transcription_chunks tables
-- Date: 2024-11-13

-- Enable Row Level Security on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on transcription_chunks table
ALTER TABLE transcription_chunks ENABLE ROW LEVEL SECURITY;

