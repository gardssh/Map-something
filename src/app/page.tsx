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
import { redirect } from 'next/navigation';
import { MobileNavBar } from '@/components/MobileNavBar';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { MobileProfile } from '@/components/MobileProfile';
import { MobileDrawer } from '@/components/MobileDrawer';
import { formatTime } from '@/lib/timeFormat';
import { Download } from 'lucide-react';
import { RouteDetails } from '@/components/routes/RouteDetails';
import { Edit2 } from 'lucide-react';
import { EditDetailsForm } from '@/components/EditDetailsForm';
import { ActivityDetails } from '@/components/activities/ActivityDetails';
import { WaypointDetails } from '@/components/waypoints/WaypointDetails';
import { ElevationChart } from '@/components/ElevationChart';
import { AppSidebarAndMap } from '@/components/AppSidebarAndMap';
import {
	handleRouteSave as apiHandleRouteSave,
	handleRouteDelete as apiHandleRouteDelete,
	handleRouteRename as apiHandleRouteRename,
	handleRouteCommentUpdate as apiHandleRouteCommentUpdate,
	handleWaypointSave as apiHandleWaypointSave,
	handleWaypointDelete as apiHandleWaypointDelete,
	handleWaypointRename as apiHandleWaypointRename,
	handleWaypointCommentUpdate as apiHandleWaypointCommentUpdate,
} from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
	const [isOpen, setIsOpen] = useState(false);
	const [activeItem, setActiveItem] = useState(`nearby`);
	const [selectedActivity, setSelectedActivity] = useState<any>(null);
	const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
	const [isEditingRoute, setIsEditingRoute] = useState(false);
	const [isEditingWaypoint, setIsEditingWaypoint] = useState(false);
	const [elevationData, setElevationData] = useState<{ distance: number; elevation: number }[]>([]);

	useEffect(() => {
		if (!isOnline) {
			// Handle offline state - could show a notification or load cached data
			console.log(`App is offline, using cached data`);
		}
	}, [isOnline]);

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
				if (!response.ok) {
					throw new Error(`Geoapify API error: ${response.status}`);
				}

				const data = await response.json();
				const points: { distance: number; elevation: number }[] = [];
				let cumulativeDistance = 0;

				if (!data.features?.[0]?.properties?.legs) {
					throw new Error('Invalid response format');
				}

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

	const filteredActivities = activities;
	const currentActivity = activities.find((activity) => activity.id === selectedRouteId) || null;

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
			const updatedRoutes = await apiHandleRouteSave(newRoute);
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
			await apiHandleRouteDelete(routeId);
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
			await apiHandleRouteRename(routeId, newName);
			setRoutes(routes.map((route) => (route.id === routeId ? { ...route, name: newName } : route)));
			setSelectedRoute(
				selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, name: newName } : selectedRoute
			);
		} catch (error) {
			console.error(`Error renaming route:`, error);
		}
	};

	const handleRouteCommentUpdate = async (routeId: string, comments: string) => {
		try {
			await apiHandleRouteCommentUpdate(routeId, comments);
			setRoutes(routes.map((route) => (route.id === routeId ? { ...route, comments } : route)));
			setSelectedRoute(selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, comments } : selectedRoute);
		} catch (error) {
			console.error(`Error updating route comments:`, error);
		}
	};

	const handleWaypointSave = async (newWaypoint: DbWaypoint) => {
		try {
			const updatedWaypoints = await apiHandleWaypointSave(newWaypoint);
			setWaypoints(updatedWaypoints);
		} catch (error) {
			console.error(`Error saving waypoint:`, error);
			throw error;
		}
	};

	const handleWaypointDelete = async (waypointId: string) => {
		try {
			await apiHandleWaypointDelete(waypointId);
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
			await apiHandleWaypointRename(waypointId, newName);
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
			await apiHandleWaypointCommentUpdate(waypointId, comments);
			setWaypoints(waypoints.map((waypoint) => (waypoint.id === waypointId ? { ...waypoint, comments } : waypoint)));
			setSelectedWaypoint(
				selectedWaypoint && selectedWaypoint.id === waypointId ? { ...selectedWaypoint, comments } : selectedWaypoint
			);
		} catch (error) {
			console.error(`Error updating waypoint comments:`, error);
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
					<div className="h-[calc(100vh-4rem)] w-full flex flex-col">
						{!isOnline && (
							<div className="bg-yellow-500 text-white px-4 py-2 text-sm">
								You&apos;re offline. Some features may be limited.
							</div>
						)}
						<div className="flex-1 relative">
							{activeItem === `profile` ? (
								<MobileProfile />
							) : (
								<>
									<MapComponent
										activities={activities}
										setVisibleActivitiesId={setVisibleActivitiesId}
										selectedRouteId={selectedRouteId}
										setSelectedRouteId={setSelectedRouteId}
										onMapLoad={(map) => setMapInstance(map)}
										onRouteSave={handleRouteSave}
										onRouteSelect={handleRouteSelect}
										onActivitySelect={handleActivitySelect}
										routes={routes}
										waypoints={waypoints}
										onWaypointSave={handleWaypointSave}
										handleWaypointSelect={handleWaypointSelect}
										selectedWaypoint={selectedWaypoint}
										setActiveItem={setActiveItem}
										setShowDetailsDrawer={setShowDetailsDrawer}
									/>
									<MobileDrawer
										isOpen={[`activities`, `routes`, `waypoints`].includes(activeItem)}
										onClose={() => setActiveItem(`nearby`)}
										title={activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
										peekContent={
											activeItem === 'activities' && activities.length > 0 ? (
												<div className="space-y-4 overflow-auto max-h-[200px]">
													{activities.slice(0, 3).map((activity) => (
														<div
															key={activity.id}
															className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
															onClick={() => handleActivitySelect(activity)}
														>
															<h3 className="font-medium">{activity.name}</h3>
															<div className="grid grid-cols-2 gap-4 mt-2">
																<div>
																	<p className="text-sm text-muted-foreground">Type</p>
																	<p>{activity.sport_type}</p>
																</div>
																<div>
																	<p className="text-sm text-muted-foreground">Distance</p>
																	<p>{((activity.distance || 0) / 1000).toFixed(2)} km</p>
																</div>
															</div>
														</div>
													))}
												</div>
											) : activeItem === 'routes' && routes.length > 0 ? (
												<div className="space-y-4 overflow-auto max-h-[200px]">
													{routes.slice(0, 3).map((route) => (
														<div
															key={route.id}
															className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
															onClick={() => {
																handleRouteSelect(route);
																setSelectedRoute(route);
																setSelectedRouteId(route.id);
															}}
														>
															<h3 className="font-medium">{route.name}</h3>
															<div className="mt-2">
																<p className="text-sm text-muted-foreground">Distance</p>
																<p>{route.distance?.toFixed(1)} km</p>
															</div>
															{route.comments && <p className="text-sm text-muted-foreground mt-2">{route.comments}</p>}
														</div>
													))}
												</div>
											) : activeItem === 'waypoints' && waypoints.length > 0 ? (
												<div className="space-y-4 overflow-auto max-h-[200px]">
													{waypoints.slice(0, 3).map((waypoint) => (
														<div
															key={waypoint.id}
															className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
															onClick={() => handleWaypointSelect(waypoint)}
														>
															<h3 className="font-medium">{waypoint.name}</h3>
															{waypoint.comments && (
																<p className="text-sm text-muted-foreground mt-2">{waypoint.comments}</p>
															)}
														</div>
													))}
												</div>
											) : null
										}
									>
										{activeItem === `activities` && (
											<div className="space-y-4">
												{activities.map((activity) => (
													<div
														key={activity.id}
														className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
														onClick={() => handleActivitySelect(activity)}
													>
														<h3 className="font-medium">{activity.name}</h3>
														<p className="text-sm text-muted-foreground">
															{new Date(activity.start_date).toLocaleDateString()}
														</p>
													</div>
												))}
											</div>
										)}
										{activeItem === `routes` && (
											<div className="space-y-4">
												{routes.map((route) => (
													<div
														key={route.id}
														className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
														onClick={() => {
															handleRouteSelect(route);
															setSelectedRoute(route);
															setSelectedRouteId(route.id);
															setShowDetailsDrawer(true);
														}}
													>
														<div className="flex justify-between items-start">
															<div>
																<h3 className="font-medium">{route.name}</h3>
																<p className="text-sm text-muted-foreground">
																	Distance: {route.distance?.toFixed(1)} km
																</p>
																{route.comments && (
																	<p className="text-sm text-muted-foreground mt-2">{route.comments}</p>
																)}
															</div>
														</div>
													</div>
												))}
											</div>
										)}
										{activeItem === `waypoints` && (
											<div className="space-y-4">
												{waypoints.map((waypoint) => (
													<div
														key={waypoint.id}
														className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
														onClick={() => {
															handleWaypointSelect(waypoint);
															setShowDetailsDrawer(true);
														}}
													>
														<div className="flex justify-between items-start">
															<div>
																<h3 className="font-medium">{waypoint.name}</h3>
																{waypoint.comments && (
																	<p className="text-sm text-muted-foreground">{waypoint.comments}</p>
																)}
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</MobileDrawer>
									<MobileDrawer
										isOpen={showDetailsDrawer && (!!selectedActivity || !!selectedRoute || !!selectedWaypoint)}
										onClose={() => {
											setShowDetailsDrawer(false);
											setSelectedActivity(null);
											setSelectedRoute(null);
											setSelectedWaypoint(null);
											handleWaypointSelect?.(null);
											setSelectedRouteId(null);
										}}
										title={
											selectedActivity
												? 'Activity Details'
												: selectedRoute
													? 'Route Details'
													: selectedWaypoint
														? 'Waypoint Details'
														: ''
										}
										peekContent={
											selectedRoute ? (
												<div className="space-y-4">
													<div className="p-4 border rounded-lg">
														<h3 className="font-medium">{selectedRoute.name}</h3>
														<div className="grid grid-cols-2 gap-4 mt-2">
															<div>
																<p className="text-sm text-muted-foreground">Distance</p>
																<p>{selectedRoute.distance?.toFixed(1)} km</p>
															</div>
															{selectedRoute.comments && (
																<div>
																	<p className="text-sm text-muted-foreground">Comments</p>
																	<p className="truncate">{selectedRoute.comments}</p>
																</div>
															)}
														</div>
														<div className="mt-4 h-[100px]">
															<ElevationChart data={elevationData} />
														</div>
													</div>
												</div>
											) : selectedActivity ? (
												<div className="space-y-4 overflow-auto max-h-[200px]">
													<div className="p-4 border rounded-lg">
														<h3 className="font-medium">{selectedActivity.name}</h3>
														<div className="grid grid-cols-2 gap-4 mt-2">
															<div>
																<p className="text-sm text-muted-foreground">Type</p>
																<p>{selectedActivity.sport_type}</p>
															</div>
															<div>
																<p className="text-sm text-muted-foreground">Distance</p>
																<p>{((selectedActivity.distance || 0) / 1000).toFixed(2)} km</p>
															</div>
														</div>
													</div>
												</div>
											) : selectedWaypoint ? (
												<div className="space-y-4">
													<div className="p-4 border rounded-lg">
														<h3 className="font-medium">{selectedWaypoint.name}</h3>
														{selectedWaypoint.comments && (
															<p className="text-sm text-muted-foreground mt-2">{selectedWaypoint.comments}</p>
														)}
														<p className="text-sm text-muted-foreground mt-2">
															{selectedWaypoint.coordinates[0].toFixed(6)}, {selectedWaypoint.coordinates[1].toFixed(6)}
														</p>
													</div>
												</div>
											) : null
										}
									>
										{selectedActivity && <ActivityDetails activity={selectedActivity} />}
										{selectedRoute && (
											<RouteDetails
												route={selectedRoute}
												onDelete={handleRouteDelete}
												onEdit={(routeId, newName, newComment) => {
													handleRouteRename(routeId, newName);
													handleRouteCommentUpdate(routeId, newComment);
												}}
											/>
										)}
										{selectedWaypoint && (
											<WaypointDetails
												waypoint={selectedWaypoint}
												onDelete={handleWaypointDelete}
												onEdit={(waypointId, newName, newComment) => {
													handleWaypointRename(waypointId, newName);
													handleWaypointCommentUpdate(waypointId, newComment);
												}}
											/>
										)}
									</MobileDrawer>
								</>
							)}
						</div>
						<MobileNavBar activeItem={activeItem} onItemSelect={setActiveItem} />
					</div>
				)}
				<HelpButton activeItem={activeItem} />
				{isMobile && !isPWA && <PWAInstallPrompt />}
			</SidebarProvider>
		</main>
	);
}
