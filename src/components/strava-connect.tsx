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
      // Fetch activities from Strava
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const activities = await response.json();
      
      // Transform activities to match our database schema
      const transformedActivities = activities.map((activity: any) => ({
        user_id: session?.user?.id,
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

      // Store activities in Supabase
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('strava_activities')
        .upsert(transformedActivities, {
          onConflict: 'strava_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error storing activities:', error);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  useEffect(() => {
    async function checkConnection() {
      if (session?.user?.id && session?.accessToken) {
        try {
          const supabase = createClientComponentClient();
          
          // First, check if a token already exists
          const { data: existingToken } = await supabase
            .from('strava_tokens')
            .select('id')
            .eq('strava_athlete_id', session.user.stravaAthleteId)
            .single();

          if (existingToken) {
            setIsConnected(true);
            return;
          }

          setIsLoading(true);
          
          // If no token exists, create one
          const { data, error } = await supabase
            .from('strava_tokens')
            .upsert({
              user_id: session.user.id,
              access_token: session.accessToken,
              refresh_token: session.refreshToken || '',
              expires_at: Math.floor(Date.now() / 1000) + 21600, // 6 hours from now
              strava_athlete_id: session.user.stravaAthleteId
            }, {
              onConflict: 'strava_athlete_id'
            })
            .select()
            .single();
          
          if (error) {
            console.error('Supabase error:', error);
            return;
          }
          
          // Fetch and store activities when connecting
          if (data) {
            await fetchAndStoreActivities(session.accessToken);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
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
        await supabase
          .from('strava_tokens')
          .delete()
          .eq('strava_athlete_id', session.user.stravaAthleteId);
        
        await supabase
          .from('strava_activities')
          .delete()
          .eq('user_id', session.user.id);

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
        <Button 
          variant="default"
          className="w-full bg-[#FC4C02] hover:bg-[#FC4C02]/90" 
          onClick={handleConnect}
        >
          Connect with Strava
        </Button>
      ) : (
        isConnected ? (
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleDisconnect}
            disabled={isLoading}
          >
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
        )
      )}
    </div>
  );
} 