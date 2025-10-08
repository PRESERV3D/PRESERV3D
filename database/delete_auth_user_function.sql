-- Function to delete auth user and all related records
-- This bypasses foreign key constraints by deleting in the correct order
-- Run this in Supabase SQL Editor as a super admin

-- Drop old version first
DROP FUNCTION IF EXISTS public.delete_auth_user(UUID);

-- Create function that accepts TEXT and casts to UUID internally
CREATE OR REPLACE FUNCTION public.delete_auth_user(uid TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Cast text parameter to UUID
  user_uuid := uid::UUID;
  
  -- Delete from auth.sessions first (child table)
  DELETE FROM auth.sessions WHERE user_id = user_uuid;

  -- Delete from auth.refresh_tokens
  DELETE FROM auth.refresh_tokens WHERE user_id = user_uuid;

  -- Delete from auth.identities
  DELETE FROM auth.identities WHERE user_id = user_uuid;

  -- Delete from auth.mfa_factors if exists
  DELETE FROM auth.mfa_factors WHERE user_id = user_uuid;

  -- Delete from auth.flow_state if exists
  DELETE FROM auth.flow_state WHERE user_id = user_uuid;

  -- Finally, delete from auth.users (parent table)
  DELETE FROM auth.users WHERE id = user_uuid;

  RAISE NOTICE 'User % deleted from auth schema', user_uuid;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_auth_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_auth_user(TEXT) TO service_role;
