import { createClient } from '@/lib/supabase';
import { DbRoute, DbWaypoint } from '@/types/supabase';

const supabase = createClient();

export async function fetchActivities() {
  try {
    const response = await fetch('/api/activities');
    if (!response.ok) {
      console.error('Activities fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error('Failed to fetch activities');
    }
    const data = await response.json();
    return data.activities || [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

export async function fetchRoutes() {
  try {
    const { data, error, status } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Routes fetch failed:', {
        error,
        status,
        message: error.message,
        details: error.details
      });
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
}

export async function fetchWaypoints() {
  try {
    const { data, error, status } = await supabase
      .from('waypoints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Waypoints fetch failed:', {
        error,
        status,
        message: error.message,
        details: error.details
      });
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching waypoints:', error);
    return [];
  }
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