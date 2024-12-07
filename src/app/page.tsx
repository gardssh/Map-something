'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { useSession } from 'next-auth/react';
import SideBar from '@/components/SideBar';
import activities from '../../public/aktiviteter.json';
import { LngLatBounds } from 'mapbox-gl';
import { switchCoordinates } from '@/components/activities/switchCor';

export default function Home() {
	const { data: session, status } = useSession();
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

	const filteredActivities = activities;
	const selectedActivity = activities.find((activity) => activity.id === selectedRouteId) || null;

	const handleActivitySelect = (activity: any) => {
		setSelectedRouteId(activity.id);

		if (mapInstance) {
			// Create bounds from the route coordinates
			const coordinates = switchCoordinates(activity);
			const bounds = coordinates.reduce(
				(bounds, coord) => {
					return bounds.extend(coord as [number, number]);
				},
				new LngLatBounds(coordinates[0], coordinates[0])
			);

			// Fit the map to the route bounds with some padding
			mapInstance.fitBounds([
				[bounds.getWest(), bounds.getSouth()],
				[bounds.getEast(), bounds.getNorth()]
			], {
				padding: 100,
				duration: 1000
			});
		}
	};

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
						onActivitySelect={handleActivitySelect}
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
