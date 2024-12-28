'use client';

import { useState } from 'react';
import { LngLatBounds } from 'mapbox-gl';
import * as turf from '@turf/turf';
import { switchCoordinates } from '@/features/map/shared/utils/coordinates';
import type { DbRoute, DbWaypoint } from '@/types/supabase';

interface UseMapHandlersProps {
	mapInstance: mapboxgl.Map | null;
	isMobile: boolean;
	setActiveItem: (item: string) => void;
	setShowDetailsDrawer: (show: boolean) => void;
}

interface UseMapHandlersReturn {
	selectedRouteId: string | number | null;
	selectedRoute: DbRoute | null;
	selectedWaypoint: DbWaypoint | null;
	selectedActivity: any;
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
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
}

export function useMapHandlers({
	mapInstance,
	isMobile,
	setActiveItem,
	setShowDetailsDrawer,
}: UseMapHandlersProps): UseMapHandlersReturn {
	const [selectedRouteId, setSelectedRouteId] = useState<string | number | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<DbRoute | null>(null);
	const [selectedWaypoint, setSelectedWaypoint] = useState<DbWaypoint | null>(null);
	const [selectedActivity, setSelectedActivity] = useState<any>(null);

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

	const handleRouteSave = async (route: DbRoute) => {
		try {
			const response = await fetch(`/api/routes`, {
				method: `POST`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify(route),
			});

			if (!response.ok) {
				throw new Error(`Failed to save route`);
			}

			const data = await response.json();
			if (data.route) {
				setSelectedRoute(data.route);
				// Fetch updated routes to refresh the map
				const getResponse = await fetch('/api/routes');
				const updatedData = await getResponse.json();
				if (updatedData.routes) {
					const updatedRoutes = updatedData.routes.map((route: DbRoute) => ({
						...route,
						distance: turf.length(turf.lineString(route.geometry.coordinates), { units: `kilometers` }),
					}));
					// Update routes in parent component
					window.dispatchEvent(new CustomEvent('routesUpdated', { detail: updatedRoutes }));
				}
			}
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

			setSelectedRoute(
				selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, name: newName } : selectedRoute
			);
		} catch (error) {
			console.error(`Error renaming route:`, error);
		}
	};

	const handleWaypointSave = async (waypoint: DbWaypoint) => {
		try {
			const response = await fetch(`/api/waypoints`, {
				method: `POST`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ waypoints: waypoint }),
			});

			if (!response.ok) {
				throw new Error(`Failed to save waypoint`);
			}

			const data = await response.json();
			if (data.waypoints && data.waypoints[0]) {
				setSelectedWaypoint(data.waypoints[0]);
				// Fetch updated waypoints to refresh the map
				const getResponse = await fetch('/api/waypoints');
				const updatedData = await getResponse.json();
				if (updatedData.waypoints) {
					// Update waypoints in parent component
					window.dispatchEvent(new CustomEvent('waypointsUpdated', { detail: updatedData.waypoints }));
				}
			}
		} catch (error) {
			console.error(`Error saving waypoint:`, error);
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
			const response = await fetch(`/api/waypoints`, {
				method: `PATCH`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ waypointId, newName }),
			});

			if (!response.ok) {
				throw new Error(`Failed to rename waypoint`);
			}

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

			setSelectedRoute(selectedRoute && selectedRoute.id === routeId ? { ...selectedRoute, comments } : selectedRoute);
		} catch (error) {
			console.error(`Error updating route comments:`, error);
		}
	};

	return {
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
	};
} 