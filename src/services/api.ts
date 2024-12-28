import type { DbRoute, DbWaypoint } from '@/types/supabase';
import * as turf from '@turf/turf';

function isCacheError(error: any): boolean {
    return error instanceof TypeError && 
           error.message.includes("'Cache'") && 
           error.message.includes("unsupported");
}

export async function handleRouteSave(newRoute: DbRoute) {
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

        // Fetch and return updated routes
        const getResponse = await fetch('/api/routes');
        const data = await getResponse.json();
        return data.routes.map((route: DbRoute) => ({
            ...route,
            distance: turf.length(turf.lineString(route.geometry.coordinates), { units: `kilometers` }),
        }));
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error saving route:`, error);
            throw error;
        }
        // If it's a cache error, we still want to return the response data
        const getResponse = await fetch('/api/routes');
        const data = await getResponse.json();
        return data.routes.map((route: DbRoute) => ({
            ...route,
            distance: turf.length(turf.lineString(route.geometry.coordinates), { units: `kilometers` }),
        }));
    }
}

export async function handleRouteDelete(routeId: string) {
    try {
        const response = await fetch(`/api/routes`, {
            method: `DELETE`,
            headers: { 'Content-Type': `application/json` },
            body: JSON.stringify({ routeId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete route`);
        }

        return routeId;
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error deleting route:`, error);
            throw error;
        }
        return routeId; // Return the ID even if there's a cache error
    }
}

export async function handleRouteRename(routeId: string, newName: string) {
    try {
        const response = await fetch(`/api/routes`, {
            method: `PATCH`,
            headers: { 'Content-Type': `application/json` },
            body: JSON.stringify({ routeId, newName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to rename route`);
        }

        return { routeId, newName };
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error renaming route:`, error);
            throw error;
        }
        return { routeId, newName }; // Return the update even if there's a cache error
    }
}

export async function handleRouteCommentUpdate(routeId: string, comments: string) {
    try {
        const response = await fetch(`/api/routes`, {
            method: `PATCH`,
            headers: { 'Content-Type': `application/json` },
            body: JSON.stringify({ routeId, comments }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update route comments`);
        }

        return { routeId, comments };
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error updating route comments:`, error);
            throw error;
        }
        return { routeId, comments }; // Return the update even if there's a cache error
    }
}

export async function handleWaypointSave(newWaypoint: DbWaypoint) {
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

        const getResponse = await fetch('/api/waypoints');
        if (!getResponse.ok) {
            throw new Error(`Failed to fetch updated waypoints`);
        }

        const data = await getResponse.json();
        return data.waypoints || [];
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error saving waypoint:`, error);
            throw error;
        }
        // If it's a cache error, try to get the updated waypoints
        const getResponse = await fetch('/api/waypoints');
        const data = await getResponse.json();
        return data.waypoints || [];
    }
}

export async function handleWaypointDelete(waypointId: string) {
    try {
        const response = await fetch(`/api/waypoints`, {
            method: `DELETE`,
            headers: { 'Content-Type': `application/json` },
            body: JSON.stringify({ waypointId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete waypoint`);
        }

        return waypointId;
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error deleting waypoint:`, error);
            throw error;
        }
        return waypointId; // Return the ID even if there's a cache error
    }
}

export async function handleWaypointRename(waypointId: string, newName: string) {
    try {
        const response = await fetch(`/api/waypoints`, {
            method: `PATCH`,
            headers: { 'Content-Type': `application/json` },
            body: JSON.stringify({ waypointId, newName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to rename waypoint`);
        }

        return { waypointId, newName };
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error renaming waypoint:`, error);
            throw error;
        }
        return { waypointId, newName }; // Return the update even if there's a cache error
    }
}

export async function handleWaypointCommentUpdate(waypointId: string, comments: string) {
    try {
        const response = await fetch(`/api/waypoints`, {
            method: `PATCH`,
            headers: { 'Content-Type': `application/json` },
            body: JSON.stringify({ waypointId, comments }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update waypoint comments`);
        }

        return { waypointId, comments };
    } catch (error) {
        if (!isCacheError(error)) {
            console.error(`Error updating waypoint comments:`, error);
            throw error;
        }
        return { waypointId, comments }; // Return the update even if there's a cache error
    }
} 