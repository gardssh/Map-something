import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export async function refreshStravaToken(refreshToken: string) {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    // Update tokens in Supabase
    const { error } = await supabase
      .from('strava_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      })
      .eq('refresh_token', refreshToken)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error refreshing Strava token:', error)
    throw error
  }
}

export function isTokenExpired(expiresAt: number): boolean {
  // Add a 5-minute buffer
  const bufferTime = 5 * 60
  return Date.now() / 1000 >= expiresAt - bufferTime
}

export async function getValidStravaToken(userId: string) {
  try {
    const { data: tokenData, error } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !tokenData) {
      throw new Error('No Strava token found')
    }

    if (isTokenExpired(tokenData.expires_at)) {
      const refreshedData = await refreshStravaToken(tokenData.refresh_token)
      return refreshedData.access_token
    }

    return tokenData.access_token
  } catch (error) {
    console.error('Error getting valid Strava token:', error)
    throw error
  }
}

export async function importActivitiesInBatches(accessToken: string, onProgress?: (progress: number) => void) {
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    try {
      console.log(`Importing activities batch page ${page}...`);
      
      const response = await fetch('/api/strava/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken, page }),
      });

      // Log the response status
      console.log(`Import API response status: ${response.status}`);
      
      // If response is not OK, try to get more details
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`Response content type: ${contentType}`);
        
        // Handle different response types
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Import API error (JSON):', errorData);
          throw new Error(`Failed to import activities: ${JSON.stringify(errorData)}`);
        } else {
          // For HTML or other responses, just log the text
          const errorText = await response.text();
          console.error('Import API error (non-JSON):', errorText.substring(0, 200) + '...');
          throw new Error('Failed to import activities: Server returned non-JSON response');
        }
      }

      // Parse the JSON response
      let data;
      try {
        data = await response.json();
        console.log('Import API response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Failed to parse import response');
      }
      
      totalImported += data.stats.success;
      
      if (onProgress) {
        onProgress(totalImported);
      }

      hasMore = data.hasMore;
      page = data.nextPage;

      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error importing activities:', error);
      // Don't rethrow the error, just break the loop to stop importing
      hasMore = false;
      break;
    }
  }

  return totalImported;
} 