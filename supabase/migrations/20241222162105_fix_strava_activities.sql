-- Ensure all required columns exist with proper types
ALTER TABLE strava_activities
ADD COLUMN IF NOT EXISTS max_speed DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS start_latlng NUMERIC[] DEFAULT ARRAY[]::NUMERIC[],
ADD COLUMN IF NOT EXISTS end_latlng NUMERIC[] DEFAULT ARRAY[]::NUMERIC[],
ADD COLUMN IF NOT EXISTS geometry JSONB,
ADD COLUMN IF NOT EXISTS bounds NUMERIC[][] DEFAULT ARRAY[]::NUMERIC[][];

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_strava_activities_strava_id ON public.strava_activities(strava_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_user_id ON public.strava_activities(user_id);

-- Ensure RLS policies are in place
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own activities" ON public.strava_activities;
    DROP POLICY IF EXISTS "Users can insert their own activities" ON public.strava_activities;
    DROP POLICY IF EXISTS "Users can update their own activities" ON public.strava_activities;
    DROP POLICY IF EXISTS "Users can delete their own activities" ON public.strava_activities;

    CREATE POLICY "Users can view their own activities" ON public.strava_activities FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own activities" ON public.strava_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own activities" ON public.strava_activities FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own activities" ON public.strava_activities FOR DELETE USING (auth.uid() = user_id);
END $$; 