# Supabase Setup Guide for Bolt Mobile

This guide will walk you through setting up Supabase for the Bolt mobile app, including database schema, authentication, and security policies.

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Database Schema](#2-database-schema)
3. [Authentication Setup](#3-authentication-setup)
4. [Row Level Security](#4-row-level-security)
5. [Environment Variables](#5-environment-variables)
6. [Testing Checklist](#6-testing-checklist)

---

## 1. Project Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: `bolt-mobile` (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (takes 1-2 minutes)

### Step 2: Get Your Project Credentials

1. Once your project is ready, go to **Settings** → **API**
2. You'll need these values:
   - **Project URL**: Found under "Project URL"
   - **anon/public key**: Found under "Project API keys" → "anon public"
3. Copy these values - you'll need them for your `.env.local` file

---

## 2. Database Schema

### Step 1: Open SQL Editor

1. In your Supabase dashboard, go to **SQL Editor** in the left sidebar
2. Click "New query"

### Step 2: Create Tables

Copy and paste the following SQL into the SQL Editor and click "Run":

```sql
-- Create sessions table
CREATE TABLE sessions (
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
CREATE TABLE transcription_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  transcript_text TEXT NOT NULL,
  duration_ms BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_chunks_session_id ON transcription_chunks(session_id);
CREATE INDEX idx_chunks_chunk_index ON transcription_chunks(session_id, chunk_index);
```

### Step 3: Create Database Functions

Run this SQL to create the helper function for getting full transcripts:

```sql
-- Function to get full transcript
CREATE OR REPLACE FUNCTION get_full_transcript(session_uuid UUID)
RETURNS TEXT AS $$
  SELECT string_agg(transcript_text, ' ' ORDER BY chunk_index)
  FROM transcription_chunks
  WHERE session_id = session_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;
```

### Step 4: Create Trigger for Updated At

Run this SQL to automatically update the `updated_at` timestamp:

```sql
-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_updated_at();
```

---

## 3. Authentication Setup

### Step 1: Enable Email Authentication

1. Go to **Authentication** → **Providers** in the Supabase dashboard
2. Find **Email** in the list
3. Make sure it's **enabled**
4. Configure settings:
   - **Enable email confirmations**: Optional (recommended for production)
   - **Secure email change**: Enable this for better security

### Step 2: Configure Google OAuth (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to enable it
4. You'll need to set up a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - For development: `exp://192.168.0.100:8081` (update with your Expo URL)
     - For production: Your app's deep link URL
   - Copy the **Client ID** and **Client Secret**
5. Back in Supabase, paste:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
6. Click "Save"

### Step 3: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `exp://192.168.0.100:8081` (for development)
   - **Redirect URLs**: Add the same URL plus any production URLs

---

## 4. Row Level Security

### Step 1: Enable RLS

Run this SQL in the SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_chunks ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Security Policies

Run this SQL to create policies that allow users to only access their own data:

```sql
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
```

### Step 3: Verify Policies

1. Go to **Authentication** → **Policies** in the Supabase dashboard
2. You should see policies for both `sessions` and `transcription_chunks` tables
3. Verify that all policies are enabled (green toggle)

---

## 5. Environment Variables

### Step 1: Update .env.local

Open your `.env.local` file in the project root and add:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Replace:

- `your-project-id` with your actual Supabase project ID
- `your-anon-key-here` with your actual anon/public key from Step 2 of Project Setup

### Step 2: Verify Configuration

1. Make sure `app.config.js` is reading from `.env.local` (it should already be configured)
2. Restart your Expo development server after adding the variables:
   ```bash
   npx expo start
   ```

---

## 6. Testing Checklist

### Database Tests

1. **Verify Tables Exist**

   - Go to **Table Editor** in Supabase dashboard
   - You should see `sessions` and `transcription_chunks` tables
   - Check that all columns are present

2. **Test RLS Policies**

   - Create a test user account in the app
   - Try to create a session
   - Verify the session appears in the Table Editor with the correct `user_id`
   - Try accessing another user's data (should be blocked by RLS)

3. **Test Database Function**
   - In SQL Editor, run:
     ```sql
     -- Replace with an actual session ID from your test
     SELECT get_full_transcript('your-session-id-here');
     ```
   - Should return concatenated transcript text

### Authentication Tests

1. **Email/Password Sign Up**

   - Open the app
   - Navigate to Sign Up screen
   - Create a new account with email and password
   - Verify you receive a confirmation email (if enabled)
   - Sign in with the new credentials

2. **Email/Password Sign In**

   - Sign out of the app
   - Sign in with existing credentials
   - Verify you're redirected to the main app

3. **Google OAuth** (if configured)

   - Sign out of the app
   - Click "Continue with Google"
   - Complete Google authentication
   - Verify you're signed in and redirected to the main app

4. **Session Persistence**
   - Sign in to the app
   - Close the app completely
   - Reopen the app
   - Verify you're still signed in (no login screen)

### App Functionality Tests

1. **Create Session**

   - Go to Record or Live screen
   - Click "New Session"
   - Verify session indicator shows the new session
   - Check Supabase Table Editor to see the session was created

2. **Save Transcription**

   - Start a recording
   - Stop and transcribe
   - Verify the transcript is saved to the current session
   - Check `transcription_chunks` table in Supabase

3. **View History**

   - Go to History tab
   - Verify your sessions appear in the list
   - Tap on a session to view details
   - Verify full transcript is displayed

4. **Delete Session**
   - In Session Detail screen
   - Click "Delete Session"
   - Confirm deletion
   - Verify session is removed from history
   - Check Supabase to verify session and chunks are deleted

---

## Troubleshooting

### Common Issues

1. **"User not authenticated" errors**

   - Check that RLS policies are enabled
   - Verify the user is actually signed in
   - Check Supabase logs in **Logs** → **Postgres Logs**

2. **Google OAuth not working**

   - Verify redirect URLs match exactly
   - Check that Google OAuth credentials are correct
   - Ensure the OAuth consent screen is configured in Google Cloud Console

3. **RLS blocking legitimate requests**

   - Verify policies use `auth.uid() = user_id` correctly
   - Check that `user_id` is being set correctly when creating sessions
   - Review Supabase logs for policy violations

4. **Database function errors**
   - Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'get_full_transcript';`
   - Check function permissions: `SECURITY DEFINER` should be set

### Getting Help

- Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Review Supabase logs in the dashboard
- Check the app's console logs for detailed error messages

---

## Next Steps

After completing this setup:

1. Test all functionality in the app
2. Consider setting up backups for your database
3. Configure email templates for a better user experience
4. Set up monitoring and alerts in Supabase dashboard
5. For production, configure custom domain and SSL

---

## Security Notes

- Never commit `.env.local` to version control (it's already in `.gitignore`)
- The `anon` key is safe to use in client-side code (RLS protects your data)
- For server-side operations, use the `service_role` key (keep this secret!)
- Regularly review and update RLS policies as your app evolves
- Enable email confirmations in production for better security
