-- ============================================================================
-- Database Verification Test Script
-- ============================================================================
-- Description: Run this script in Supabase SQL Editor to verify all database
--              objects are created correctly
-- ============================================================================

-- Test 1: Check if tables exist
-- ============================================================================
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  RAISE NOTICE '📊 Testing Tables...';
  
  -- Check sessions table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'sessions';
  
  IF table_count > 0 THEN
    RAISE NOTICE '✅ Table "sessions" exists';
  ELSE
    RAISE EXCEPTION '❌ Table "sessions" does not exist';
  END IF;
  
  -- Check transcription_chunks table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'transcription_chunks';
  
  IF table_count > 0 THEN
    RAISE NOTICE '✅ Table "transcription_chunks" exists';
  ELSE
    RAISE EXCEPTION '❌ Table "transcription_chunks" does not exist';
  END IF;
END $$;

-- Test 2: Check table columns
-- ============================================================================
DO $$
DECLARE
  column_count INTEGER;
  expected_columns TEXT[] := ARRAY['id', 'user_id', 'session_type', 'status', 'title', 'created_at', 'updated_at', 'total_duration_ms'];
  col TEXT;
  found_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🏗️  Testing Table Structure...';
  
  -- Check sessions table columns
  FOREACH col IN ARRAY expected_columns
  LOOP
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = col;
    
    IF column_count > 0 THEN
      found_count := found_count + 1;
    ELSE
      RAISE WARNING '⚠️  Column "%" not found in sessions table', col;
    END IF;
  END LOOP;
  
  IF found_count = array_length(expected_columns, 1) THEN
    RAISE NOTICE '✅ All expected columns found in sessions table';
  ELSE
    RAISE WARNING '⚠️  Only %/% columns found in sessions table', found_count, array_length(expected_columns, 1);
  END IF;
  
  -- Check transcription_chunks table columns
  expected_columns := ARRAY['id', 'session_id', 'chunk_index', 'transcript_text', 'duration_ms', 'created_at'];
  found_count := 0;
  
  FOREACH col IN ARRAY expected_columns
  LOOP
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transcription_chunks'
      AND column_name = col;
    
    IF column_count > 0 THEN
      found_count := found_count + 1;
    ELSE
      RAISE WARNING '⚠️  Column "%" not found in transcription_chunks table', col;
    END IF;
  END LOOP;
  
  IF found_count = array_length(expected_columns, 1) THEN
    RAISE NOTICE '✅ All expected columns found in transcription_chunks table';
  ELSE
    RAISE WARNING '⚠️  Only %/% columns found in transcription_chunks table', found_count, array_length(expected_columns, 1);
  END IF;
END $$;

-- Test 3: Check indexes
-- ============================================================================
DO $$
DECLARE
  index_count INTEGER;
  expected_indexes TEXT[] := ARRAY[
    'idx_sessions_user_id',
    'idx_sessions_created_at',
    'idx_sessions_status',
    'idx_sessions_user_status',
    'idx_chunks_session_id',
    'idx_chunks_chunk_index'
  ];
  idx TEXT;
  found_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Testing Indexes...';
  
  FOREACH idx IN ARRAY expected_indexes
  LOOP
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = idx;
    
    IF index_count > 0 THEN
      RAISE NOTICE '✅ Index "%" exists', idx;
      found_count := found_count + 1;
    ELSE
      RAISE WARNING '⚠️  Index "%" does not exist', idx;
    END IF;
  END LOOP;
  
  IF found_count = array_length(expected_indexes, 1) THEN
    RAISE NOTICE '✅ All expected indexes found';
  ELSE
    RAISE WARNING '⚠️  Only %/% indexes found', found_count, array_length(expected_indexes, 1);
  END IF;
END $$;

-- Test 4: Check functions
-- ============================================================================
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Testing Functions...';
  
  -- Check get_full_transcript function
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'get_full_transcript';
  
  IF func_count > 0 THEN
    RAISE NOTICE '✅ Function "get_full_transcript" exists';
  ELSE
    RAISE WARNING '⚠️  Function "get_full_transcript" does not exist';
  END IF;
  
  -- Check update_session_updated_at function
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'update_session_updated_at';
  
  IF func_count > 0 THEN
    RAISE NOTICE '✅ Function "update_session_updated_at" exists';
  ELSE
    RAISE WARNING '⚠️  Function "update_session_updated_at" does not exist';
  END IF;
END $$;

-- Test 5: Check triggers
-- ============================================================================
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Testing Triggers...';
  
  -- Check update_sessions_updated_at trigger
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND event_object_table = 'sessions'
    AND trigger_name = 'update_sessions_updated_at';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger "update_sessions_updated_at" exists on sessions table';
  ELSE
    RAISE WARNING '⚠️  Trigger "update_sessions_updated_at" does not exist on sessions table';
  END IF;
END $$;

-- Test 6: Check RLS is enabled
-- ============================================================================
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Testing Row Level Security...';
  
  -- Check sessions table RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'sessions';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on sessions table';
  ELSE
    RAISE WARNING '⚠️  RLS is NOT enabled on sessions table';
  END IF;
  
  -- Check transcription_chunks table RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'transcription_chunks';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on transcription_chunks table';
  ELSE
    RAISE WARNING '⚠️  RLS is NOT enabled on transcription_chunks table';
  END IF;
END $$;

-- Test 7: Check RLS policies
-- ============================================================================
DO $$
DECLARE
  policy_count INTEGER;
  expected_policies TEXT[] := ARRAY[
    'Users can view own sessions',
    'Users can insert own sessions',
    'Users can update own sessions',
    'Users can delete own sessions',
    'Users can view own chunks',
    'Users can insert own chunks',
    'Users can delete own chunks'
  ];
  policy TEXT;
  found_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Testing RLS Policies...';
  
  FOREACH policy IN ARRAY expected_policies
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = policy;
    
    IF policy_count > 0 THEN
      RAISE NOTICE '✅ Policy "%" exists', policy;
      found_count := found_count + 1;
    ELSE
      RAISE WARNING '⚠️  Policy "%" does not exist', policy;
    END IF;
  END LOOP;
  
  IF found_count = array_length(expected_policies, 1) THEN
    RAISE NOTICE '✅ All expected RLS policies found';
  ELSE
    RAISE WARNING '⚠️  Only %/% policies found', found_count, array_length(expected_policies, 1);
  END IF;
END $$;

-- Test 8: Check foreign key constraints
-- ============================================================================
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Testing Foreign Key Constraints...';
  
  -- Check sessions.user_id -> auth.users
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'sessions'
    AND kcu.column_name = 'user_id';
  
  IF fk_count > 0 THEN
    RAISE NOTICE '✅ Foreign key constraint on sessions.user_id exists';
  ELSE
    RAISE WARNING '⚠️  Foreign key constraint on sessions.user_id does not exist';
  END IF;
  
  -- Check transcription_chunks.session_id -> sessions
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'transcription_chunks'
    AND kcu.column_name = 'session_id';
  
  IF fk_count > 0 THEN
    RAISE NOTICE '✅ Foreign key constraint on transcription_chunks.session_id exists';
  ELSE
    RAISE WARNING '⚠️  Foreign key constraint on transcription_chunks.session_id does not exist';
  END IF;
END $$;

-- Test 9: Check check constraints
-- ============================================================================
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  Testing Check Constraints...';
  
  -- Check sessions.session_type constraint
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'CHECK'
    AND table_schema = 'public'
    AND table_name = 'sessions'
    AND constraint_name LIKE '%session_type%';
  
  IF constraint_count > 0 THEN
    RAISE NOTICE '✅ Check constraint on sessions.session_type exists';
  ELSE
    RAISE WARNING '⚠️  Check constraint on sessions.session_type does not exist';
  END IF;
  
  -- Check sessions.status constraint
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'CHECK'
    AND table_schema = 'public'
    AND table_name = 'sessions'
    AND constraint_name LIKE '%status%';
  
  IF constraint_count > 0 THEN
    RAISE NOTICE '✅ Check constraint on sessions.status exists';
  ELSE
    RAISE WARNING '⚠️  Check constraint on sessions.status does not exist';
  END IF;
END $$;

-- Test 10: Test function functionality
-- ============================================================================
DO $$
DECLARE
  test_result TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Testing Function Functionality...';
  
  -- Test get_full_transcript with non-existent session (should return NULL or empty)
  BEGIN
    SELECT get_full_transcript('00000000-0000-0000-0000-000000000000'::UUID) INTO test_result;
    RAISE NOTICE '✅ Function "get_full_transcript" can be called (returns: %)', COALESCE(test_result, 'NULL');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '⚠️  Function "get_full_transcript" failed: %', SQLERRM;
  END;
END $$;

-- Summary
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Database Verification Complete!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the output above for any warnings or errors.';
  RAISE NOTICE 'All checks marked with ✅ should be present.';
  RAISE NOTICE 'Any ⚠️  warnings indicate missing or incorrect configurations.';
  RAISE NOTICE '';
END $$;

