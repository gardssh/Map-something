import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testStravaAuth() {
  try {
    // Step 1: Get authorization URL
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_ID}&redirect_uri=http://localhost:3000/api/strava/callback&response_type=code&scope=read,activity:read_all,profile:read_all`;
    console.log('\nAuthorization URL (open this in browser):\n', authUrl);

    // Step 2: Exchange token (you'll need to get the code from the redirect URL after authorizing)
    const code = process.env.STRAVA_TEST_CODE; // You'll need to add this after getting it from the redirect
    if (code) {
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
          client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('\nToken Response:', tokenData);

      // Step 3: Test API call
      if (tokenData.access_token) {
        const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const athleteData = await athleteResponse.json();
        console.log('\nAthlete Data:', athleteData);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testStravaAuth(); 