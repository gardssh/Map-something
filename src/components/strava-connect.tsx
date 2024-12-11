'use client';

import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function StravaConnect() {
	const { data: session, status } = useSession();
	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const fetchAndStoreActivities = async (accessToken: string) => {
		try {
			console.log('Starting to fetch all Strava activities...');
			let page = 1;
			let allActivities: any[] = [];
			let hasMore = true;

			while (hasMore) {
				console.log(`Fetching page ${page} of activities...`);
				const response = await fetch(
					`https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch activities page ${page}: ${response.statusText}`);
				}

				const activities = await response.json();
				console.log(`Received ${activities.length} activities for page ${page}`);
				
				allActivities = [...allActivities, ...activities];
				
				hasMore = activities.length === 200;
				page++;

				// Small delay between requests
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			console.log(`Total activities fetched: ${allActivities.length}`);

			const supabase = createClientComponentClient();
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				throw new Error('No authenticated user found');
			}

			// Transform activities to match our database schema
			const transformedActivities = allActivities.map((activity: any) => ({
				user_id: user.id,
				strava_id: activity.id,
				name: activity.name,
				type: activity.type,
				sport_type: activity.sport_type,
				distance: activity.distance,
				moving_time: activity.moving_time,
				total_elevation_gain: activity.total_elevation_gain,
				average_speed: activity.average_speed,
				start_date: activity.start_date,
				summary_polyline: activity.map?.summary_polyline || '',
				elev_low: activity.elev_low,
				elev_high: activity.elev_high,
			}));

			// Store activities in batches
			const BATCH_SIZE = 50;
			console.log(`Storing ${transformedActivities.length} activities in batches of ${BATCH_SIZE}...`);

			for (let i = 0; i < transformedActivities.length; i += BATCH_SIZE) {
				const batch = transformedActivities.slice(i, i + BATCH_SIZE);
				
				try {
					await supabase
						.from('strava_activities')
						.upsert(batch, {
							onConflict: 'strava_id',
							ignoreDuplicates: true
						});
					
					console.log(`Processed activities ${i + 1} to ${Math.min(i + BATCH_SIZE, transformedActivities.length)}`);
				} catch (error: any) {
					// Only log actual errors, not conflicts
					if (error.code !== '23505') {
						console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
					}
				}

				// Small delay between batches
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			console.log('Successfully processed all activities');
		} catch (error) {
			console.error('Error in activity processing:', error);
		}
	};

	useEffect(() => {
		async function checkConnection() {
			if (session?.user?.id && session?.accessToken) {
				try {
					const supabase = createClientComponentClient();
					const { data: { user } } = await supabase.auth.getUser();

					if (!user) {
						console.error('No authenticated user found');
						return;
					}

					const stravaAthleteId = session.user.stravaAthleteId ? Number(session.user.stravaAthleteId) : Number(session.user.id);

					// Check for existing token
					const { data: existingToken } = await supabase
						.from('strava_tokens')
						.select('id')
						.eq('strava_athlete_id', stravaAthleteId)
						.single();

					if (existingToken) {
						setIsConnected(true);
						return;
					}

					setIsLoading(true);

					try {
						// Attempt to create new token
						await supabase
							.from('strava_tokens')
							.insert({
								user_id: user.id,
								access_token: session.accessToken,
								refresh_token: session.refreshToken || '',
								expires_at: Math.floor(Date.now() / 1000) + 21600,
								strava_athlete_id: stravaAthleteId,
							})
							.single();

						// Fetch and store activities regardless of token insert result
						await fetchAndStoreActivities(session.accessToken);
						setIsConnected(true);
					} catch (error: any) {
						// If token already exists, just proceed with activity fetch
						if (error.code === '23505') {
							await fetchAndStoreActivities(session.accessToken);
							setIsConnected(true);
						} else {
							console.error('Error setting up Strava connection:', error);
						}
					}
				} catch (error) {
					console.error('Error in connection check:', error);
				} finally {
					setIsLoading(false);
				}
			}
		}

		checkConnection();
	}, [session]);

	const handleConnect = () => {
		signIn('strava', { callbackUrl: window.location.origin });
	};

	const handleDisconnect = async () => {
		if (session?.user?.id) {
			try {
				setIsLoading(true);
				const supabase = createClientComponentClient();
				const { data: { user } } = await supabase.auth.getUser();

				if (!user) {
					throw new Error('No authenticated user found');
				}

				const stravaAthleteId = session.user.stravaAthleteId ? Number(session.user.stravaAthleteId) : Number(session.user.id);
				
				await supabase.from('strava_tokens').delete().eq('strava_athlete_id', stravaAthleteId);
				await supabase.from('strava_activities').delete().eq('user_id', user.id);

				setIsConnected(false);
			} catch (error) {
				console.error('Error disconnecting:', error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<div className="w-full">
			{status === 'loading' || isLoading ? (
				<div className="text-center text-sm text-muted-foreground">Loading...</div>
			) : status === 'unauthenticated' ? (
				<Button variant="default" className="w-full bg-[#FC4C02] hover:bg-[#FC4C02]/90" onClick={handleConnect}>
					Connect with Strava
				</Button>
			) : isConnected ? (
				<Button variant="destructive" className="w-full" onClick={handleDisconnect} disabled={isLoading}>
					Disconnect Strava
				</Button>
			) : (
				<Button
					variant="default"
					className="w-full bg-[#FC4C02] hover:bg-[#FC4C02]/90"
					onClick={handleConnect}
					disabled={isLoading}
				>
					Connect with Strava
				</Button>
			)}
		</div>
	);
}
