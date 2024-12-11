-- Create strava_tokens table
CREATE TABLE IF NOT EXISTS public.strava_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    strava_athlete_id BIGINT
);

-- Create strava_activities table
CREATE TABLE IF NOT EXISTS public.strava_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    strava_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    distance DOUBLE PRECISION NOT NULL,
    moving_time INTEGER NOT NULL,
    total_elevation_gain DOUBLE PRECISION NOT NULL,
    average_speed DOUBLE PRECISION NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    summary_polyline TEXT NOT NULL,
    elev_low DOUBLE PRECISION,
    elev_high DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id ON public.strava_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_athlete_id ON public.strava_tokens(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_user_id ON public.strava_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_strava_id ON public.strava_activities(strava_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;

-- Policies for strava_tokens
CREATE POLICY "Users can view their own tokens"
    ON public.strava_tokens FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.strava_tokens FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.strava_tokens FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.strava_tokens FOR DELETE
    USING (auth.uid()::text = user_id);

-- Policies for strava_activities
CREATE POLICY "Users can view their own activities"
    ON public.strava_activities FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own activities"
    ON public.strava_activities FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own activities"
    ON public.strava_activities FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own activities"
    ON public.strava_activities FOR DELETE
    USING (auth.uid()::text = user_id); 