import { MapComponent } from '@/components/MapComponent';
import { AppSidebar } from './app-sidebar';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { DbRoute, DbWaypoint, DbStravaActivity } from '@/types/supabase';
import type { Activity } from '@/types/activity';
import type { MapRef } from 'react-map-gl';
import React from 'react';
import { ActivityCategory } from '@/lib/categories';

interface ActivityWithMap extends DbStravaActivity {
	map: {
		summary_polyline: string;
	};
	description?: string;
}

interface AppSidebarAndMapProps {
	activities: ActivityWithMap[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
	currentActivity: ActivityWithMap | null;
	mapInstance: mapboxgl.Map | null;
	setMapInstance: (map: mapboxgl.Map) => void;
	handleActivitySelect: (activity: ActivityWithMap | null) => void;
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
	setVisibleRoutesId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
	setVisibleWaypointsId: React.Dispatch<React.SetStateAction<(string | number)[]>>;
	handleRouteSave: (route: DbRoute) => void;
	handleWaypointSave: (waypoint: DbWaypoint) => void;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	handleWaypointSelect: (waypoint: DbWaypoint | null) => void;
	onWaypointCommentUpdate: (waypointId: string, comment: string) => void;
	onRouteCommentUpdate: (routeId: string, comment: string) => void;
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
	setVisibleRoutesId,
	setVisibleWaypointsId,
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
	const [localVisibleRoutesId, setLocalVisibleRoutesId] = React.useState<(string | number)[]>([]);
	const [localVisibleWaypointsId, setLocalVisibleWaypointsId] = React.useState<(string | number)[]>([]);
	const [selectedCategories, setSelectedCategories] = React.useState<ActivityCategory[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);

	// Update parent state when local state changes
	React.useEffect(() => {
		setVisibleRoutesId(localVisibleRoutesId);
	}, [localVisibleRoutesId, setVisibleRoutesId]);

	React.useEffect(() => {
		setVisibleWaypointsId(localVisibleWaypointsId);
	}, [localVisibleWaypointsId, setVisibleWaypointsId]);

	return (
		<>
			<AppSidebar
				activities={activities}
				visibleActivitiesId={visibleActivitiesId}
				visibleRoutesId={localVisibleRoutesId}
				visibleWaypointsId={localVisibleWaypointsId}
				selectedRouteId={selectedRouteId}
				selectedActivity={currentActivity}
				map={mapInstance}
				onActivitySelect={(activity) => handleActivitySelect(activity as unknown as ActivityWithMap)}
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
				selectedCategories={selectedCategories}
				setSelectedCategories={setSelectedCategories}
			/>
			<SidebarInset className="flex flex-col h-screen w-full">
				<div className="flex-1 relative w-full pb-16 md:pb-0">
					<MapComponent
						activities={activities as unknown as Activity[]}
						setVisibleActivitiesId={setVisibleActivitiesId}
						setVisibleRoutesId={setLocalVisibleRoutesId}
						setVisibleWaypointsId={setLocalVisibleWaypointsId}
						selectedRouteId={selectedRouteId}
						setSelectedRouteId={setSelectedRouteId}
						onMapLoad={(map) => setMapInstance(map)}
						onRouteSave={handleRouteSave}
						onRouteSelect={handleRouteSelect}
						onActivitySelect={(activity) => handleActivitySelect(activity as unknown as ActivityWithMap)}
						routes={routes}
						waypoints={waypoints}
						onWaypointSave={handleWaypointSave}
						handleWaypointSelect={handleWaypointSelect}
						selectedWaypoint={selectedWaypoint}
						setActiveItem={setActiveItem}
						setShowDetailsDrawer={setShowDetailsDrawer}
						activeItem={activeItem}
						selectedCategories={selectedCategories}
						setSelectedCategories={setSelectedCategories}
					/>
				</div>
			</SidebarInset>
		</>
	);
}
