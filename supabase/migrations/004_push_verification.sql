-- Pulse WiFi Push-Gated Verification Schema
-- Run this in Supabase SQL Editor

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  player_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own tokens
CREATE POLICY "Users can read own tokens"
  ON verification_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (API routes) can do anything
CREATE POLICY "Service role full access"
  ON verification_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add verification columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_at') THEN
    ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onesignal_player_id') THEN
    ALTER TABLE profiles ADD COLUMN onesignal_player_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'push_enabled') THEN
    ALTER TABLE profiles ADD COLUMN push_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create index on player_id for push notifications
CREATE INDEX IF NOT EXISTS idx_profiles_onesignal_player_id ON profiles(onesignal_player_id);

-- Cleanup expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
