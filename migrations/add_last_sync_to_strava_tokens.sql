-- Add last_sync column to strava_tokens table
ALTER TABLE public.strava_tokens 
ADD COLUMN IF NOT EXISTS last_sync timestamp with time zone;

-- Update the schema cache
NOTIFY pgrst, 'reload schema'; 