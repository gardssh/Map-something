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

-- Add unique constraint for strava_athlete_id
ALTER TABLE strava_tokens ADD CONSTRAINT unique_strava_athlete_id UNIQUE (strava_athlete_id);

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

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create a function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', '')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create profiles for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 