import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_ID;

// Generate the authorization URL
const scopes = ['read', 'activity:read_all'];
const redirectUri = 'http://localhost:3000/api/strava/callback';

const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join(',')}&approval_prompt=force`;

console.log('Please visit this URL to authorize the application:');
console.log(authUrl);
console.log('\nAfter authorization, you will be redirected to a URL containing a "code" parameter.');
console.log('Copy that code and update your .env.local file with the new NEXT_PUBLIC_STRAVA_REFRESH_TOKEN'); 