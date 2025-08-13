-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto-review-cron function to run every 15 minutes
SELECT cron.schedule(
  'auto-review-processing',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://ykodpjvlwdwxgcmtsmtu.supabase.co/functions/v1/auto-review-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb2RwanZsd2R3eGdjbXRzbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDgxNTEsImV4cCI6MjA3MDY4NDE1MX0.N_lXm4wxuymIlrStHIWssnTjdS7-FJfSJL698LY1iq4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);