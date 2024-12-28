'use client';

import { useState, useEffect } from 'react';
import { MapComponent } from '@/features/map/shared/components/map';
import { useAuth } from '@/contexts/AuthContext';
import AuthComponent from '@/components/Auth/AuthComponent';
import { Button } from '@/features/shared/components/ui/button';
import { LngLatBounds } from 'mapbox-gl';
import { switchCoordinates } from '@/features/map/shared/utils/coordinates';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import HelpButton from '@/features/shared/components/ui/help-button';
import * as turf from '@turf/turf';
import { AppSidebar } from '@/components/app-sidebar';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/features/shared/components/ui/breadcrumb';
import { Separator } from '@/features/shared/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/features/shared/components/ui/sidebar';
import { redirect } from 'next/navigation';
import { MobileNavBar } from '@/features/map/mobile/components/navigation/MobileNavBar';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/features/shared/hooks/responsive/useResponsiveLayout';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { MobileProfile } from '@/features/map/mobile/components/profile/MobileProfile';
import { MobileDrawer } from '@/features/map/mobile/components/drawer/MobileDrawer';
import { formatTime } from '@/features/map/shared/utils/timeFormat';
import { Download } from 'lucide-react';
import { RouteDetails } from '@/features/map/shared/components/routes/RouteDetails';
import { Edit2 } from 'lucide-react';
import { EditDetailsForm } from '@/features/map/shared/components/forms/EditDetailsForm';
import { ActivityDetails } from '@/features/map/shared/components/activities/ActivityDetails';
import { WaypointDetails } from '@/features/map/shared/components/waypoints/WaypointDetails';
import { ElevationChart } from '@/features/map/shared/components/charts/ElevationChart';
import { DesktopLayout } from '@/features/map/desktop/components/layout/DesktopLayout';
import { MobileLayout } from '@/features/map/mobile/components/layout/MobileLayout';
import { useMapData } from '@/features/map/shared/hooks/data/useMapData';
import { useMapHandlers } from '@/features/map/shared/hooks/data/useMapHandlers';

export default function Home() {
	const { user, loading } = useAuth();
	const { isMobile, isPWA, isOnline } = useResponsiveLayout();
	const { activities, routes, waypoints, activitiesLoading } = useMapData({ user });
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
	const [visibleActivitiesId, setVisibleActivitiesId] = useState<number[]>([]);
	const [activeItem, setActiveItem] = useState(`nearby`);
	const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

	const {
		selectedRouteId,
		selectedRoute,
		selectedWaypoint,
		selectedActivity,
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
		setSelectedRouteId,
	} = useMapHandlers({
		mapInstance,
		isMobile,
		setActiveItem,
		setShowDetailsDrawer,
	});

	useEffect(() => {
		if (!isOnline) {
			// Handle offline state - could show a notification or load cached data
			console.log(`App is offline, using cached data`);
		}
	}, [isOnline]);

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
					<DesktopLayout
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
					<MobileLayout
						isOnline={isOnline}
						activeItem={activeItem}
						setActiveItem={setActiveItem}
						activities={activities}
						visibleActivitiesId={visibleActivitiesId}
						setVisibleActivitiesId={setVisibleActivitiesId}
						selectedRouteId={selectedRouteId}
						setSelectedRouteId={setSelectedRouteId}
						mapInstance={mapInstance}
						setMapInstance={setMapInstance}
						selectedActivity={selectedActivity}
						selectedRoute={selectedRoute}
						selectedWaypoint={selectedWaypoint}
						routes={routes}
						waypoints={waypoints}
						handleActivitySelect={handleActivitySelect}
						handleRouteSelect={handleRouteSelect}
						handleRouteDelete={handleRouteDelete}
						handleRouteRename={handleRouteRename}
						handleWaypointDelete={handleWaypointDelete}
						handleWaypointRename={handleWaypointRename}
						handleRouteSave={handleRouteSave}
						handleWaypointSave={handleWaypointSave}
						handleWaypointSelect={handleWaypointSelect}
						handleWaypointCommentUpdate={handleWaypointCommentUpdate}
						handleRouteCommentUpdate={handleRouteCommentUpdate}
						setShowDetailsDrawer={setShowDetailsDrawer}
					/>
				)}
				<HelpButton activeItem={activeItem} />
				{isMobile && !isPWA && <PWAInstallPrompt />}
			</SidebarProvider>
		</main>
	);
}
