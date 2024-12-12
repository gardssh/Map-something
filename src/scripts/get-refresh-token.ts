import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_ID;
const STRAVA_CLIENT_SECRET = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET;

// Your authorization code from the callback URL
const AUTH_CODE = 'f4131721fa76ac1d9691ad262e120864a0a7f37c';

async function getRefreshToken() {
    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                code: AUTH_CODE,
                grant_type: 'authorization_code',
            }),
        });

        const data = await response.json();
        console.log('New refresh token:', data.refresh_token);
        console.log('Full response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

getRefreshToken(); 