'use client';
import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { signIn, signOut, useSession } from 'next-auth/react';

const TOKEN_ENDPOINT = 'https://www.strava.com/oauth/token';

export default function Home() {
	const [activities, setActivities] = useState<any[]>([]);
	const { data: session, status } = useSession();

	useEffect(() => {
		const getActivities = async () => {
			let moreData = true;
			const maxCount = 5;
			let page = 1;
			const per_page = 5;
			const tempActivities = [];

			while (moreData && page < maxCount + 1) {
				const res = await fetch(
					`https://www.strava.com/api/v3/athlete/activities?access_token=${session.accessToken}&page=${page}&per_page=${per_page}`
				);
				if (res.status !== 200) {
					console.log(res);
				}
				const newActivities = await res.json();
				tempActivities.push(...newActivities);

				if (newActivities < 5) {
					moreData = false;
				}
				page++;
			}
			setActivities(tempActivities);
		};

		if (activities.length === 0 && status === 'authenticated' && session) {
			getActivities();
		}
	}, [activities, session, status]);
	console.log(activities);

	return (
		<>
			<main className="h-screen w-screen">
				<div className="flex h-screen">
					<div className="min-w-80 p-4 pt-8 flex flex-col">
						<div className="mb-4 w-full">
							{status !== 'authenticated' && (
								<button
									className="bg-blue-500 hover:bg-blue-700 w-full text-white font-bold py-2 px-4 rounded"
									onClick={() => signIn()}
								>
									Sign in
								</button>
							)}
							{status === 'authenticated' && (
								<button
									className="bg-red-500 hover:bg-red-700 w-full text-white font-bold py-2 px-4 rounded"
									onClick={() => signOut()}
								>
									Sign out
								</button>
							)}
						</div>
						<h1 className="text-2xl font-semibold mb-2">Your Story</h1>
						<div className="flex flex-col overflow-y-scroll scrollbar-hide">
							{activities.map((activity) => (
								<div key={activity.id} className="flex flex-col w-full mb-6 border-solid">
									<p className="text-lg">{activity.name}</p>
									<div className="flex">
										<p>{activity.sport_type}</p>
										<p className="ml-auto mr-4">
											Time: {Math.floor(activity.moving_time / 60)}:{activity.moving_time % 60}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
					<MapComponent />
				</div>
			</main>
		</>
	);
}
