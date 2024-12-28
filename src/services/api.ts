import type { DbRoute, DbWaypoint } from '@/types/supabase';
import * as turf from '@turf/turf';

export async function fetchActivities() {
    const res = await fetch(`/api/activities`);
    const data = await res.json();
    return data.activities || [];
}

export async function fetchRoutes() {
    const res = await fetch('/api/routes');
    const data = await res.json();
    return data.routes.map((route: DbRoute) => ({
        ...route,
        distance: turf.length(turf.lineString(route.geometry.coordinates), { units: `kilometers` }),
    }));
}

export async function fetchWaypoints() {
    const res = await fetch('/api/waypoints');
    const data = await res.json();
    return data.waypoints || [];
}

export async function handleRouteSave(newRoute: DbRoute) {
    const response = await fetch(`/api/routes`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify(newRoute),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save route`);
    }

    return fetchRoutes();
}

export async function handleRouteDelete(routeId: string) {
    const response = await fetch(`/api/routes`, {
        method: `DELETE`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ routeId }),
    });

    if (!response.ok) {
        throw new Error(`Failed to delete route`);
    }
}

export async function handleRouteRename(routeId: string, newName: string) {
    const response = await fetch(`/api/routes`, {
        method: `PATCH`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ routeId, newName }),
    });

    if (!response.ok) {
        throw new Error(`Failed to rename route`);
    }
}

export async function handleRouteCommentUpdate(routeId: string, comments: string) {
    const response = await fetch(`/api/routes`, {
        method: `PATCH`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ routeId, comments }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update route comments`);
    }
}

export async function handleWaypointSave(newWaypoint: DbWaypoint) {
    const response = await fetch(`/api/waypoints`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ waypoints: [newWaypoint] }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save waypoint`);
    }

    const getResponse = await fetch('/api/waypoints');
    if (!getResponse.ok) {
        throw new Error(`Failed to fetch updated waypoints`);
    }

    const data = await getResponse.json();
    return data.waypoints || [];
}

export async function handleWaypointDelete(waypointId: string) {
    const response = await fetch(`/api/waypoints`, {
        method: `DELETE`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ waypointId }),
    });

    if (!response.ok) {
        throw new Error(`Failed to delete waypoint`);
    }
}

export async function handleWaypointRename(waypointId: string, newName: string) {
    const response = await fetch(`/api/waypoints`, {
        method: `PATCH`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ waypointId, newName }),
    });

    if (!response.ok) {
        throw new Error(`Failed to rename waypoint`);
    }
}

export async function handleWaypointCommentUpdate(waypointId: string, comments: string) {
    const response = await fetch(`/api/waypoints`, {
        method: `PATCH`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ waypointId, comments }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update waypoint comments`);
    }
} 