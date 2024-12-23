--
-- This file contains the database schema for the application.
-- It is designed to be non-destructive and can be run multiple times safely.
--

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Function to add a column if it doesn't exist
--
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    _table text,
    _column text,
    _type text,
    _constraint text DEFAULT ''
)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = _table
        AND column_name = _column
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s %s',
            _table,
            _column,
            _type,
            _constraint
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

--
-- Strava Integration Tables
--
CREATE TABLE IF NOT EXISTS public.strava_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    strava_athlete_id BIGINT
);

-- Add unique constraint for strava_athlete_id if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_strava_athlete_id'
    ) THEN
        ALTER TABLE strava_tokens ADD CONSTRAINT unique_strava_athlete_id UNIQUE (strava_athlete_id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.strava_activities (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
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

--
-- User Profile Tables
--
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--
-- Routes and Waypoints Tables
--
CREATE TABLE IF NOT EXISTS public.routes (
    id TEXT PRIMARY KEY DEFAULT 'route-' || replace(cast(uuid_generate_v4() as text), '-', ''),
    name TEXT NOT NULL,
    user_id UUID NOT NULL,
    geometry JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    distance DOUBLE PRECISION DEFAULT 0,
    source TEXT DEFAULT 'manual',
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.waypoints (
    id TEXT PRIMARY KEY DEFAULT 'waypoint-' || replace(cast(uuid_generate_v4() as text), '-', ''),
    name TEXT NOT NULL,
    user_id UUID NOT NULL,
    geometry JSONB NOT NULL,
    coordinates JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

--
-- Indexes
--
CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id ON public.strava_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_athlete_id ON public.strava_tokens(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_user_id ON public.strava_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_strava_id ON public.strava_activities(strava_id);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON public.routes(user_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_user_id ON public.waypoints(user_id);

--
-- Enable Row Level Security (RLS)
--
DO $$ BEGIN
    -- Strava
    ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;
    
    -- User Profiles
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Routes and Waypoints
    ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.waypoints ENABLE ROW LEVEL SECURITY;
END $$;

--
-- RLS Policies
--
-- Strava Tokens Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own tokens" ON public.strava_tokens;
    DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.strava_tokens;
    DROP POLICY IF EXISTS "Users can update their own tokens" ON public.strava_tokens;
    DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.strava_tokens;

    CREATE POLICY "Users can view their own tokens" ON public.strava_tokens FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own tokens" ON public.strava_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own tokens" ON public.strava_tokens FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own tokens" ON public.strava_tokens FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Strava Activities Policies
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

-- Profile Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

    CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
END $$;

-- Routes Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own routes" ON public.routes;
    DROP POLICY IF EXISTS "Users can insert their own routes" ON public.routes;
    DROP POLICY IF EXISTS "Users can update their own routes" ON public.routes;
    DROP POLICY IF EXISTS "Users can delete their own routes" ON public.routes;

    CREATE POLICY "Users can view their own routes" ON public.routes FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own routes" ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own routes" ON public.routes FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own routes" ON public.routes FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Waypoints Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own waypoints" ON public.waypoints;
    DROP POLICY IF EXISTS "Users can insert their own waypoints" ON public.waypoints;
    DROP POLICY IF EXISTS "Users can update their own waypoints" ON public.waypoints;
    DROP POLICY IF EXISTS "Users can delete their own waypoints" ON public.waypoints;

    CREATE POLICY "Users can view their own waypoints" ON public.waypoints FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own waypoints" ON public.waypoints FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own waypoints" ON public.waypoints FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own waypoints" ON public.waypoints FOR DELETE USING (auth.uid() = user_id);
END $$;

--
-- Triggers
--
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Add comments column to routes table
SELECT add_column_if_not_exists(
    'routes',
    'comments',
    'TEXT',
    'DEFAULT NULL'
);

-- Add comments column to waypoints table
SELECT add_column_if_not_exists(
    'waypoints',
    'comments',
    'TEXT',
    'DEFAULT NULL'
);
  