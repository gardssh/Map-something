'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { useAuth } from '@/contexts/AuthContext';
import AuthComponent from '@/components/Auth/AuthComponent';
import { Button } from '@/components/ui/button';
import { LngLatBounds } from 'mapbox-gl';
import { switchCoordinates } from '@/components/activities/switchCor';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import HelpButton from '@/components/HelpButton';
import * as turf from '@turf/turf';
import { AppSidebar } from '@/components/app-sidebar';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export default function Home() {
	const { user, loading, signOut } = useAuth();
	const [activities, setActivities] = useState<any[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<string | number | null>(null);
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
					setRoutes(
						data.routes.map((route: DbRoute) => ({
							...route,
							distance: turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' }),
						}))
					);
				})
				.catch((error) => console.error('Error loading routes:', error));

			// Load waypoints
			fetch('/api/waypoints')
				.then((res) => res.json())
				.then((data) => {
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
			setRoutes(
				data.routes.map((route: DbRoute) => ({
					...route,
					distance: turf.length(turf.lineString(route.geometry.coordinates), { units: 'kilometers' }),
				}))
			);
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

	const handleWaypointSelect = (waypoint: DbWaypoint) => {
		if (mapInstance) {
			mapInstance.flyTo({
				center: waypoint.coordinates as [number, number],
				zoom: 14,
				duration: 1000
			});
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p>Loading authentication...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="h-screen">
				<AuthComponent />
			</div>
		);
	}

	if (activitiesLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p>Loading activities...</p>
				</div>
			</div>
		);
	}

	return (
		<main className="h-screen w-screen relative overflow-hidden">
			<SidebarProvider
				style={
					{
						'--sidebar-width': '350px',
					} as React.CSSProperties
				}
				className="h-full w-full"
			>
				<AppSidebarAndMap 
					activities={activities}
					visibleActivitiesId={visibleActivitiesId}
					selectedRouteId={selectedRouteId}
					currentActivity={currentActivity}
					mapInstance={mapInstance}
					setMapInstance={setMapInstance}
					handleActivitySelect={handleActivitySelect}
					selectedRoute={selectedRoute}
					routes={routes}
					handleRouteSelect={handleRouteSelect}
					handleRouteDelete={handleRouteDelete}
					handleRouteRename={handleRouteRename}
					waypoints={waypoints}
					handleWaypointDelete={handleWaypointDelete}
					setVisibleActivitiesId={setVisibleActivitiesId}
					handleRouteSave={handleRouteSave}
					handleWaypointSave={handleWaypointSave}
					setSelectedRouteId={setSelectedRouteId}
					handleWaypointSelect={handleWaypointSelect}
				/>
			</SidebarProvider>
			<HelpButton />
		</main>
	);
}

// Create a new component for the sidebar and map content
function AppSidebarAndMap({
	activities,
	visibleActivitiesId,
	selectedRouteId,
	currentActivity,
	mapInstance,
	setMapInstance,
	handleActivitySelect,
	selectedRoute,
	routes,
	handleRouteSelect,
	handleRouteDelete,
	handleRouteRename,
	waypoints,
	handleWaypointDelete,
	setVisibleActivitiesId,
	handleRouteSave,
	handleWaypointSave,
	setSelectedRouteId,
	handleWaypointSelect,
}: {
	activities: any[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
	currentActivity: any;
	mapInstance: mapboxgl.Map | null;
	setMapInstance: (map: mapboxgl.Map) => void;
	handleActivitySelect: (activity: any) => void;
	selectedRoute: DbRoute | null;
	routes: DbRoute[];
	handleRouteSelect: (route: DbRoute | null) => void;
	handleRouteDelete: (routeId: string) => void;
	handleRouteRename: (routeId: string, newName: string) => void;
	waypoints: DbWaypoint[];
	handleWaypointDelete: (waypointId: string) => void;
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	handleRouteSave: (route: DbRoute) => void;
	handleWaypointSave: (waypoint: DbWaypoint) => void;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	handleWaypointSelect: (waypoint: DbWaypoint) => void;
}) {
	const { open: isSidebarOpen } = useSidebar();

	return (
		<>
			<AppSidebar 
				activities={activities}
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
				setSelectedRouteId={setSelectedRouteId}
				handleWaypointSelect={handleWaypointSelect}
			/>
			<SidebarInset className="flex flex-col h-screen w-full">
				<header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background p-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="text-sm font-medium">Villspor</div>
				</header>
				<div className="flex-1 relative w-full">
					<MapComponent
						activities={activities}
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
			</SidebarInset>
		</>
	);
}
