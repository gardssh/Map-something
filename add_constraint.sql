ALTER TABLE strava_tokens ADD CONSTRAINT unique_strava_athlete_id UNIQUE (strava_athlete_id);
