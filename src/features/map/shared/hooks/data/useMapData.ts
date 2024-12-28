'use client';

import { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import type { DbRoute, DbWaypoint } from '@/types/supabase';

interface UseMapDataProps {
	user: any | null;
}

interface UseMapDataReturn {
	activities: any[];
	routes: DbRoute[];
	waypoints: DbWaypoint[];
	activitiesLoading: boolean;
}

export function useMapData({ user }: UseMapDataProps): UseMapDataReturn {
	const [activities, setActivities] = useState<any[]>([]);
	const [routes, setRoutes] = useState<DbRoute[]>([]);
	const [waypoints, setWaypoints] = useState<DbWaypoint[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);

	useEffect(() => {
		if (user) {
			// Load activities
			fetch(`/api/activities`)
				.then((res) => res.json())
				.then((data) => {
					setActivities(data.activities || []);
					setActivitiesLoading(false);
				})
				.catch((error) => {
					console.error(`Error loading activities:`, error);
					setActivitiesLoading(false);
				});

			// Load routes
			fetch(`/api/routes`)
				.then((res) => res.json())
				.then((data) => {
					setRoutes(
						data.routes.map((route: DbRoute) => ({
							...route,
							distance: turf.length(turf.lineString(route.geometry.coordinates), { units: `kilometers` }),
						}))
					);
				})
				.catch((error) => console.error(`Error loading routes:`, error));

			// Load waypoints
			fetch(`/api/waypoints`)
				.then((res) => res.json())
				.then((data) => {
					setWaypoints(data.waypoints || []);
				})
				.catch((error) => console.error(`Error loading waypoints:`, error));
		}
	}, [user]);

	return {
		activities,
		routes,
		waypoints,
		activitiesLoading,
	};
} 