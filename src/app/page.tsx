'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent/index';
import { useSession } from 'next-auth/react';
import SideBar from '@/components/SideBar';
import activities from '../../public/aktiviteter.json';
import { LngLatBounds } from 'mapbox-gl';
import { switchCoordinates } from '@/components/activities/switchCor';
import type { DrawnRoute } from '@/types/route';
import type { Waypoint } from '@/types/waypoint';

export default function Home() {
	const { data: session, status } = useSession();
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
	const [routes, setRoutes] = useState<DrawnRoute[]>([]);
	const [selectedRoute, setSelectedRoute] = useState<DrawnRoute | null>(null);
	const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

	useEffect(() => {
		// Load routes on mount
		fetch('/routes.json')
			.then((res) => res.json())
			.then((data) => {
				console.log('Loaded routes:', data.routes);
				setRoutes(data.routes);
			})
			.catch((error) => console.error('Error loading routes:', error));

		// Load waypoints on mount
		fetch('/waypoints.json')
			.then((res) => res.json())
			.then((data) => {
				console.log('Loaded waypoints:', data.waypoints);
				setWaypoints(data.waypoints);
			})
			.catch((error) => console.error('Error loading waypoints:', error));
	}, []);

	const filteredActivities = activities;
	const selectedActivity = activities.find((activity) => activity.id === selectedRouteId) || null;

	const handleActivitySelect = (activity: any) => {
		setSelectedRouteId(activity.id);
		if (mapInstance) handleBounds(activity);
	};

	const handleBounds = (activity: any) => {
		if (!mapInstance) return;

		const coordinates = switchCoordinates(activity);
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
	};

	const handleRouteSave = async (newRoute: DrawnRoute) => {
		console.log('Handling route save:', newRoute);

		try {
			// First, get the current routes from the file
			const currentResponse = await fetch('/routes.json');
			const currentData = await currentResponse.json();
			const currentRoutes = currentData.routes || [];

			// Add the new route to the existing routes
			const updatedRoutes = [...currentRoutes, newRoute];

			// Save the updated routes
			const response = await fetch('/api/routes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ routes: updatedRoutes }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Failed to save route: ${errorData.error}`);
			}

			// Update state with all routes
			setRoutes(updatedRoutes);
			console.log('Route saved successfully');
		} catch (error) {
			console.error('Error saving route:', error);
		}
	};

	const handleRouteSelect = (route: DrawnRoute | null) => {
		setSelectedRoute(route);

		// Zoom to route when selected
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
			// Get current routes
			const currentResponse = await fetch('/routes.json');
			const currentData = await currentResponse.json();

			// Filter out the deleted route
			const updatedRoutes = currentData.routes.filter((route: DrawnRoute) => route.id !== routeId);

			// Save the updated routes
			const response = await fetch('/api/routes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ routes: updatedRoutes }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete route');
			}

			// Update state with filtered routes
			setRoutes(updatedRoutes);
		} catch (error) {
			console.error('Error deleting route:', error);
		}
	};

	const handleRouteRename = async (routeId: string, newName: string) => {
		try {
			// Get current routes
			const currentResponse = await fetch('/routes.json');
			const currentData = await currentResponse.json();

			// Update the route name
			const updatedRoutes = currentData.routes.map((route: DrawnRoute) =>
				route.id === routeId ? { ...route, name: newName } : route
			);

			// Save the updated routes
			const response = await fetch('/api/routes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ routes: updatedRoutes }),
			});

			if (!response.ok) {
				throw new Error('Failed to rename route');
			}

			// Update state with renamed routes
			setRoutes(updatedRoutes);
		} catch (error) {
			console.error('Error renaming route:', error);
		}
	};

	const handleWaypointSave = async (newWaypoint: Waypoint) => {
		try {
			// First, get the current waypoints from the file
			const currentResponse = await fetch('/waypoints.json');
			const currentData = await currentResponse.json();
			const currentWaypoints = currentData.waypoints || [];

			// Add the new waypoint to the existing waypoints
			const updatedWaypoints = [...currentWaypoints, newWaypoint];

			// Save the updated waypoints
			const response = await fetch('/api/waypoints', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ waypoints: updatedWaypoints }),
			});

			if (!response.ok) {
				throw new Error('Failed to save waypoint');
			}

			// Update state with all waypoints
			setWaypoints(updatedWaypoints);
		} catch (error) {
			console.error('Error saving waypoint:', error);
		}
	};

	const handleWaypointDelete = async (waypointId: string) => {
		try {
			const currentResponse = await fetch('/waypoints.json');
			const currentData = await currentResponse.json();
			
			const updatedWaypoints = currentData.waypoints.filter(
				(waypoint: Waypoint) => waypoint.id !== waypointId
			);

			const response = await fetch('/api/waypoints', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ waypoints: updatedWaypoints }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete waypoint');
			}

			setWaypoints(updatedWaypoints);
		} catch (error) {
			console.error('Error deleting waypoint:', error);
		}
	};

	return (
		<>
			<main className="h-screen w-screen">
				<div className="flex h-screen">
					<SideBar
						activities={filteredActivities}
						status={status}
						visibleActivitiesId={visibleActivitiesId}
						selectedRouteId={selectedRouteId}
						selectedActivity={selectedActivity}
						map={mapInstance}
						onActivitySelect={handleActivitySelect}
						selectedRoute={selectedRoute}
						routes={routes}
						onRouteSelect={handleRouteSelect}
						onRouteDelete={handleRouteDelete}
						onRouteRename={handleRouteRename}
						waypoints={waypoints}
						onWaypointDelete={handleWaypointDelete}
					/>
					<div className="flex-1">
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
			</main>
		</>
	);
}
