'use client';

import { useState } from 'react';
import { MobileNavBar } from '@/features/map/mobile/components/navigation/MobileNavBar';
import { MobileProfile } from '@/features/map/mobile/components/profile/MobileProfile';
import { MobileDrawer } from '@/features/map/mobile/components/drawer/MobileDrawer';
import { MapComponent } from '@/features/map/shared/components/map';
import { ActivityDetails } from '@/features/map/shared/components/activities/ActivityDetails';
import { RouteDetails } from '@/features/map/shared/components/routes/RouteDetails';
import { WaypointDetails } from '@/features/map/shared/components/waypoints/WaypointDetails';
import type { DbRoute, DbWaypoint } from '@/types/supabase';

interface MobileLayoutProps {
	isOnline: boolean;
	activeItem: string;
	setActiveItem: (item: string) => void;
	activities: any[];
	visibleActivitiesId: number[];
	setVisibleActivitiesId: React.Dispatch<React.SetStateAction<number[]>>;
	selectedRouteId: string | number | null;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	mapInstance: mapboxgl.Map | null;
	setMapInstance: (map: mapboxgl.Map) => void;
	selectedActivity: any;
	selectedRoute: DbRoute | null;
	selectedWaypoint: DbWaypoint | null;
	routes: DbRoute[];
	waypoints: DbWaypoint[];
	handleActivitySelect: (activity: any | null) => void;
	handleRouteSelect: (route: DbRoute | null) => void;
	handleRouteDelete: (routeId: string) => void;
	handleRouteRename: (routeId: string, newName: string) => void;
	handleWaypointDelete: (waypointId: string) => void;
	handleWaypointRename: (waypointId: string, newName: string) => void;
	handleRouteSave: (route: DbRoute) => void;
	handleWaypointSave: (waypoint: DbWaypoint) => void;
	handleWaypointSelect: (waypoint: DbWaypoint | null) => void;
	handleWaypointCommentUpdate: (waypointId: string, comments: string) => void;
	handleRouteCommentUpdate: (routeId: string, comments: string) => void;
	setShowDetailsDrawer: (show: boolean) => void;
}

export function MobileLayout({
	isOnline,
	activeItem,
	setActiveItem,
	activities,
	visibleActivitiesId,
	setVisibleActivitiesId,
	selectedRouteId,
	setSelectedRouteId,
	mapInstance,
	setMapInstance,
	selectedActivity,
	selectedRoute,
	selectedWaypoint,
	routes,
	waypoints,
	handleActivitySelect,
	handleRouteSelect,
	handleRouteDelete,
	handleRouteRename,
	handleWaypointDelete,
	handleWaypointRename,
	handleRouteSave,
	handleWaypointSave,
	handleWaypointSelect,
	handleWaypointCommentUpdate,
	handleRouteCommentUpdate,
	setShowDetailsDrawer,
}: MobileLayoutProps) {
	const [showDetailsDrawer, setLocalShowDetailsDrawer] = useState(false);
	const [localSelectedActivity, setLocalSelectedActivity] = useState<any>(null);

	const handleCloseDetailsDrawer = () => {
		setLocalShowDetailsDrawer(false);
		setShowDetailsDrawer(false);
		setLocalSelectedActivity(null);
		handleRouteSelect(null);
		handleWaypointSelect(null);
		setSelectedRouteId(null);
	};

	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col">
			{!isOnline && (
				<div className="bg-yellow-500 text-white px-4 py-2 text-sm">
					You&apos;re offline. Some features may be limited.
				</div>
			)}
			<div className="flex-1 relative">
				{activeItem === 'profile' ? (
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
							setShowDetailsDrawer={setLocalShowDetailsDrawer}
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
												onClick={() => {
													setLocalSelectedActivity(activity);
													handleActivitySelect(activity);
												}}
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
													setLocalShowDetailsDrawer(true);
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
												onClick={() => {
													handleWaypointSelect(waypoint);
													setLocalShowDetailsDrawer(true);
												}}
											>
												<h3 className="font-medium">{waypoint.name}</h3>
												{waypoint.comments && <p className="text-sm text-muted-foreground mt-2">{waypoint.comments}</p>}
											</div>
										))}
									</div>
								) : null
							}
						>
							{activeItem === 'activities' && (
								<div className="space-y-4">
									{activities.map((activity) => (
										<div
											key={activity.id}
											className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
											onClick={() => {
												setLocalSelectedActivity(activity);
												handleActivitySelect(activity);
											}}
										>
											<h3 className="font-medium">{activity.name}</h3>
											<p className="text-sm text-muted-foreground">
												{new Date(activity.start_date).toLocaleDateString()}
											</p>
										</div>
									))}
								</div>
							)}
							{activeItem === 'routes' && (
								<div className="space-y-4">
									{routes.map((route) => (
										<div
											key={route.id}
											className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
											onClick={() => {
												handleRouteSelect(route);
												setLocalShowDetailsDrawer(true);
											}}
										>
											<div className="flex justify-between items-start">
												<div>
													<h3 className="font-medium">{route.name}</h3>
													<p className="text-sm text-muted-foreground">Distance: {route.distance?.toFixed(1)} km</p>
													{route.comments && <p className="text-sm text-muted-foreground mt-2">{route.comments}</p>}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
							{activeItem === 'waypoints' && (
								<div className="space-y-4">
									{waypoints.map((waypoint) => (
										<div
											key={waypoint.id}
											className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
											onClick={() => {
												handleWaypointSelect(waypoint);
												setLocalShowDetailsDrawer(true);
											}}
										>
											<div className="flex justify-between items-start">
												<div>
													<h3 className="font-medium">{waypoint.name}</h3>
													{waypoint.comments && <p className="text-sm text-muted-foreground">{waypoint.comments}</p>}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</MobileDrawer>
						<MobileDrawer
							isOpen={showDetailsDrawer && (!!selectedActivity || !!selectedRoute || !!selectedWaypoint)}
							onClose={handleCloseDetailsDrawer}
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
								selectedActivity ? (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
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
								) : selectedRoute ? (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">Name</p>
												<p>{selectedRoute.name}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Distance</p>
												<p>{selectedRoute.distance?.toFixed(1)} km</p>
											</div>
										</div>
										{selectedRoute.comments && (
											<p className="text-sm text-muted-foreground">{selectedRoute.comments}</p>
										)}
									</div>
								) : selectedWaypoint ? (
									<div className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground">Name</p>
											<p>{selectedWaypoint.name}</p>
										</div>
										{selectedWaypoint.comments && (
											<p className="text-sm text-muted-foreground">{selectedWaypoint.comments}</p>
										)}
									</div>
								) : null
							}
						>
							{selectedActivity && <ActivityDetails activity={selectedActivity} />}
							{selectedRoute && (
								<RouteDetails
									route={selectedRoute}
									onDelete={handleRouteDelete}
									onEdit={(routeId: string, newName: string, newComment: string) => {
										handleRouteRename(routeId, newName);
										handleRouteCommentUpdate(routeId, newComment);
									}}
								/>
							)}
							{selectedWaypoint && (
								<WaypointDetails
									waypoint={selectedWaypoint}
									onDelete={handleWaypointDelete}
									onEdit={(waypointId: string, newName: string, newComment: string) => {
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
	);
}
