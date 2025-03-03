create table "public"."profiles" (
    "id" uuid not null,
    "first_name" text not null,
    "last_name" text not null,
    "avatar_url" text,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."profiles" enable row level security;

create table "public"."route_comments" (
    "id" uuid not null default uuid_generate_v4(),
    "route_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."route_comments" enable row level security;

create table "public"."routes" (
    "id" text not null default ('route-'::text || replace((uuid_generate_v4())::text, '-'::text, ''::text)),
    "name" text not null,
    "user_id" uuid not null,
    "geometry" jsonb not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "distance" double precision default 0,
    "source" text default 'manual'::text,
    "comments" text
);


alter table "public"."routes" enable row level security;

create table "public"."strava_activities" (
    "id" text not null,
    "user_id" uuid,
    "strava_id" bigint not null,
    "name" text not null,
    "type" text not null,
    "sport_type" text not null,
    "distance" double precision not null,
    "moving_time" integer not null,
    "total_elevation_gain" double precision not null,
    "average_speed" double precision not null,
    "start_date" timestamp with time zone not null,
    "summary_polyline" text not null,
    "elev_low" double precision,
    "elev_high" double precision,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "selected" boolean default false,
    "visible" boolean default true,
    "elevation_data" jsonb,
    "properties" jsonb,
    "source_id" text,
    "layer_id" text,
    "is_hovered" boolean default false,
    "feature" jsonb,
    "geometry" jsonb,
    "average_heartrate" double precision,
    "max_heartrate" double precision,
    "max_speed" double precision,
    "start_latlng" numeric[] default ARRAY[]::numeric[],
    "end_latlng" numeric[] default ARRAY[]::numeric[],
    "coordinates" numeric[] default ARRAY[]::numeric[],
    "bounds" numeric[] default ARRAY[]::numeric[]
);


alter table "public"."strava_activities" enable row level security;

create table "public"."strava_tokens" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "access_token" text not null,
    "refresh_token" text not null,
    "expires_at" bigint not null,
    "strava_athlete_id" bigint,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_sync" timestamp with time zone
);


alter table "public"."strava_tokens" enable row level security;

create table "public"."waypoint_comments" (
    "id" uuid not null default uuid_generate_v4(),
    "waypoint_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."waypoint_comments" enable row level security;

create table "public"."waypoints" (
    "id" text not null default ('waypoint-'::text || replace((uuid_generate_v4())::text, '-'::text, ''::text)),
    "name" text not null,
    "user_id" uuid not null,
    "geometry" jsonb not null,
    "coordinates" jsonb not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "description" text,
    "comments" text
);


alter table "public"."waypoints" enable row level security;

CREATE INDEX idx_route_comments_route_id ON public.route_comments USING btree (route_id);

CREATE INDEX idx_route_comments_user_id ON public.route_comments USING btree (user_id);

CREATE INDEX idx_routes_user_id ON public.routes USING btree (user_id);

CREATE INDEX idx_strava_activities_strava_id ON public.strava_activities USING btree (strava_id);

CREATE INDEX idx_strava_activities_user_id ON public.strava_activities USING btree (user_id);

CREATE INDEX idx_strava_tokens_athlete_id ON public.strava_tokens USING btree (strava_athlete_id);

CREATE INDEX idx_strava_tokens_user_id ON public.strava_tokens USING btree (user_id);

CREATE INDEX idx_waypoint_comments_user_id ON public.waypoint_comments USING btree (user_id);

CREATE INDEX idx_waypoint_comments_waypoint_id ON public.waypoint_comments USING btree (waypoint_id);

CREATE INDEX idx_waypoints_user_id ON public.waypoints USING btree (user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX route_comments_pkey ON public.route_comments USING btree (id);

CREATE UNIQUE INDEX routes_pkey ON public.routes USING btree (id);

CREATE UNIQUE INDEX strava_activities_pkey ON public.strava_activities USING btree (id);

CREATE UNIQUE INDEX strava_activities_strava_id_key ON public.strava_activities USING btree (strava_id);

CREATE UNIQUE INDEX strava_tokens_pkey ON public.strava_tokens USING btree (id);

CREATE UNIQUE INDEX strava_tokens_strava_athlete_id_key ON public.strava_tokens USING btree (strava_athlete_id);

CREATE UNIQUE INDEX strava_tokens_user_id_key ON public.strava_tokens USING btree (user_id);

CREATE UNIQUE INDEX unique_strava_athlete_id ON public.strava_tokens USING btree (strava_athlete_id);

CREATE UNIQUE INDEX waypoint_comments_pkey ON public.waypoint_comments USING btree (id);

CREATE UNIQUE INDEX waypoints_pkey ON public.waypoints USING btree (id);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."route_comments" add constraint "route_comments_pkey" PRIMARY KEY using index "route_comments_pkey";

alter table "public"."routes" add constraint "routes_pkey" PRIMARY KEY using index "routes_pkey";

alter table "public"."strava_activities" add constraint "strava_activities_pkey" PRIMARY KEY using index "strava_activities_pkey";

alter table "public"."strava_tokens" add constraint "strava_tokens_pkey" PRIMARY KEY using index "strava_tokens_pkey";

alter table "public"."waypoint_comments" add constraint "waypoint_comments_pkey" PRIMARY KEY using index "waypoint_comments_pkey";

alter table "public"."waypoints" add constraint "waypoints_pkey" PRIMARY KEY using index "waypoints_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."route_comments" add constraint "route_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."route_comments" validate constraint "route_comments_user_id_fkey";

alter table "public"."routes" add constraint "routes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."routes" validate constraint "routes_user_id_fkey";

alter table "public"."strava_activities" add constraint "strava_activities_strava_id_key" UNIQUE using index "strava_activities_strava_id_key";

alter table "public"."strava_activities" add constraint "strava_activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."strava_activities" validate constraint "strava_activities_user_id_fkey";

alter table "public"."strava_tokens" add constraint "strava_tokens_strava_athlete_id_key" UNIQUE using index "strava_tokens_strava_athlete_id_key";

alter table "public"."strava_tokens" add constraint "strava_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."strava_tokens" validate constraint "strava_tokens_user_id_fkey";

alter table "public"."strava_tokens" add constraint "strava_tokens_user_id_key" UNIQUE using index "strava_tokens_user_id_key";

alter table "public"."strava_tokens" add constraint "unique_strava_athlete_id" UNIQUE using index "unique_strava_athlete_id";

alter table "public"."waypoint_comments" add constraint "waypoint_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."waypoint_comments" validate constraint "waypoint_comments_user_id_fkey";

alter table "public"."waypoints" add constraint "waypoints_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."waypoints" validate constraint "waypoints_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(_table text, _column text, _type text, _constraint text DEFAULT ''::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', '')
    );
    RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."route_comments" to "anon";

grant insert on table "public"."route_comments" to "anon";

grant references on table "public"."route_comments" to "anon";

grant select on table "public"."route_comments" to "anon";

grant trigger on table "public"."route_comments" to "anon";

grant truncate on table "public"."route_comments" to "anon";

grant update on table "public"."route_comments" to "anon";

grant delete on table "public"."route_comments" to "authenticated";

grant insert on table "public"."route_comments" to "authenticated";

grant references on table "public"."route_comments" to "authenticated";

grant select on table "public"."route_comments" to "authenticated";

grant trigger on table "public"."route_comments" to "authenticated";

grant truncate on table "public"."route_comments" to "authenticated";

grant update on table "public"."route_comments" to "authenticated";

grant delete on table "public"."route_comments" to "service_role";

grant insert on table "public"."route_comments" to "service_role";

grant references on table "public"."route_comments" to "service_role";

grant select on table "public"."route_comments" to "service_role";

grant trigger on table "public"."route_comments" to "service_role";

grant truncate on table "public"."route_comments" to "service_role";

grant update on table "public"."route_comments" to "service_role";

grant delete on table "public"."routes" to "anon";

grant insert on table "public"."routes" to "anon";

grant references on table "public"."routes" to "anon";

grant select on table "public"."routes" to "anon";

grant trigger on table "public"."routes" to "anon";

grant truncate on table "public"."routes" to "anon";

grant update on table "public"."routes" to "anon";

grant delete on table "public"."routes" to "authenticated";

grant insert on table "public"."routes" to "authenticated";

grant references on table "public"."routes" to "authenticated";

grant select on table "public"."routes" to "authenticated";

grant trigger on table "public"."routes" to "authenticated";

grant truncate on table "public"."routes" to "authenticated";

grant update on table "public"."routes" to "authenticated";

grant delete on table "public"."routes" to "service_role";

grant insert on table "public"."routes" to "service_role";

grant references on table "public"."routes" to "service_role";

grant select on table "public"."routes" to "service_role";

grant trigger on table "public"."routes" to "service_role";

grant truncate on table "public"."routes" to "service_role";

grant update on table "public"."routes" to "service_role";

grant delete on table "public"."strava_activities" to "anon";

grant insert on table "public"."strava_activities" to "anon";

grant references on table "public"."strava_activities" to "anon";

grant select on table "public"."strava_activities" to "anon";

grant trigger on table "public"."strava_activities" to "anon";

grant truncate on table "public"."strava_activities" to "anon";

grant update on table "public"."strava_activities" to "anon";

grant delete on table "public"."strava_activities" to "authenticated";

grant insert on table "public"."strava_activities" to "authenticated";

grant references on table "public"."strava_activities" to "authenticated";

grant select on table "public"."strava_activities" to "authenticated";

grant trigger on table "public"."strava_activities" to "authenticated";

grant truncate on table "public"."strava_activities" to "authenticated";

grant update on table "public"."strava_activities" to "authenticated";

grant delete on table "public"."strava_activities" to "service_role";

grant insert on table "public"."strava_activities" to "service_role";

grant references on table "public"."strava_activities" to "service_role";

grant select on table "public"."strava_activities" to "service_role";

grant trigger on table "public"."strava_activities" to "service_role";

grant truncate on table "public"."strava_activities" to "service_role";

grant update on table "public"."strava_activities" to "service_role";

grant delete on table "public"."strava_tokens" to "anon";

grant insert on table "public"."strava_tokens" to "anon";

grant references on table "public"."strava_tokens" to "anon";

grant select on table "public"."strava_tokens" to "anon";

grant trigger on table "public"."strava_tokens" to "anon";

grant truncate on table "public"."strava_tokens" to "anon";

grant update on table "public"."strava_tokens" to "anon";

grant delete on table "public"."strava_tokens" to "authenticated";

grant insert on table "public"."strava_tokens" to "authenticated";

grant references on table "public"."strava_tokens" to "authenticated";

grant select on table "public"."strava_tokens" to "authenticated";

grant trigger on table "public"."strava_tokens" to "authenticated";

grant truncate on table "public"."strava_tokens" to "authenticated";

grant update on table "public"."strava_tokens" to "authenticated";

grant delete on table "public"."strava_tokens" to "service_role";

grant insert on table "public"."strava_tokens" to "service_role";

grant references on table "public"."strava_tokens" to "service_role";

grant select on table "public"."strava_tokens" to "service_role";

grant trigger on table "public"."strava_tokens" to "service_role";

grant truncate on table "public"."strava_tokens" to "service_role";

grant update on table "public"."strava_tokens" to "service_role";

grant delete on table "public"."waypoint_comments" to "anon";

grant insert on table "public"."waypoint_comments" to "anon";

grant references on table "public"."waypoint_comments" to "anon";

grant select on table "public"."waypoint_comments" to "anon";

grant trigger on table "public"."waypoint_comments" to "anon";

grant truncate on table "public"."waypoint_comments" to "anon";

grant update on table "public"."waypoint_comments" to "anon";

grant delete on table "public"."waypoint_comments" to "authenticated";

grant insert on table "public"."waypoint_comments" to "authenticated";

grant references on table "public"."waypoint_comments" to "authenticated";

grant select on table "public"."waypoint_comments" to "authenticated";

grant trigger on table "public"."waypoint_comments" to "authenticated";

grant truncate on table "public"."waypoint_comments" to "authenticated";

grant update on table "public"."waypoint_comments" to "authenticated";

grant delete on table "public"."waypoint_comments" to "service_role";

grant insert on table "public"."waypoint_comments" to "service_role";

grant references on table "public"."waypoint_comments" to "service_role";

grant select on table "public"."waypoint_comments" to "service_role";

grant trigger on table "public"."waypoint_comments" to "service_role";

grant truncate on table "public"."waypoint_comments" to "service_role";

grant update on table "public"."waypoint_comments" to "service_role";

grant delete on table "public"."waypoints" to "anon";

grant insert on table "public"."waypoints" to "anon";

grant references on table "public"."waypoints" to "anon";

grant select on table "public"."waypoints" to "anon";

grant trigger on table "public"."waypoints" to "anon";

grant truncate on table "public"."waypoints" to "anon";

grant update on table "public"."waypoints" to "anon";

grant delete on table "public"."waypoints" to "authenticated";

grant insert on table "public"."waypoints" to "authenticated";

grant references on table "public"."waypoints" to "authenticated";

grant select on table "public"."waypoints" to "authenticated";

grant trigger on table "public"."waypoints" to "authenticated";

grant truncate on table "public"."waypoints" to "authenticated";

grant update on table "public"."waypoints" to "authenticated";

grant delete on table "public"."waypoints" to "service_role";

grant insert on table "public"."waypoints" to "service_role";

grant references on table "public"."waypoints" to "service_role";

grant select on table "public"."waypoints" to "service_role";

grant trigger on table "public"."waypoints" to "service_role";

grant truncate on table "public"."waypoints" to "service_role";

grant update on table "public"."waypoints" to "service_role";

-- Storage policies for avatars bucket
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'avatars') then
    insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, false, 5242880, array['image/jpeg', 'image/png', 'image/gif']::text[]);
  else
    update storage.buckets
    set public = true
    where id = 'avatars';
  end if;
end $$;

-- Drop existing policies if they exist
do $$
begin
  drop policy if exists "Users can upload their own avatar" on storage.objects;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  drop policy if exists "Users can read their own avatar" on storage.objects;
  drop policy if exists "Users can delete their own avatar" on storage.objects;
  drop policy if exists "Public can view avatars" on storage.objects;
end $$;

-- Policy to allow public read access to avatars
create policy "Public can view avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- Policy to allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);



