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
			const response = await fetch(`/api/routes`, {
				method: `POST`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify(newRoute),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to save route`);
			}

			// Fetch updated routes
			const getResponse = await fetch('/api/routes');
			const data = await getResponse.json();
			setRoutes(
				data.routes.map((route: DbRoute) => ({
					...route,
					distance: turf.length(turf.lineString(route.geometry.coordinates), { units: `kilometers` }),
				}))
			);
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
			const response = await fetch(`/api/routes`, {
				method: `DELETE`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ routeId }),
			});

			if (!response.ok) {
				throw new Error(`Failed to delete route`);
			}

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
			const response = await fetch(`/api/routes`, {
				method: `PATCH`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ routeId, newName }),
			});

			if (!response.ok) {
				throw new Error(`Failed to rename route`);
			}

			// Update both the routes list and the selected route
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
			const response = await fetch(`/api/waypoints`, {
				method: `POST`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ waypoints: [newWaypoint] }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to save waypoint`);
			}

			// Fetch updated waypoints
			const getResponse = await fetch('/api/waypoints');
			if (!getResponse.ok) {
				throw new Error(`Failed to fetch updated waypoints`);
			}

			const data = await getResponse.json();
			setWaypoints(data.waypoints || []);
		} catch (error) {
			console.error(`Error saving waypoint:`, error);
			throw error;
		}
	};

	const handleWaypointDelete = async (waypointId: string) => {
		try {
			const response = await fetch(`/api/waypoints`, {
				method: `DELETE`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ waypointId }),
			});

			if (!response.ok) {
				throw new Error(`Failed to delete waypoint`);
			}

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
			setActiveItem(`nearby`);
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
			const response = await fetch(`/api/waypoints`, {
				method: `PATCH`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ waypointId, newName }),
			});

			if (!response.ok) {
				throw new Error(`Failed to rename waypoint`);
			}

			// Update both the waypoints list and the selected waypoint
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
			const response = await fetch(`/api/waypoints`, {
				method: `PATCH`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ waypointId, comments }),
			});

			if (!response.ok) {
				throw new Error(`Failed to update waypoint comments`);
			}

			// Update both the waypoints list and the selected waypoint
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
			const response = await fetch(`/api/routes`, {
				method: `PATCH`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ routeId, comments }),
			});

			if (!response.ok) {
				throw new Error(`Failed to update route comments`);
			}

			// Update both the routes list and the selected route
			setRoutes(routes.map((route) => (route.id === routeId ? { ...route, comments } : route)));
			setSelectedRoute(selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, comments } : selectedRoute);
		} catch (error) {
			console.error(`Error updating route comments:`, error);
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
		return redirect(`/login`);
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
														}}
													>
														<div className="flex justify-between items-start">
															<div>
																<h3 className="font-medium">{route.name}</h3>
																<p className="text-sm text-muted-foreground">
																	Distance: {route.distance?.toFixed(1)} km
																</p>
															</div>
															<button
																className="p-2 hover:bg-accent rounded-full"
																onClick={(e) => {
																	e.stopPropagation();
																	const newName = window.prompt(`Enter new name:`, route.name);
																	if (newName && newName !== route.name) {
																		handleRouteRename(route.id as string, newName);
																	}
																	const newComment = window.prompt(`Enter comment:`, route.comments || ``);
																	if (newComment !== null && newComment !== route.comments) {
																		handleRouteCommentUpdate(route.id as string, newComment);
																	}
																}}
															>
																<Edit2 className="h-4 w-4" />
															</button>
														</div>
														{route.comments && <p className="text-sm text-muted-foreground mt-2">{route.comments}</p>}
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
														onClick={() => handleWaypointSelect(waypoint)}
													>
														<div className="flex justify-between items-start">
															<div>
																<h3 className="font-medium">{waypoint.name}</h3>
																{waypoint.comments && (
																	<p className="text-sm text-muted-foreground">{waypoint.comments}</p>
																)}
															</div>
															<button
																className="p-2 hover:bg-accent rounded-full"
																onClick={(e) => {
																	e.stopPropagation();
																	const newName = window.prompt(`Enter new name:`, waypoint.name);
																	if (newName && newName !== waypoint.name) {
																		handleWaypointRename(waypoint.id as string, newName);
																	}
																	const newComment = window.prompt(`Enter comment:`, waypoint.comments || ``);
																	if (newComment !== null && newComment !== waypoint.comments) {
																		handleWaypointCommentUpdate(waypoint.id as string, newComment);
																	}
																}}
															>
																<Edit2 className="h-4 w-4" />
															</button>
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
											setSelectedRouteId(null);
										}}
										title={
											selectedActivity
												? `Activity Details`
												: selectedRoute
													? `Route Details`
													: selectedWaypoint
														? `Waypoint Details`
														: ``
										}
										peekContent={
											selectedActivity ? (
												<div className="space-y-4">
													<h2 className="text-xl font-semibold">{selectedActivity.name}</h2>
													<div className="grid grid-cols-2 gap-4">
														<div>
															<p className="text-sm text-muted-foreground">Type</p>
															<p>{selectedActivity.sport_type}</p>
														</div>
														<div>
															<p className="text-sm text-muted-foreground">Distance</p>
															<p>{((selectedActivity.distance || 0) / 1000).toFixed(2)} km</p>
														</div>
														<div>
															<p className="text-sm text-muted-foreground">Duration</p>
															<p>{formatTime(selectedActivity.moving_time || 0)}</p>
														</div>
														<div>
															<p className="text-sm text-muted-foreground">Elevation Gain</p>
															<p>{selectedActivity.total_elevation_gain || 0} m</p>
														</div>
													</div>
												</div>
											) : selectedRoute ? (
												<div className="space-y-4">
													<h2 className="text-xl font-semibold">{selectedRoute.name}</h2>
													<div>
														<p className="text-sm text-muted-foreground">Distance</p>
														<p>{((selectedRoute.distance || 0) / 1000).toFixed(2)} km</p>
													</div>
												</div>
											) : selectedWaypoint ? (
												<div className="space-y-4">
													<h2 className="text-xl font-semibold">{selectedWaypoint.name}</h2>
													<div>
														<p className="text-sm text-muted-foreground">Coordinates</p>
														<p>
															{selectedWaypoint.coordinates[0].toFixed(6)}, {selectedWaypoint.coordinates[1].toFixed(6)}
														</p>
													</div>
												</div>
											) : null
										}
									>
										{selectedActivity && <ActivityDetails activity={selectedActivity} />}
										{selectedRoute && <RouteDetails route={selectedRoute} />}
										{selectedWaypoint && <WaypointDetails waypoint={selectedWaypoint} />}
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
	selectedWaypoint,
	routes,
	handleRouteSelect,
	handleRouteDelete,
	handleRouteRename,
	waypoints,
	handleWaypointDelete,
	handleWaypointRename,
	setVisibleActivitiesId,
	handleRouteSave,
	handleWaypointSave,
	setSelectedRouteId,
	handleWaypointSelect,
	onWaypointCommentUpdate,
	onRouteCommentUpdate,
	activeItem,
	setActiveItem,
}: {
	activities: any[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
	currentActivity: any;
	mapInstance: mapboxgl.Map | null;
	setMapInstance: (map: mapboxgl.Map) => void;
	handleActivitySelect: (activity: any | null) => void;
	selectedRoute: DbRoute | null;
	selectedWaypoint: DbWaypoint | null;
	routes: DbRoute[];
	handleRouteSelect: (route: DbRoute | null) => void;
	handleRouteDelete: (routeId: string) => void;
	handleRouteRename: (routeId: string, newName: string) => void;
	waypoints: DbWaypoint[];
	handleWaypointDelete: (waypointId: string) => void;
	handleWaypointRename: (waypointId: string, newName: string) => void;
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	handleRouteSave: (route: DbRoute) => void;
	handleWaypointSave: (waypoint: DbWaypoint) => void;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	handleWaypointSelect: (waypoint: DbWaypoint | null) => void;
	onWaypointCommentUpdate: (waypointId: string, comments: string) => void;
	onRouteCommentUpdate: (routeId: string, comments: string) => void;
	activeItem: string;
	setActiveItem: React.Dispatch<React.SetStateAction<string>>;
}) {
	const { open: isSidebarOpen } = useSidebar();
	const { user } = useAuth();

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
				selectedWaypoint={selectedWaypoint}
				routes={routes}
				onRouteSelect={handleRouteSelect}
				onRouteDelete={handleRouteDelete}
				onRouteRename={handleRouteRename}
				waypoints={waypoints}
				onWaypointDelete={handleWaypointDelete}
				onWaypointRename={handleWaypointRename}
				setSelectedRouteId={setSelectedRouteId}
				handleWaypointSelect={handleWaypointSelect}
				onRouteSave={handleRouteSave}
				userId={user?.id || ``}
				onWaypointCommentUpdate={onWaypointCommentUpdate}
				onRouteCommentUpdate={onRouteCommentUpdate}
				activeItem={activeItem}
				setActiveItem={setActiveItem}
			/>
			<SidebarInset className="flex flex-col h-screen w-full">
				<div className="flex-1 relative w-full pb-16 md:pb-0">
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
					/>
				</div>
			</SidebarInset>
		</>
	);
}
