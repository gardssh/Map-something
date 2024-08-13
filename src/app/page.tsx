'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import SideBar from '@/components/SideBar';

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
				if (session) {
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
				} else {
					// Handle the case where session is null
					console.log('Session is null');
				}
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
					<SideBar activities={activities} status={status}></SideBar>
					<MapComponent />
				</div>
			</main>
		</>
	);
}
