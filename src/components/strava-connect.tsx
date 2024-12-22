'use client';

import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function StravaConnect() {
	const { data: session, status } = useSession();
	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const importActivities = async () => {
		try {
			setIsLoading(true);
			const supabase = createClientComponentClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error('No authenticated user found');
			}

			const response = await fetch('/api/strava/import', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ userId: user.id }),
			});

			if (!response.ok) {
				throw new Error('Failed to import activities');
			}

			const result = await response.json();
			console.log('Import result:', result);
		} catch (error) {
			console.error('Error importing activities:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		async function checkConnection() {
			if (session?.user?.id && session?.accessToken) {
				try {
					const supabase = createClientComponentClient();
					const {
						data: { user },
					} = await supabase.auth.getUser();

					if (!user) {
						console.error('No authenticated user found');
						return;
					}

					const stravaAthleteId = session.user.stravaAthleteId
						? Number(session.user.stravaAthleteId)
						: Number(session.user.id);

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
						await importActivities();
						setIsConnected(true);
					} catch (error: any) {
						// If token already exists, just proceed with activity fetch
						if (error.code === '23505') {
							await importActivities();
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
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) {
					throw new Error('No authenticated user found');
				}

				const stravaAthleteId = session.user.stravaAthleteId
					? Number(session.user.stravaAthleteId)
					: Number(session.user.id);

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
