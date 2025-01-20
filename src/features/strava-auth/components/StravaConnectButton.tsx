'use client';

import { Button } from '@/components/ui/button';

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_ID;
const REDIRECT_URI =
	process.env.NODE_ENV === 'production'
		? 'https://kart.gardsh.no/api/auth/strava/callback'
		: 'http://localhost:3000/api/auth/strava/callback';

export function StravaConnectButton() {
	const handleStravaConnect = () => {
		// Generate a random state value for security
		const state = Math.random().toString(36).substring(2, 15);

		// Store state in sessionStorage to verify when we return
		sessionStorage.setItem('stravaOAuthState', state);

		const scope = 'read,activity:read_all';
		const authUrl = new URL('https://www.strava.com/oauth/authorize');

		// Add query parameters
		const params = new URLSearchParams({
			client_id: STRAVA_CLIENT_ID || '',
			redirect_uri: REDIRECT_URI,
			response_type: 'code',
			scope: scope,
			state: state,
			approval_prompt: 'auto',
		});

		// Redirect to Strava
		window.location.href = `${authUrl}?${params.toString()}`;
	};

	return (
		<Button onClick={handleStravaConnect} className="bg-[#FC4C02] hover:bg-[#FC4C02]/90">
			Connect with Strava
		</Button>
	);
}
