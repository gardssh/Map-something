'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { useSession } from 'next-auth/react';
import SideBar from '@/components/SideBar';
import activities from '../../public/aktiviteter.json';
import { categorizeActivity } from '@/lib/utils';
import { CategoryFilter } from '@/components/CategoryFilter/index';

const TOKEN_ENDPOINT = 'https://www.strava.com/oauth/token';

export default function Home() {
	//const [activities, setActivities] = useState<any[]>([]);
	const { data: session, status } = useSession();
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

	const filters = [(activity: any) => selectedCategories.includes(categorizeActivity(activity.sport_type))];

	const filteredActivities = filters.reduce((data, filter) => data.filter(filter), activities);
	const selectedActivity = activities.find((activity) => activity.id === selectedRouteId);

	/* comment out to stop polling API too many times
	useEffect(() => {
		const getActivities = async () => {
			let moreData = true;
			const maxCount = 2;
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
     */

	useEffect(() => {
		if (mapInstance) {
			console.log('Map instance available:', {
				isStyleLoaded: mapInstance.isStyleLoaded(),
				hasTerrain: !!mapInstance.getTerrain(),
				center: mapInstance.getCenter()
			});
		}
	}, [mapInstance]);

	return (
		<>
			<main className="h-screen w-screen">
				<div className="flex h-screen relative">
					<SideBar
						activities={filteredActivities}
						status={status}
						visibleActivitiesId={visibleActivitiesId}
						selectedRouteId={selectedRouteId}
						selectedActivity={selectedActivity}
						map={mapInstance}
					/>
					<MapComponent
						activities={filteredActivities}
						setVisibleActivitiesId={setVisibleActivitiesId}
						selectedRouteId={selectedRouteId}
						setSelectedRouteId={setSelectedRouteId}
						onMapLoad={(map) => setMapInstance(map)}
					/>
					<CategoryFilter selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />
				</div>
			</main>
		</>
	);
}
