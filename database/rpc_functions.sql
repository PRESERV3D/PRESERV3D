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

/*
  RPC function: update_account_status_non_visitors
  Purpose: Update account_status for non-visitor user tables only (registered_admins, registered_users, registered_faculty).
  Reason: Exclude `approved_visitors` because visitor lifecycle is managed separately by visitor registration workflows.
*/
CREATE OR REPLACE FUNCTION public.update_account_status_non_visitors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins
  UPDATE public.registered_admins ra
  SET account_status = CASE
    -- If auth.users shows no recent sign-in, but there is a login record within 30 days, consider Active
    WHEN (au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days'))
         AND NOT EXISTS (
           SELECT 1 FROM public.logins l WHERE l.user_id = ra.id AND l.login_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
         ) THEN 'Inactive'
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

  -- Students (registered_users)
  UPDATE public.registered_users ru
  SET account_status = CASE
    WHEN (au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days'))
         AND NOT EXISTS (
           SELECT 1 FROM public.logins l WHERE l.user_id = ru.id AND l.login_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
         ) THEN 'Inactive'
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

  -- Faculty
  UPDATE public.registered_faculty rf
  SET account_status = CASE
    WHEN (au.last_sign_in_at IS NULL OR au.last_sign_in_at < (CURRENT_TIMESTAMP - INTERVAL '30 days'))
         AND NOT EXISTS (
           SELECT 1 FROM public.logins l WHERE l.user_id = rf.id AND l.login_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
         ) THEN 'Inactive'
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

GRANT EXECUTE ON FUNCTION public.update_account_status_non_visitors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_account_status_non_visitors() TO anon;
GRANT EXECUTE ON FUNCTION public.update_account_status_non_visitors() TO service_role;

COMMENT ON FUNCTION public.update_account_status_non_visitors() IS 'Updates account_status for admins, students, and faculty only. Excludes approved_visitors.';

-- Trigger function: call the non-visitor account status updater after new login records
CREATE OR REPLACE FUNCTION public.trigger_update_account_status_non_visitors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := NEW.user_id;
  recent_threshold timestamp := (CURRENT_TIMESTAMP - INTERVAL '30 days');
BEGIN
  -- Lightweight per-user update: mark the user Active if they have a recent login (the NEW row)
  -- Admins
  UPDATE public.registered_admins
  SET account_status = 'Active'
  WHERE id = uid
    AND account_status IS DISTINCT FROM 'Active';

  -- Students (registered_users)
  UPDATE public.registered_users
  SET account_status = 'Active'
  WHERE id = uid
    AND account_status IS DISTINCT FROM 'Active';

  -- Faculty
  UPDATE public.registered_faculty
  SET account_status = 'Active'
  WHERE id = uid
    AND account_status IS DISTINCT FROM 'Active';

  -- If you want to also set Inactive for stale users, keep the heavier RPC and call it periodically via scheduler.
  RETURN NEW;
END;
$$;

-- Create trigger: run after INSERT on public.logins
DROP TRIGGER IF EXISTS logins_after_insert_update_account_status ON public.logins;
CREATE TRIGGER logins_after_insert_update_account_status
AFTER INSERT ON public.logins
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_account_status_non_visitors();

COMMENT ON FUNCTION public.trigger_update_account_status_non_visitors() IS 'Trigger wrapper that runs update_account_status_non_visitors() after login inserts.';
