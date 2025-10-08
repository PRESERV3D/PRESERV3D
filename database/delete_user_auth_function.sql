-- NEW function with different name to avoid caching issues
-- Function to delete auth user and all related records
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_user_auth(user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
BEGIN
  -- Cast text to UUID
  uid := user_id::UUID;

  -- Delete from auth tables in correct order
  DELETE FROM auth.sessions WHERE auth.sessions.user_id = uid;
  DELETE FROM auth.refresh_tokens WHERE auth.refresh_tokens.user_id = uid;
  DELETE FROM auth.identities WHERE auth.identities.user_id = uid;
  DELETE FROM auth.mfa_factors WHERE auth.mfa_factors.user_id = uid;
  DELETE FROM auth.flow_state WHERE auth.flow_state.user_id = uid;
  DELETE FROM auth.users WHERE auth.users.id = uid;

  RAISE NOTICE 'Auth user % deleted successfully', uid;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.delete_user_auth(TEXT) TO service_role;
