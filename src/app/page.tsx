'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { useAuth } from '@/contexts/AuthContext';
import AuthComponent from '@/components/Auth/AuthComponent';
import { Button } from '@/components/ui/button';
import SideBar from '@/components/SideBar';
import { LngLatBounds } from 'mapbox-gl';
import { switchCoordinates } from '@/components/activities/switchCor';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import HelpButton from '@/components/HelpButton';

export default function Home() {
	const { user, loading, signOut } = useAuth();
	const [activities, setActivities] = useState<any[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<DbRoute | null>(null);
	const [routes, setRoutes] = useState<DbRoute[]>([]);
	const [waypoints, setWaypoints] = useState<DbWaypoint[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (user) {
			// Load activities
			fetch('/api/activities')
				.then((res) => res.json())
				.then((data) => {
					console.log('Loaded activities:', data.activities);
					setActivities(data.activities || []);
					setActivitiesLoading(false);
				})
				.catch((error) => {
					console.error('Error loading activities:', error);
					setActivitiesLoading(false);
				});

			// Load routes
			fetch('/api/routes')
				.then((res) => res.json())
				.then((data) => {
					console.log('Loaded routes:', data.routes);
					setRoutes(data.routes || []);
				})
				.catch((error) => console.error('Error loading routes:', error));

			// Load waypoints
			fetch('/api/waypoints')
				.then((res) => res.json())
				.then((data) => {
					console.log('Loaded waypoints:', data.waypoints);
					setWaypoints(data.waypoints || []);
				})
				.catch((error) => console.error('Error loading waypoints:', error));
		}
	}, [user]);

	const filteredActivities = activities;
	const currentActivity = activities.find((activity) => activity.id === selectedRouteId) || null;

	const handleActivitySelect = (activity: any) => {
		setSelectedRouteId(activity.id);
		if (mapInstance) handleBounds(activity);
	};

	const handleBounds = (activity: any) => {
		if (!mapInstance) return;

		const routePoints = switchCoordinates(activity);
		if (routePoints.coordinates.length === 0) return;

		const bounds = routePoints.coordinates.reduce(
			(bounds, coord) => bounds.extend(coord),
			new LngLatBounds(routePoints.coordinates[0], routePoints.coordinates[0])
		);

		mapInstance.fitBounds(
			[
				[bounds.getWest(), bounds.getSouth()],
				[bounds.getEast(), bounds.getNorth()],
			],
			{
				padding: 100,
				duration: 1000,
			}
		);
	};

	const handleRouteSave = async (newRoute: DbRoute) => {
		try {
			const response = await fetch('/api/routes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRoute),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save route');
			}

			// Fetch updated routes
			const getResponse = await fetch('/api/routes');
			const data = await getResponse.json();
			setRoutes(data.routes || []);
		} catch (error) {
			console.error('Error saving route:', error);
		}
	};

	const handleRouteSelect = (route: DbRoute | null) => {
		setSelectedRoute(route);

		if (route && mapInstance && 'coordinates' in route.geometry) {
			const coordinates = route.geometry.coordinates as [number, number][];
			const bounds = coordinates.reduce(
				(bounds, coord) => {
					return bounds.extend(coord as [number, number]);
				},
				new LngLatBounds(coordinates[0], coordinates[0])
			);

			mapInstance.fitBounds(
				[
					[bounds.getWest(), bounds.getSouth()],
					[bounds.getEast(), bounds.getNorth()],
				],
				{
					padding: 100,
					duration: 1000,
				}
			);
		}
	};

	const handleRouteDelete = async (routeId: string) => {
		try {
			const response = await fetch('/api/routes', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ routeId }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete route');
			}

			setRoutes(routes.filter((route) => route.id !== routeId));
		} catch (error) {
			console.error('Error deleting route:', error);
		}
	};

	const handleRouteRename = async (routeId: string, newName: string) => {
		try {
			const response = await fetch('/api/routes', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ routeId, newName }),
			});

			if (!response.ok) {
				throw new Error('Failed to rename route');
			}

			setRoutes(routes.map((route) => (route.id === routeId ? { ...route, name: newName } : route)));
		} catch (error) {
			console.error('Error renaming route:', error);
		}
	};

	const handleWaypointSave = async (newWaypoint: DbWaypoint) => {
		try {
			const response = await fetch('/api/waypoints', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ waypoints: [newWaypoint] }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save waypoint');
			}

			// Fetch updated waypoints
			const getResponse = await fetch('/api/waypoints');
			if (!getResponse.ok) {
				throw new Error('Failed to fetch updated waypoints');
			}

			const data = await getResponse.json();
			setWaypoints(data.waypoints || []);
		} catch (error) {
			console.error('Error saving waypoint:', error);
			throw error;
		}
	};

	const handleWaypointDelete = async (waypointId: string) => {
		try {
			const response = await fetch('/api/waypoints', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ waypointId }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete waypoint');
			}

			setWaypoints(waypoints.filter((waypoint) => waypoint.id !== waypointId));
		} catch (error) {
			console.error('Error deleting waypoint:', error);
		}
	};

	if (loading || activitiesLoading) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
	}

	if (!user) {
		return <AuthComponent />;
	}

	return (
		<main className="h-screen w-screen relative">
			<div className="flex h-full">
				<SideBar
					isOpen={isOpen}
					setIsOpen={setIsOpen}
					activities={filteredActivities}
					status="authenticated"
					visibleActivitiesId={visibleActivitiesId}
					selectedRouteId={selectedRouteId}
					selectedActivity={currentActivity}
					map={mapInstance}
					onActivitySelect={handleActivitySelect}
					selectedRoute={selectedRoute}
					routes={routes}
					onRouteSelect={handleRouteSelect}
					onRouteDelete={handleRouteDelete}
					onRouteRename={handleRouteRename}
					waypoints={waypoints}
					onWaypointDelete={handleWaypointDelete}
					signOut={signOut}
				/>
				<div className="flex-1 relative">
					<MapComponent
						activities={filteredActivities}
						setVisibleActivitiesId={setVisibleActivitiesId}
						selectedRouteId={selectedRouteId}
						setSelectedRouteId={setSelectedRouteId}
						onMapLoad={(map) => setMapInstance(map)}
						onRouteSave={handleRouteSave}
						onRouteSelect={handleRouteSelect}
						routes={routes}
						waypoints={waypoints}
						onWaypointSave={handleWaypointSave}
					/>
				</div>
			</div>
			<HelpButton />
		</main>
	);
}
