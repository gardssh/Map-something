import { MapComponent } from '@/components/MapComponent';
import { MobileProfile } from '@/components/MobileProfile';
import { MobileDrawer } from '@/components/MobileDrawer';
import { ActivityDetails } from '@/components/activities/ActivityDetails';
import { RouteDetails } from '@/components/routes/RouteDetails';
import { WaypointDetails } from '@/components/waypoints/WaypointDetails';
import type { Activity } from '@/types/activity';
import type { DbRoute, DbWaypoint } from '@/types/supabase';

interface MobileViewProps {
	isOnline: boolean;
	activeItem: string;
	activities: Activity[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
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
	setActiveItem: (item: string) => void;
	showDetailsDrawer: boolean;
	setShowDetailsDrawer: (show: boolean) => void;
	selectedActivity: any;
	setSelectedActivity: React.Dispatch<React.SetStateAction<any>>;
	setSelectedRoute: React.Dispatch<React.SetStateAction<DbRoute | null>>;
	setSelectedWaypoint: React.Dispatch<React.SetStateAction<DbWaypoint | null>>;
}

export function MobileView({
	isOnline,
	activeItem,
	activities,
	visibleActivitiesId,
	selectedRouteId,
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
	setActiveItem,
	showDetailsDrawer,
	setShowDetailsDrawer,
	selectedActivity,
	setSelectedActivity,
	setSelectedRoute,
	setSelectedWaypoint,
}: MobileViewProps) {
	return (
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
												onClick={() => {
													handleActivitySelect(activity);
													setShowDetailsDrawer(true);
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
													setSelectedRoute(route);
													setSelectedRouteId(route.id);
													setShowDetailsDrawer(true);
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
													setShowDetailsDrawer(true);
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
												{activity.start_date ? new Date(activity.start_date).toLocaleDateString() : ''}
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
													<p className="text-sm text-muted-foreground">Distance: {route.distance?.toFixed(1)} km</p>
													{route.comments && <p className="text-sm text-muted-foreground mt-2">{route.comments}</p>}
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
										</div>
									</div>
								) : selectedActivity ? (
									<div className="space-y-4">
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
										onRouteCommentUpdate(routeId, newComment);
									}}
								/>
							)}
							{selectedWaypoint && (
								<WaypointDetails
									waypoint={selectedWaypoint}
									onDelete={handleWaypointDelete}
									onEdit={(waypointId, newName, newComment) => {
										handleWaypointRename(waypointId, newName);
										onWaypointCommentUpdate(waypointId, newComment);
									}}
								/>
							)}
						</MobileDrawer>
					</>
				)}
			</div>
		</div>
	);
}
