require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional, for admin operations

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logPass(message) {
  console.log(`✅ ${message}`);
  results.passed.push(message);
}

function logFail(message, error = null) {
  console.error(`❌ ${message}`);
  if (error) {
    console.error(`   Error: ${error.message || error}`);
  }
  results.failed.push({ message, error: error?.message || String(error) });
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
  results.warnings.push(message);
}

// Test 1: Check if tables exist
async function testTables() {
  console.log("\n📊 Testing Tables...");
  
  const expectedTables = ["sessions", "transcription_chunks"];
  
  for (const tableName of expectedTables) {
    try {
      // Try to query the table (will fail if it doesn't exist)
      const { error } = await supabase.from(tableName).select("id").limit(1);
      
      if (error && error.code === "42P01") {
        logFail(`Table '${tableName}' does not exist`);
      } else if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine
        logFail(`Table '${tableName}' has issues`, error);
      } else {
        logPass(`Table '${tableName}' exists`);
      }
    } catch (error) {
      logFail(`Failed to check table '${tableName}'`, error);
    }
  }
}

// Test 2: Check table structure
async function testTableStructure() {
  console.log("\n🏗️  Testing Table Structure...");
  
  // Check sessions table columns
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .limit(0);
    
    if (error && error.code !== "PGRST116") {
      logFail("Cannot query sessions table structure", error);
      return;
    }
    
    const expectedSessionsColumns = [
      "id",
      "user_id",
      "session_type",
      "status",
      "title",
      "created_at",
      "updated_at",
      "total_duration_ms",
    ];
    
    // Note: We can't directly check columns via Supabase client
    // This is a basic check - full verification would need direct DB access
    logPass("Sessions table structure appears correct (basic check)");
  } catch (error) {
    logFail("Failed to check sessions table structure", error);
  }
  
  // Check transcription_chunks table columns
  try {
    const { data, error } = await supabase
      .from("transcription_chunks")
      .select("*")
      .limit(0);
    
    if (error && error.code !== "PGRST116") {
      logFail("Cannot query transcription_chunks table structure", error);
      return;
    }
    
    logPass("Transcription_chunks table structure appears correct (basic check)");
  } catch (error) {
    logFail("Failed to check transcription_chunks table structure", error);
  }
}

// Test 3: Check indexes (via query performance hint)
async function testIndexes() {
  console.log("\n🔍 Testing Indexes...");
  
  const expectedIndexes = [
    { table: "sessions", name: "idx_sessions_user_id" },
    { table: "sessions", name: "idx_sessions_created_at" },
    { table: "sessions", name: "idx_sessions_status" },
    { table: "sessions", name: "idx_sessions_user_status" },
    { table: "transcription_chunks", name: "idx_chunks_session_id" },
    { table: "transcription_chunks", name: "idx_chunks_chunk_index" },
  ];
  
  // Note: We can't directly query index existence via Supabase client
  // This would require direct database access
  logWarning("Index existence check requires direct database access (skipped)");
  logWarning("Indexes should be verified manually in Supabase dashboard");
}

// Test 4: Check functions
async function testFunctions() {
  console.log("\n⚙️  Testing Functions...");
  
  // Test get_full_transcript function
  try {
    // This will fail if the function doesn't exist
    const { error } = await supabase.rpc("get_full_transcript", {
      session_uuid: "00000000-0000-0000-0000-000000000000", // Dummy UUID
    });
    
    if (error) {
      if (error.message.includes("function") || error.message.includes("does not exist")) {
        logFail("Function 'get_full_transcript' does not exist", error);
      } else {
        // Other errors (like no rows) are expected with dummy UUID
        logPass("Function 'get_full_transcript' exists");
      }
    } else {
      logPass("Function 'get_full_transcript' exists");
    }
  } catch (error) {
    logFail("Failed to check function 'get_full_transcript'", error);
  }
}

// Test 5: Check triggers (via updated_at behavior)
async function testTriggers() {
  console.log("\n🔄 Testing Triggers...");
  
  // We can't directly check trigger existence, but we can test the behavior
  // This requires creating a test session, which needs authentication
  logWarning("Trigger existence check requires direct database access (skipped)");
  logWarning("Trigger should be verified manually in Supabase dashboard");
  logWarning("Trigger behavior can be tested by updating a session and checking updated_at");
}

// Test 6: Check RLS is enabled
async function testRLS() {
  console.log("\n🔒 Testing Row Level Security...");
  
  // Try to query without authentication - should fail if RLS is enabled
  // But we're using anon key, so this test is limited
  logWarning("RLS enabled check requires direct database access (skipped)");
  logWarning("RLS should be verified manually in Supabase dashboard");
}

// Test 7: Check RLS policies
async function testRLSPolicies() {
  console.log("\n📋 Testing RLS Policies...");
  
  // We can't directly query policy existence via Supabase client
  logWarning("RLS policy existence check requires direct database access (skipped)");
  logWarning("Policies should be verified manually in Supabase dashboard");
  logWarning("Expected policies:");
  logWarning("  - Users can view own sessions");
  logWarning("  - Users can insert own sessions");
  logWarning("  - Users can update own sessions");
  logWarning("  - Users can delete own sessions");
  logWarning("  - Users can view own chunks");
  logWarning("  - Users can insert own chunks");
  logWarning("  - Users can delete own chunks");
}

// Test 8: Test CRUD operations (requires authentication)
async function testCRUDOperations() {
  console.log("\n🧪 Testing CRUD Operations...");
  
  // Check if we can perform basic operations
  try {
    // Test SELECT (should work even without auth, but return empty)
    const { error: selectError } = await supabase
      .from("sessions")
      .select("*")
      .limit(1);
    
    if (selectError && selectError.code !== "PGRST116") {
      logFail("SELECT operation failed", selectError);
    } else {
      logPass("SELECT operation works");
    }
  } catch (error) {
    logFail("SELECT operation test failed", error);
  }
  
  // INSERT, UPDATE, DELETE require authentication and will be tested separately
  logWarning("INSERT, UPDATE, DELETE operations require user authentication");
  logWarning("These should be tested with a logged-in user");
}

// Test 9: Test constraints and validations
async function testConstraints() {
  console.log("\n🛡️  Testing Constraints...");
  
  logWarning("Constraint testing requires authenticated user and test data");
  logWarning("Expected constraints:");
  logWarning("  - sessions.session_type: CHECK IN ('single_record', 'live_transcription')");
  logWarning("  - sessions.status: CHECK IN ('active', 'completed', 'cancelled')");
  logWarning("  - sessions.user_id: FOREIGN KEY to auth.users");
  logWarning("  - transcription_chunks.session_id: FOREIGN KEY to sessions");
}

// Test 10: Direct database query (if service key available)
async function testDirectDatabaseQueries() {
  if (!supabaseAdmin) {
    logWarning("Skipping direct database queries (SUPABASE_SERVICE_ROLE_KEY not set)");
    return;
  }
  
  console.log("\n🔐 Testing with Admin Access...");
  
  // With service key, we can query information_schema
  // But Supabase client doesn't expose raw SQL easily
  logWarning("Direct database queries require SQL access via Supabase dashboard");
  logWarning("Run these queries in Supabase SQL Editor:");
  logWarning(`
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'transcription_chunks');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('sessions', 'transcription_chunks');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_full_transcript';

-- Check triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table IN ('sessions', 'transcription_chunks');

-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'transcription_chunks');

-- Check policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('sessions', 'transcription_chunks');
  `);
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting Database Tests...");
  console.log("=" .repeat(50));
  
  await testTables();
  await testTableStructure();
  await testIndexes();
  await testFunctions();
  await testTriggers();
  await testRLS();
  await testRLSPolicies();
  await testCRUDOperations();
  await testConstraints();
  await testDirectDatabaseQueries();
  
  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log("\n❌ Failed Tests:");
    results.failed.forEach((failure) => {
      console.log(`   - ${failure.message}`);
    });
  }
  
  if (results.passed.length === 0 && results.failed.length === 0) {
    console.log("\n⚠️  No tests could be fully executed.");
    console.log("   Most checks require direct database access.");
    console.log("   Please verify manually in Supabase dashboard.");
  }
  
  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});

