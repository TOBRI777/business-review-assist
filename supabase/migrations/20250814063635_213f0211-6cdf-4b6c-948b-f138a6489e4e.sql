ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS google_location_name TEXT; -- ex: accounts/123/locations/456
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS account_id TEXT;

-- idempotence envoi
CREATE UNIQUE INDEX IF NOT EXISTS uq_sent_per_review ON public.review_replies (review_id) WHERE status='sent';