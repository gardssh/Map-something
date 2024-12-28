import { MapComponent } from '@/components/MapComponent';
import { useAuth } from '@/contexts/AuthContext';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';

interface AppSidebarAndMapProps {
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
	setActiveItem: (item: string) => void;
	setShowDetailsDrawer: (show: boolean) => void;
}

export function AppSidebarAndMap({
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
	setShowDetailsDrawer,
}: AppSidebarAndMapProps) {
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
						setActiveItem={setActiveItem}
						setShowDetailsDrawer={setShowDetailsDrawer}
					/>
				</div>
			</SidebarInset>
		</>
	);
}
