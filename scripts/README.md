# Database Test Scripts

This directory contains scripts to verify that all Supabase database objects are created correctly.

## Available Tests

### 1. SQL Test Script (Recommended)

**File:** `test-database.sql`

This is the most comprehensive test script. Run it directly in the Supabase SQL Editor.

**How to use:**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `test-database.sql`
4. Run the script
5. Review the output for any warnings or errors

**What it tests:**
- ✅ Table existence (`sessions`, `transcription_chunks`)
- ✅ Table structure (all expected columns)
- ✅ Indexes (all 6 expected indexes)
- ✅ Functions (`get_full_transcript`, `update_session_updated_at`)
- ✅ Triggers (`update_sessions_updated_at`)
- ✅ Row Level Security (RLS) enabled
- ✅ RLS Policies (all 7 expected policies)
- ✅ Foreign key constraints
- ✅ Check constraints
- ✅ Function functionality

### 2. Node.js Test Script

**File:** `test-database.js`

A Node.js script that uses the Supabase client to perform basic checks.

**How to use:**
```bash
npm run test:db
```

**Requirements:**
- `.env.local` file with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Optional: `SUPABASE_SERVICE_ROLE_KEY` for admin-level checks

**What it tests:**
- ✅ Table existence (via query attempts)
- ✅ Basic table structure
- ⚠️  Indexes (requires direct DB access - shows warning)
- ✅ Functions (via RPC call)
- ⚠️  Triggers (requires direct DB access - shows warning)
- ⚠️  RLS (requires direct DB access - shows warning)
- ⚠️  RLS Policies (requires direct DB access - shows warning)
- ✅ Basic SELECT operations

**Note:** Many checks require direct database access, so this script is more limited than the SQL script.

## Expected Database Objects

### Tables
- `sessions` - Stores recording sessions
- `transcription_chunks` - Stores transcription chunks for each session

### Indexes
- `idx_sessions_user_id` - On `sessions(user_id)`
- `idx_sessions_created_at` - On `sessions(created_at DESC)`
- `idx_sessions_status` - On `sessions(status)`
- `idx_sessions_user_status` - On `sessions(user_id, status)`
- `idx_chunks_session_id` - On `transcription_chunks(session_id)`
- `idx_chunks_chunk_index` - On `transcription_chunks(session_id, chunk_index)`

### Functions
- `get_full_transcript(session_uuid UUID)` - Returns concatenated transcript text
- `update_session_updated_at()` - Trigger function to update `updated_at` timestamp

### Triggers
- `update_sessions_updated_at` - On `sessions` table, before update

### RLS Policies
**Sessions table:**
- "Users can view own sessions"
- "Users can insert own sessions"
- "Users can update own sessions"
- "Users can delete own sessions"

**Transcription chunks table:**
- "Users can view own chunks"
- "Users can insert own chunks"
- "Users can delete own chunks"

## Troubleshooting

### If tables are missing:
Run the migration files in order:
1. `supabase-migration/001_create_tables.sql`
2. `supabase-migration/002_create_indexes.sql`
3. `supabase-migration/003_create_functions.sql`
4. `supabase-migration/004_create_triggers.sql`
5. `supabase-migration/005_enable_rls.sql`
6. `supabase-migration/006_create_policies.sql`

Or run the combined migration:
- `supabase-migration/000_combined_migration.sql`

### If RLS policies are missing:
Check that RLS is enabled first, then run:
- `supabase-migration/006_create_policies.sql`

### If functions don't work:
Verify the function exists and has the correct signature. Check:
- `supabase-migration/003_create_functions.sql`

## Next Steps After Verification

Once all tests pass:
1. ✅ Test authentication flow in the app
2. ✅ Test creating a session
3. ✅ Test adding transcription chunks
4. ✅ Test retrieving session history
5. ✅ Verify RLS policies work correctly (users can only see their own data)

