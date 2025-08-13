-- Add OAuth integration for Google My Business
-- Remove encrypted API keys, add OAuth tokens storage

-- Drop the old google_api_key_encrypted column
ALTER TABLE user_settings DROP COLUMN IF EXISTS google_api_key_encrypted;

-- Add OAuth fields to user_settings
ALTER TABLE user_settings ADD COLUMN google_oauth_access_token_encrypted text;
ALTER TABLE user_settings ADD COLUMN google_oauth_refresh_token_encrypted text;
ALTER TABLE user_settings ADD COLUMN google_oauth_token_expiry timestamp with time zone;
ALTER TABLE user_settings ADD COLUMN google_oauth_scope text;
ALTER TABLE user_settings ADD COLUMN google_connected_email text;
ALTER TABLE user_settings ADD COLUMN google_connected_at timestamp with time zone;