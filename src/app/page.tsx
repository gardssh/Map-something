'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LngLatBounds } from 'mapbox-gl';
import { switchCoordinates } from '@/components/activities/switchCor';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import HelpButton from '@/components/HelpButton';
import * as turf from '@turf/turf';
import { SidebarProvider } from '@/components/ui/sidebar';
import { redirect } from 'next/navigation';
import { MobileNavBar } from '@/components/MobileNavBar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { AppSidebarAndMap } from '@/components/AppSidebarAndMap';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MobileView } from '@/components/MobileView';
import * as api from '@/services/api';
import { ElevationDetails } from '@/components/ElevationDetails';

export default function Home() {
	const { user, loading, signOut } = useAuth();
	const { isMobile, isPWA, isOnline } = useResponsiveLayout();
	const [activities, setActivities] = useState<any[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<string | number | null>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<DbRoute | null>(null);
	const [selectedWaypoint, setSelectedWaypoint] = useState<DbWaypoint | null>(null);
	const [routes, setRoutes] = useState<DbRoute[]>([]);
	const [waypoints, setWaypoints] = useState<DbWaypoint[]>([]);
	const [activeItem, setActiveItem] = useState(`nearby`);
	const [selectedActivity, setSelectedActivity] = useState<any>(null);
	const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
	const [elevationData, setElevationData] = useState<{ distance: number; elevation: number }[]>([]);

	useEffect(() => {
		if (!isOnline) {
			console.log(`App is offline, using cached data`);
		}
	}, [isOnline]);

	useEffect(() => {
		if (user) {
			// Load initial data
			Promise.all([api.fetchActivities(), api.fetchRoutes(), api.fetchWaypoints()])
				.then(([activities, routes, waypoints]) => {
					setActivities(activities);
					setRoutes(routes);
					setWaypoints(waypoints);
					setActivitiesLoading(false);
				})
				.catch((error) => {
					console.error('Error loading data:', error);
					setActivitiesLoading(false);
				});
		}
	}, [user]);

	useEffect(() => {
		if (!selectedRoute || !selectedRoute.geometry?.coordinates) return;

		const fetchElevationData = async () => {
			const coordinates = selectedRoute.geometry.coordinates;
			const maxWaypoints = 25;
			const skipPoints = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
			const limitedCoordinates = coordinates.filter((_, index) => index % skipPoints === 0);

			try {
				const waypoints = limitedCoordinates.map((coord) => `${coord[1]},${coord[0]}`).join('|');
				const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;

				const response = await fetch(url);
				if (!response.ok) throw new Error(`Geoapify API error: ${response.status}`);

				const data = await response.json();
				const points: { distance: number; elevation: number }[] = [];
				let cumulativeDistance = 0;

				if (!data.features?.[0]?.properties?.legs) throw new Error('Invalid response format');

				data.features[0].properties.legs.forEach((leg: any) => {
					leg.elevation_range.forEach(([distance, elevation]: [number, number]) => {
						points.push({
							distance: (cumulativeDistance + distance) / 1000,
							elevation: elevation,
						});
					});
					cumulativeDistance += leg.distance;
				});

				setElevationData(points);
			} catch (error) {
				console.error('Error fetching elevation data:', error);
				setElevationData([]);
			}
		};

		fetchElevationData();
	}, [selectedRoute]);

	const handleActivitySelect = (activity: any | null) => {
		if (!activity) {
			setSelectedRouteId(null);
			setSelectedActivity(null);
			setShowDetailsDrawer(false);
			return;
		}
		setSelectedRouteId(activity.id);
		setSelectedActivity(activity);
		if (mapInstance) handleBounds(activity);
		if (isMobile) {
			setActiveItem(`nearby`);
			setShowDetailsDrawer(true);
		}
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
			const updatedRoutes = await api.handleRouteSave(newRoute);
			setRoutes(updatedRoutes);
		} catch (error) {
			console.error(`Error saving route:`, error);
		}
	};

	const handleRouteSelect = (route: DbRoute | null) => {
		setSelectedRoute(route);
		if (isMobile) {
			setActiveItem(`nearby`);
			setShowDetailsDrawer(true);
		}

		if (route && mapInstance && `coordinates` in route.geometry) {
			const coordinates = route.geometry.coordinates as [number, number][];
			const bounds = coordinates.reduce(
				(bounds, coord) => bounds.extend(coord as [number, number]),
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
			await api.handleRouteDelete(routeId);
			setRoutes(routes.filter((route) => route.id !== routeId));
			if (selectedRoute?.id === routeId) {
				setSelectedRoute(null);
				setSelectedRouteId(null);
			}
		} catch (error) {
			console.error(`Error deleting route:`, error);
		}
	};

	const handleRouteRename = async (routeId: string, newName: string) => {
		try {
			await api.handleRouteRename(routeId, newName);
			setRoutes(routes.map((route) => (route.id === routeId ? { ...route, name: newName } : route)));
			setSelectedRoute(
				selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, name: newName } : selectedRoute
			);
		} catch (error) {
			console.error(`Error renaming route:`, error);
		}
	};

	const handleWaypointSave = async (newWaypoint: DbWaypoint) => {
		try {
			const updatedWaypoints = await api.handleWaypointSave(newWaypoint);
			setWaypoints(updatedWaypoints);
		} catch (error) {
			console.error(`Error saving waypoint:`, error);
			throw error;
		}
	};

	const handleWaypointDelete = async (waypointId: string) => {
		try {
			await api.handleWaypointDelete(waypointId);
			setWaypoints(waypoints.filter((waypoint) => waypoint.id !== waypointId));
			if (selectedWaypoint?.id === waypointId) {
				setSelectedWaypoint(null);
			}
		} catch (error) {
			console.error(`Error deleting waypoint:`, error);
		}
	};

	const handleWaypointSelect = (waypoint: DbWaypoint | null) => {
		setSelectedWaypoint(waypoint);
		if (isMobile) {
			setActiveItem('nearby');
			setShowDetailsDrawer(true);
		}
		if (mapInstance && waypoint) {
			mapInstance.flyTo({
				center: waypoint.coordinates as [number, number],
				zoom: 14,
				duration: 1000,
			});
		}
	};

	const handleWaypointRename = async (waypointId: string, newName: string) => {
		try {
			await api.handleWaypointRename(waypointId, newName);
			setWaypoints(
				waypoints.map((waypoint) => (waypoint.id === waypointId ? { ...waypoint, name: newName } : waypoint))
			);
			setSelectedWaypoint(
				selectedWaypoint && selectedWaypoint.id === waypointId
					? { ...selectedWaypoint, name: newName }
					: selectedWaypoint
			);
		} catch (error) {
			console.error(`Error renaming waypoint:`, error);
		}
	};

	const handleWaypointCommentUpdate = async (waypointId: string, comments: string) => {
		try {
			await api.handleWaypointCommentUpdate(waypointId, comments);
			setWaypoints(waypoints.map((waypoint) => (waypoint.id === waypointId ? { ...waypoint, comments } : waypoint)));
			setSelectedWaypoint(
				selectedWaypoint && selectedWaypoint.id === waypointId ? { ...selectedWaypoint, comments } : selectedWaypoint
			);
		} catch (error) {
			console.error(`Error updating waypoint comments:`, error);
		}
	};

	const handleRouteCommentUpdate = async (routeId: string, comments: string) => {
		try {
			await api.handleRouteCommentUpdate(routeId, comments);
			setRoutes(routes.map((route) => (route.id === routeId ? { ...route, comments } : route)));
			setSelectedRoute(selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, comments } : selectedRoute);
		} catch (error) {
			console.error(`Error updating route comments:`, error);
		}
	};

	if (loading) {
		return <LoadingSpinner message="Loading authentication..." />;
	}

	if (!user) {
		return redirect(`/login`);
	}

	if (activitiesLoading) {
		return <LoadingSpinner message="Loading activities..." />;
	}

	return (
		<main className="h-screen w-screen relative overflow-hidden">
			<SidebarProvider
				style={
					{
						'--sidebar-width': `350px`,
					} as React.CSSProperties
				}
				className="h-full w-full"
			>
				{!isMobile ? (
					<AppSidebarAndMap
						activities={activities}
						visibleActivitiesId={visibleActivitiesId}
						selectedRouteId={selectedRouteId}
						currentActivity={selectedActivity}
						mapInstance={mapInstance}
						setMapInstance={setMapInstance}
						handleActivitySelect={handleActivitySelect}
						selectedRoute={selectedRoute}
						selectedWaypoint={selectedWaypoint}
						routes={routes}
						handleRouteSelect={handleRouteSelect}
						handleRouteDelete={handleRouteDelete}
						handleRouteRename={handleRouteRename}
						waypoints={waypoints}
						handleWaypointDelete={handleWaypointDelete}
						handleWaypointRename={handleWaypointRename}
						setVisibleActivitiesId={setVisibleActivitiesId}
						handleRouteSave={handleRouteSave}
						handleWaypointSave={handleWaypointSave}
						setSelectedRouteId={setSelectedRouteId}
						handleWaypointSelect={handleWaypointSelect}
						onWaypointCommentUpdate={handleWaypointCommentUpdate}
						onRouteCommentUpdate={handleRouteCommentUpdate}
						activeItem={activeItem}
						setActiveItem={setActiveItem}
						setShowDetailsDrawer={setShowDetailsDrawer}
					/>
				) : (
					<>
						<MobileView
							isOnline={isOnline}
							activeItem={activeItem}
							activities={activities}
							visibleActivitiesId={visibleActivitiesId}
							selectedRouteId={selectedRouteId}
							mapInstance={mapInstance}
							setMapInstance={setMapInstance}
							handleActivitySelect={handleActivitySelect}
							selectedRoute={selectedRoute}
							selectedWaypoint={selectedWaypoint}
							routes={routes}
							handleRouteSelect={handleRouteSelect}
							handleRouteDelete={handleRouteDelete}
							handleRouteRename={handleRouteRename}
							waypoints={waypoints}
							handleWaypointDelete={handleWaypointDelete}
							handleWaypointRename={handleWaypointRename}
							setVisibleActivitiesId={setVisibleActivitiesId}
							handleRouteSave={handleRouteSave}
							handleWaypointSave={handleWaypointSave}
							setSelectedRouteId={setSelectedRouteId}
							handleWaypointSelect={handleWaypointSelect}
							onWaypointCommentUpdate={handleWaypointCommentUpdate}
							onRouteCommentUpdate={handleRouteCommentUpdate}
							setActiveItem={setActiveItem}
							showDetailsDrawer={showDetailsDrawer}
							setShowDetailsDrawer={setShowDetailsDrawer}
							selectedActivity={selectedActivity}
							setSelectedActivity={setSelectedActivity}
							setSelectedRoute={setSelectedRoute}
							setSelectedWaypoint={setSelectedWaypoint}
						/>
						<MobileNavBar activeItem={activeItem} onItemSelect={setActiveItem} />
					</>
				)}
				<HelpButton activeItem={activeItem} />
				{isMobile && !isPWA && <PWAInstallPrompt />}
			</SidebarProvider>
		</main>
	);
}
