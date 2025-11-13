# Supabase Migrations for Bolt Mobile

This folder contains SQL migration files for setting up the Bolt mobile app database schema in Supabase.

## Migration Files

The migrations are numbered in order of execution:

1. **001_create_tables.sql** - Creates the `sessions` and `transcription_chunks` tables
2. **002_create_indexes.sql** - Creates indexes for better query performance
3. **003_create_functions.sql** - Creates the `get_full_transcript` helper function
4. **004_create_triggers.sql** - Creates trigger to auto-update `updated_at` timestamp
5. **005_enable_rls.sql** - Enables Row Level Security on all tables
6. **006_create_policies.sql** - Creates RLS policies for data access control

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended for first-time setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open each migration file in order (001 through 006)
4. Copy and paste the SQL into the editor
5. Click "Run" to execute each migration
6. Verify each migration completes successfully before moving to the next

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### Option 3: Run All Migrations at Once

You can combine all migrations into a single file and run it:

```bash
# Combine all migrations
cat supabase-migration/*.sql > combined_migration.sql

# Then run combined_migration.sql in Supabase SQL Editor
```

## Verification

After running all migrations, verify the setup:

1. **Check Tables**: Go to **Table Editor** → You should see `sessions` and `transcription_chunks`
2. **Check Indexes**: Run `\d sessions` and `\d transcription_chunks` in SQL Editor
3. **Check Functions**: Run `SELECT * FROM pg_proc WHERE proname = 'get_full_transcript';`
4. **Check RLS**: Go to **Authentication** → **Policies** → Verify policies exist for both tables
5. **Test RLS**: Try creating a session as a test user and verify only that user can see it

## Rollback

If you need to rollback migrations, you can run these commands in reverse order:

```sql
-- Drop policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view own chunks" ON transcription_chunks;
DROP POLICY IF EXISTS "Users can insert own chunks" ON transcription_chunks;
DROP POLICY IF EXISTS "Users can delete own chunks" ON transcription_chunks;

-- Disable RLS
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_chunks DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP FUNCTION IF EXISTS update_session_updated_at();

-- Drop functions
DROP FUNCTION IF EXISTS get_full_transcript(UUID);

-- Drop indexes
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_created_at;
DROP INDEX IF EXISTS idx_sessions_status;
DROP INDEX IF EXISTS idx_sessions_user_status;
DROP INDEX IF EXISTS idx_chunks_session_id;
DROP INDEX IF EXISTS idx_chunks_chunk_index;

-- Drop tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS transcription_chunks;
DROP TABLE IF EXISTS sessions;
```

## Notes

- All migrations use `IF NOT EXISTS` or `IF EXISTS` for idempotency (safe to run multiple times)
- Migrations are designed to be run in order
- The `get_full_transcript` function uses `SECURITY DEFINER` to bypass RLS when aggregating chunks
- RLS policies ensure users can only access their own sessions and chunks
- The trigger automatically updates `updated_at` whenever a session is modified

## Troubleshooting

### Error: "relation already exists"
- This means the table/function already exists. The migrations use `IF NOT EXISTS` so this should be safe to ignore.

### Error: "permission denied"
- Make sure you're running migrations as a database admin or using the service_role key
- Check that you have proper permissions in your Supabase project

### Error: "policy already exists"
- Migration 006 drops existing policies before creating new ones, so this shouldn't happen
- If it does, manually drop the policy first: `DROP POLICY "policy_name" ON table_name;`

### RLS blocking legitimate requests
- Verify policies are correctly created
- Check that `auth.uid()` is returning the correct user ID
- Review Supabase logs for policy violations


