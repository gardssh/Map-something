'use client';
import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { signIn, signOut, useSession } from 'next-auth/react';

const TOKEN_ENDPOINT = 'https://www.strava.com/oauth/token';

export default function Home() {
	const [activities, setActivities] = useState([]);
	const { data: session, status } = useSession();

	/*
  useEffect(() => {
    const getActivities = async () => {
      const token = await getAccessToken()

      let moreData = 1
      let page = 1;
      const per_page = 200;

      while (moreData < 4) {
          moreData++
        const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?access_token=${token.access_token}&page=${page}&per_page=${per_page}`)
          if (res.status !== 200) {
          console.log(res)
          continue;
        }
          const newActivities = await res.json()
          setActivities([ ...activities, ...newActivities ])
      }
      console.log(activities)
    }

    getActivities()
  }, [activities])
   */

	return (
		<>
			<main className="h-screen w-screen">
				<div className="flex flex-column h-screen">
					<div className="min-w-80 p-4 pt-8">
						<h1>Your Story</h1>
						{status !== 'authenticated' && (
							<button
								className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
								onClick={() => signIn()}
							>
								Sign in
							</button>
						)}
						{status === 'authenticated' && (
							<button
								className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
								onClick={() => signOut()}
							>
								Sign out
							</button>
						)}
					</div>
					<MapComponent />
				</div>
			</main>
		</>
	);
}
