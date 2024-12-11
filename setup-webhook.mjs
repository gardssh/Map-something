import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const clientId = process.env.NEXT_PUBLIC_STRAVA_ID;
const clientSecret = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET;
const baseUrl = process.argv[2] || process.env.NEXTAUTH_URL; // Accept URL from command line or use default
const callbackUrl = `${baseUrl}/api/strava/webhook`;
const verifyToken = process.env.STRAVA_VERIFY_TOKEN;

console.log('Using callback URL:', callbackUrl);

try {
	const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			callback_url: callbackUrl,
			verify_token: verifyToken,
		}),
	});

	const data = await response.json();
	console.log('Webhook subscription created:', data);
} catch (error) {
	console.error('Error creating webhook subscription:', error);
}
