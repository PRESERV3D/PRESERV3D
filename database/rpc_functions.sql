CREATE OR REPLACE FUNCTION public.update_account_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.approved_visitors av
  SET account_status = CASE
    WHEN au.email_confirmed_at IS NULL THEN 'Pending Confirmation'
    WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
    WHEN av.end_date < CURRENT_DATE THEN 'Expired'
    WHEN av.start_date > CURRENT_DATE THEN 'Not Started'
    WHEN CURRENT_DATE BETWEEN av.start_date AND av.end_date THEN 'Active'
    ELSE av.account_status
  END
  FROM auth.users au
  WHERE av.id = au.id
    AND av.account_status IS DISTINCT FROM (
      CASE
        WHEN au.email_confirmed_at IS NULL THEN 'Pending Confirmation'
        WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
        WHEN av.end_date < CURRENT_DATE THEN 'Expired'
        WHEN av.start_date > CURRENT_DATE THEN 'Not Started'
        WHEN CURRENT_DATE BETWEEN av.start_date AND av.end_date THEN 'Active'
        ELSE av.account_status
      END
    );

  UPDATE public.registered_admins ra
  SET account_status = CASE
    WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
    ELSE 'Active'
  END
  FROM auth.users au
  WHERE ra.id = au.id
    AND ra.account_status IS DISTINCT FROM (
      CASE
        WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
        ELSE 'Active'
      END
    );

  UPDATE public.registered_users ru
  SET account_status = CASE
    WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
    ELSE 'Active'
  END
  FROM auth.users au
  WHERE ru.id = au.id
    AND ru.account_status IS DISTINCT FROM (
      CASE
        WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
        ELSE 'Active'
      END
    );

  UPDATE public.registered_faculty rf
  SET account_status = CASE
    WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
    ELSE 'Active'
  END
  FROM auth.users au
  WHERE rf.id = au.id
    AND rf.account_status IS DISTINCT FROM (
      CASE
        WHEN au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Inactive'
        ELSE 'Active'
      END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_account_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_account_status() TO anon;
GRANT EXECUTE ON FUNCTION public.update_account_status() TO service_role;

COMMENT ON FUNCTION public.update_account_status() IS 'Updates account_status for all user types (visitors, admins, students, faculty) based on login activity and date ranges. Runs with elevated privileges to access auth.users table.';
