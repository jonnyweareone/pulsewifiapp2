-- ===========================================
-- SONIQ Wave Database Schema
-- ===========================================
-- Run this migration in the Supabase SQL Editor
-- or via the Supabase CLI: supabase db push

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Table: devices
-- ===========================================
-- Tracks devices that users have registered for WiFi access
-- This table can be used for device management and tracking last connection times

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT,
    device_type TEXT, -- e.g., 'iphone', 'android', 'macbook', 'windows'
    passpoint_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);

-- RLS Policies for devices table
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Users can only see their own devices
CREATE POLICY "Users can view own devices" ON public.devices
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert own devices" ON public.devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices" ON public.devices
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete own devices" ON public.devices
    FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- Table: radius_identities
-- ===========================================
-- Stores RADIUS authentication credentials for each user
-- These credentials will be synced to FreeRADIUS or other RADIUS backend
--
-- IMPORTANT: In production, the 'secret' column should be properly hashed
-- or the sync process should handle secure credential storage

CREATE TABLE IF NOT EXISTS public.radius_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    secret TEXT NOT NULL, -- In production, hash this or handle securely
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by username (used by RADIUS authentication)
CREATE INDEX IF NOT EXISTS idx_radius_identities_username ON public.radius_identities(username);

-- RLS Policies for radius_identities table
ALTER TABLE public.radius_identities ENABLE ROW LEVEL SECURITY;

-- Users can only view their own RADIUS identity
CREATE POLICY "Users can view own radius identity" ON public.radius_identities
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all identities (for RADIUS sync)
-- Note: Service role bypasses RLS by default

-- ===========================================
-- Table: wifi_profiles
-- ===========================================
-- Tracks WiFi configuration profiles generated for users
-- Useful for audit trail and analytics

CREATE TABLE IF NOT EXISTS public.wifi_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_type TEXT NOT NULL CHECK (profile_type IN ('ios', 'android', 'manual')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_downloaded_at TIMESTAMPTZ
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_wifi_profiles_user_id ON public.wifi_profiles(user_id);

-- RLS Policies for wifi_profiles table
ALTER TABLE public.wifi_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profiles
CREATE POLICY "Users can view own wifi profiles" ON public.wifi_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profiles
CREATE POLICY "Users can insert own wifi profiles" ON public.wifi_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Users can update own wifi profiles" ON public.wifi_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- Optional: User profiles table
-- ===========================================
-- Extends auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- Comments for documentation
-- ===========================================

COMMENT ON TABLE public.devices IS 'User devices registered for SONIQ Wave WiFi access';
COMMENT ON TABLE public.radius_identities IS 'RADIUS authentication credentials - sync to FreeRADIUS backend';
COMMENT ON TABLE public.wifi_profiles IS 'Audit trail of generated WiFi configuration profiles';
COMMENT ON TABLE public.profiles IS 'Extended user profile information';

COMMENT ON COLUMN public.radius_identities.username IS 'Unique username for RADIUS auth, format: user_<userid_short>';
COMMENT ON COLUMN public.radius_identities.secret IS 'Password for RADIUS auth - sync to RADIUS backend securely';
