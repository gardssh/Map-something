'use client';

import * as React from 'react';
import {
	ArchiveX,
	Command,
	File,
	Inbox,
	Send,
	Trash2,
	Navigation,
	Medal,
	Route,
	MapPin,
	Edit2,
	Check,
	X,
	Download,
	Upload,
	PanelLeft,
	PanelLeftClose,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavUser } from '@/components/nav-user';
import { Label } from './ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { switchCoordinates } from '@/components/activities/switchCor';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { formatTime } from '@/lib/timeFormat';
import { ACTIVITY_CATEGORIES, ActivityCategory, categorizeActivity } from '@/lib/categories';
import type { DbRoute, DbWaypoint, DbStravaActivity } from '@/types/supabase';
import type { RouteWithDistance } from '@/types/route';
import * as turf from '@turf/turf';
import { LineString, Position } from 'geojson';
import { GpxUpload } from './MapComponent/controls/GpxUpload';
import type { DrawnRoute } from '@/types/route';
import { Textarea } from './ui/textarea';
import type { Activity } from '@/types/activity';
import { ElevationDetails } from './ElevationDetails';
import { ActivityList } from './ActivityList';
import { RouteDetails } from './routes/RouteDetails';
import { WaypointDetails } from './WaypointDetails';
import type { ActivityWithMap } from '@/types/activity';
import { SidebarNavigation, navigationItems } from './SidebarNavigation';
import { ActivityDetails } from './ActivityDetails';
import { RouteList } from './RouteList';
import TestAvalanche from '@/app/test-avalanche/page';

interface ElevationPoint {
	distance: number; // distance in km
	elevation: number; // elevation in meters
}

interface RouteData {
	features: Array<{
		properties: {
			legs: Array<{
				distance: number;
				elevation_range: Array<[number, number]>;
			}>;
		};
	}>;
}

const calculateRouteDistance = (coordinates: Position[]) => {
	const validCoords = coordinates.filter(
		(coord): coord is [number, number] => Array.isArray(coord) && coord.length === 2
	);
	return turf.length(turf.lineString(validCoords), { units: 'kilometers' });
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	activities: ActivityWithMap[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
	selectedActivity: ActivityWithMap | null;
	map: mapboxgl.Map | null;
	onActivitySelect?: (activity: ActivityWithMap | null) => void;
	selectedRoute: DbRoute | null;
	selectedWaypoint: DbWaypoint | null;
	routes?: DbRoute[];
	onRouteSelect?: (route: DbRoute | null) => void;
	onRouteDelete?: (routeId: string) => void;
	onRouteRename?: (routeId: string, newName: string) => void;
	onRouteCommentUpdate?: (routeId: string, comments: string) => void;
	waypoints?: DbWaypoint[];
	onWaypointDelete?: (waypointId: string) => void;
	onWaypointRename?: (waypointId: string, newName: string) => void;
	onWaypointCommentUpdate?: (waypointId: string, comments: string) => void;
	setSelectedRouteId: React.Dispatch<React.SetStateAction<string | number | null>>;
	handleWaypointSelect?: (waypoint: DbWaypoint | null) => void;
	onRouteSave?: (route: DrawnRoute) => void;
	userId: string;
	activeItem?: string;
	setActiveItem?: (item: string) => void;
}

export function AppSidebar({
	activities = [],
	visibleActivitiesId = [],
	selectedRouteId,
	selectedActivity,
	map,
	onActivitySelect,
	selectedRoute,
	selectedWaypoint,
	routes = [],
	onRouteSelect,
	onRouteDelete,
	onRouteRename,
	onRouteCommentUpdate,
	waypoints = [],
	onWaypointDelete,
	onWaypointRename,
	onWaypointCommentUpdate,
	setSelectedRouteId,
	handleWaypointSelect,
	onRouteSave,
	userId,
	activeItem: externalActiveItem,
	setActiveItem: externalSetActiveItem,
	...props
}: AppSidebarProps) {
	const { user } = useAuth();
	const { open, setOpen } = useSidebar();
	const [mounted, setMounted] = React.useState(false);
	const [internalActiveItem, setInternalActiveItem] = React.useState('nearby');

	// Use external or internal state
	const activeItem = externalActiveItem || internalActiveItem;
	const setActiveItem = externalSetActiveItem || setInternalActiveItem;

	const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null);
	const [editingName, setEditingName] = React.useState<string>('');
	const [editingComments, setEditingComments] = React.useState<string>('');
	const [selectedCategories, setSelectedCategories] = React.useState<ActivityCategory[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);
	const [chartData, setChartData] = React.useState<ElevationPoint[]>([]);
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const [editingWaypointId, setEditingWaypointId] = React.useState<string | null>(null);
	const [editingWaypointName, setEditingWaypointName] = React.useState<string>('');
	const [editingWaypointComments, setEditingWaypointComments] = React.useState<string>('');

	const getElevationData = React.useCallback(async (source: ActivityWithMap | DbRoute) => {
		let coordinates: Position[] = [];

		// Get coordinates based on source type
		if ('sport_type' in source) {
			// Handle activity
			if (!source.map?.summary_polyline) return [];
			const routePoints = switchCoordinates(source as unknown as Activity);
			coordinates = routePoints.coordinates;
		} else if ('geometry' in source && source.geometry) {
			// Handle route
			coordinates = (source.geometry as LineString).coordinates;
		}

		if (!coordinates || coordinates.length === 0) return [];

		// Limit number of waypoints (Geoapify has a limit)
		const maxWaypoints = 10; // Reduced from 25 to stay within limits
		const skipPoints = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
		const limitedCoordinates = coordinates.filter((_, index) => index % skipPoints === 0);

		try {
			// Get elevation data from Geoapify
			const waypoints = limitedCoordinates.map((coord) => `${coord[1]},${coord[0]}`).join('|');
			const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=hike&details=elevation&apiKey=9098bef0b0a04aaf8dfbd2ec98548de4`;

			console.log('Fetching elevation data...');
			const response = await fetch(url);

			if (!response.ok) {
				console.error('Geoapify API error:', response.status, await response.text());
				throw new Error(`Geoapify API error: ${response.status}`);
			}

			const routeData: RouteData = await response.json();
			console.log('Got elevation data:', routeData);

			// Process elevation data from the response
			const points: ElevationPoint[] = [];
			let cumulativeDistance = 0;

			if (!routeData.features?.[0]?.properties?.legs) {
				throw new Error('Invalid response format');
			}

			routeData.features[0].properties.legs.forEach((leg) => {
				leg.elevation_range.forEach(([distance, elevation]) => {
					points.push({
						distance: (cumulativeDistance + distance) / 1000,
						elevation: elevation,
					});
				});
				cumulativeDistance += leg.distance;
			});

			return points;
		} catch (error) {
			console.error('Error fetching elevation data:', error);
			// Fall back to simple distance-based elevation for routes
			if ('geometry' in source) {
				return coordinates.map((_, i) => ({
					distance: calculateRouteDistance(coordinates.slice(0, i + 1)),
					elevation: 0, // We don't have elevation data for routes as fallback
				}));
			}
			// Fall back to activity elevation data for activities
			return Array.from({ length: Math.ceil((source as ActivityWithMap).distance / 100) }, (_, i) => {
				const distance = (i * 100) / 1000; // Every 100 meters
				const activity = source as ActivityWithMap;
				const baseElevation = activity.elev_low ?? 0;
				const elevGain = activity.total_elevation_gain ?? 0;
				return {
					distance,
					elevation: baseElevation + elevGain * (distance / (activity.distance / 1000)),
				};
			});
		}
	}, []);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	React.useEffect(() => {
		const fetchElevationData = async () => {
			if (selectedActivity) {
				const points = await getElevationData(selectedActivity);
				setChartData(points);
			} else if (selectedRoute) {
				const points = await getElevationData(selectedRoute);
				setChartData(points);
			} else {
				setChartData([]);
			}
		};

		fetchElevationData();
	}, [selectedActivity, selectedRoute, getElevationData]);

	const userData = {
		name: user?.user_metadata?.first_name || 'User',
		email: user?.email || '',
		avatar: user?.user_metadata?.avatar_url || '',
	};

	const chartConfig = {
		elevation: {
			label: 'Elevation (m)',
			color: 'hsl(var(--primary))',
		},
	} satisfies ChartConfig;

	const renderElevationChart = () => {
		if (chartData.length === 0) return null;

		return (
			<Card>
				<CardHeader>
					<CardTitle>Elevation Profile</CardTitle>
				</CardHeader>
				<CardContent className="pl-0">
					<ChartContainer config={chartConfig}>
						<LineChart data={chartData} margin={{ left: 48, right: 8, bottom: 24, top: 8 }} height={300}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="distance"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value) => `${value.toFixed(1)} km`}
								scale="linear"
								domain={[0, 'auto']}
								allowDataOverflow={false}
								type="number"
								interval="preserveEnd"
								minTickGap={30}
							/>
							<YAxis
								dataKey="elevation"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value) => `${value.toFixed(0)}m`}
								domain={['auto', 'auto']}
								padding={{ top: 10, bottom: 10 }}
								allowDataOverflow={false}
								interval="preserveStartEnd"
								width={40}
							/>
							<Line
								dataKey="elevation"
								type="monotone"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={false}
								isAnimationActive={false}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										className="w-[150px]"
										nameKey="elevation"
										formatter={(value) => [`Elevation: ${Number(value).toFixed(0)}m`, '']}
										labelFormatter={(value, payload) => {
											if (payload && payload[0]) {
												const distance = payload[0].payload.distance;
												return `Distance: ${Number(distance).toFixed(1)} km`;
											}
											return 'Distance: 0.0 km';
										}}
									/>
								}
							/>
						</LineChart>
					</ChartContainer>
				</CardContent>
			</Card>
		);
	};

	const renderContent = () => {
		if (selectedWaypoint) {
			return (
				<WaypointDetails
					waypoint={selectedWaypoint}
					editingWaypointId={editingWaypointId}
					editingWaypointName={editingWaypointName}
					editingWaypointComments={editingWaypointComments}
					onEditStart={() => {
						setEditingWaypointId(selectedWaypoint.id);
						setEditingWaypointName(selectedWaypoint.name);
						setEditingWaypointComments(selectedWaypoint.comments || '');
					}}
					onEditCancel={() => setEditingWaypointId(null)}
					onWaypointRename={onWaypointRename}
					onWaypointDelete={onWaypointDelete}
					onWaypointCommentUpdate={onWaypointCommentUpdate}
					onClose={() => handleWaypointSelect?.(null)}
					setEditingWaypointName={setEditingWaypointName}
					setEditingWaypointComments={setEditingWaypointComments}
				/>
			);
		}

		if (selectedRoute) {
			return (
				<RouteDetails
					route={selectedRoute}
					onDelete={onRouteDelete}
					onEdit={(routeId, newName, newComment) => {
						onRouteRename?.(routeId, newName);
						onRouteCommentUpdate?.(routeId, newComment);
					}}
				/>
			);
		}

		if (selectedActivity) {
			return (
				<ActivityDetails
					activity={selectedActivity}
					onClose={() => {
						setSelectedRouteId(null);
						if (onActivitySelect) onActivitySelect(null as any);
					}}
				/>
			);
		}

		return (
			<div className="p-4 flex flex-col gap-4 relative grow overflow-y-auto">
				{activeItem === 'nearby' && (
					<ActivityList
						activities={activities}
						visibleActivitiesId={visibleActivitiesId}
						selectedRouteId={selectedRouteId}
						onActivitySelect={onActivitySelect}
						selectedCategories={selectedCategories}
						setSelectedCategories={setSelectedCategories}
						mode="nearby"
					/>
				)}

				{activeItem === 'activities' && (
					<ActivityList
						activities={activities}
						visibleActivitiesId={visibleActivitiesId}
						selectedRouteId={selectedRouteId}
						onActivitySelect={onActivitySelect}
						selectedCategories={selectedCategories}
						setSelectedCategories={setSelectedCategories}
						mode="all"
					/>
				)}

				{activeItem === 'routes' && (
					<RouteList
						routes={routes}
						userId={userId}
						onRouteSave={onRouteSave}
						onRouteSelect={onRouteSelect}
						setSelectedRouteId={setSelectedRouteId}
					/>
				)}

				{activeItem === 'waypoints' && (
					<div className="grow gap-2 overflow-y-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Waypoints</h3>
						{waypoints && waypoints.length > 0 ? (
							waypoints.map((waypoint) => (
								<Card key={waypoint.id} className="mb-2">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<div className="cursor-pointer" onClick={() => handleWaypointSelect?.(waypoint)}>
											<CardTitle>{waypoint.name}</CardTitle>
											<CardDescription>
												{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
											</CardDescription>
										</div>
									</CardHeader>
									<CardContent>
										<p>Created: {new Date(waypoint.created_at).toLocaleString()}</p>
									</CardContent>
								</Card>
							))
						) : (
							<p className="text-muted-foreground">No waypoints yet</p>
						)}
					</div>
				)}

				{activeItem === 'avalanche' && (
					<div className="grow gap-2 overflow-y-auto">
						<div className="p-4 space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-2">About Avalanche Warnings</h3>
								<p className="text-sm text-muted-foreground">
									The avalanche warnings are provided by the Norwegian Avalanche Warning Service (NVE). The danger
									levels range from 1 (Low) to 5 (Extreme), and the forecast includes detailed information about
									avalanche problems, affected areas, and recommendations.
								</p>
							</div>
							<div className="space-y-4">
								<TestAvalanche />
							</div>
						</div>
					</div>
				)}
			</div>
		);
	};

	const handleNavigate = (itemId: string) => {
		setActiveItem(itemId);
		setOpen(true);
		setSelectedRouteId(null);
		onRouteSelect?.(null);
		if (onActivitySelect) onActivitySelect(null as any);
		handleWaypointSelect?.(null);
	};

	return (
		<Sidebar collapsible="icon" className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row" {...props}>
			<SidebarNavigation activeItem={activeItem} open={open} setOpen={setOpen} onNavigate={handleNavigate} />

			{/* Second sidebar - Content */}
			<Sidebar collapsible="none" className="hidden flex-1 md:flex">
				<SidebarHeader className="gap-3.5 border-b p-4">
					<div className="flex w-full items-center justify-between">
						<div className="text-base font-medium text-foreground">
							{navigationItems.find((item: { id: string; label: string }) => item.id === activeItem)?.label}
						</div>
					</div>
				</SidebarHeader>
				<SidebarContent>{renderContent()}</SidebarContent>
			</Sidebar>
		</Sidebar>
	);
}
