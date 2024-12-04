'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { useSession } from 'next-auth/react';
import SideBar from '@/components/SideBar';
import activities from '../../public/aktiviteter.json';

export default function Home() {
	const { data: session, status } = useSession();
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

	const filteredActivities = activities;
	const selectedActivity = activities.find((activity) => activity.id === selectedRouteId);

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
				</div>
			</main>
		</>
	);
}
