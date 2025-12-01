-- Enable pg_cron (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotent scheduling: replace existing job with the same name
DO $$
DECLARE
  jid int;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'webrtc_signaling_cleanup';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;

  -- Run every 2 minutes; adjust as needed (e.g., '*/1 * * * *')
  PERFORM cron.schedule(
    'webrtc_signaling_cleanup',
    '*/2 * * * *',
    $$SELECT public.delete_expired_signaling();$$
  );
END;
$$;

COMMENT ON EXTENSION pg_cron IS 'Schedules background jobs for periodic maintenance tasks.';
