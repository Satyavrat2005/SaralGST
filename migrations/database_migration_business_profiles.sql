-- =====================================================
-- SQL Migration: Business Profiles Table for SaralGST
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create business_profiles table linked to Supabase auth.users
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name TEXT,
  trade_name TEXT,
  constitution TEXT,
  business_pan TEXT,
  email TEXT,
  phone_number TEXT,
  gstin TEXT,
  portal_username TEXT,
  portal_password TEXT,
  nature_of_business TEXT,
  hsn_codes TEXT,
  sac_codes TEXT,
  state TEXT,
  date_of_registration DATE,
  filing_frequency TEXT,
  annual_turnover_range TEXT,
  registered_address TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies - Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON public.business_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.business_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.business_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Trigger: Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.business_profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any (safe to run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Index for faster lookups
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_gstin ON public.business_profiles(gstin);
