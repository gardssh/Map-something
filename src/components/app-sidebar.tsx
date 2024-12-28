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
import { RouteDetails } from './RouteDetails';
import { WaypointDetails } from './WaypointDetails';
import type { ActivityWithMap } from '@/types/activity';
import { SidebarNavigation, navigationItems } from './SidebarNavigation';

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
				<div className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
					<div className="flex justify-between items-center">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{selectedRoute.name}</h3>
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 p-0"
								onClick={() => {
									setEditingRouteId(selectedRoute.id);
									setEditingName(selectedRoute.name);
									setEditingComments(selectedRoute.comments || '');
								}}
							>
								<Edit2 className="h-4 w-4" />
								<span className="sr-only">Edit route</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 p-0"
								onClick={(e) => {
									e.stopPropagation();
									onRouteDelete?.(selectedRoute.id);
								}}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">Delete route</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 p-0"
								onClick={() => {
									setSelectedRouteId(null);
									onRouteSelect?.(null);
								}}
							>
								<X className="h-4 w-4" />
								<span className="sr-only">Close route</span>
							</Button>
						</div>
					</div>
					{editingRouteId === selectedRoute.id ? (
						<div className="space-y-4">
							<div className="flex gap-2">
								<Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-8" />
							</div>
							<Card>
								<CardHeader>
									<CardTitle>Comments</CardTitle>
								</CardHeader>
								<CardContent>
									<Textarea
										placeholder="Add comments..."
										value={editingComments}
										onChange={(e) => setEditingComments(e.target.value)}
										className="min-h-[100px]"
									/>
								</CardContent>
							</Card>
							<div className="flex gap-2 justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										onRouteRename?.(selectedRoute.id, editingName);
										onRouteCommentUpdate?.(selectedRoute.id, editingComments);
										setEditingRouteId(null);
									}}
								>
									<Check className="h-4 w-4 mr-1" />
									Save
								</Button>
								<Button variant="ghost" size="sm" onClick={() => setEditingRouteId(null)}>
									<X className="h-4 w-4 mr-1" />
									Cancel
								</Button>
							</div>
						</div>
					) : (
						<>
							<RouteDetails
								route={selectedRoute}
								editingRouteId={editingRouteId}
								editingName={editingName}
								editingComments={editingComments}
								onEditStart={() => {
									setEditingRouteId(selectedRoute.id);
									setEditingName(selectedRoute.name);
									setEditingComments(selectedRoute.comments || '');
								}}
								onEditCancel={() => setEditingRouteId(null)}
								setEditingName={setEditingName}
								setEditingComments={setEditingComments}
								onRouteRename={onRouteRename}
								onRouteDelete={onRouteDelete}
								onRouteCommentUpdate={onRouteCommentUpdate}
								onClose={() => setSelectedRouteId(null)}
							/>
							<Button
								variant="secondary"
								className="w-full flex gap-2"
								onClick={() => {
									if (!selectedRoute.geometry) return;

									// Create GPX content
									const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Villspor">
    <trk>
        <name>${selectedRoute.name}</name>
        <trkseg>
            ${(selectedRoute.geometry.coordinates as [number, number][])
							.map(([lon, lat]) => `            <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
							.join('\n')}
        </trkseg>
    </trk>
</gpx>`;

									// Create and trigger download
									const blob = new Blob([gpx], { type: 'application/gpx+xml' });
									const url = window.URL.createObjectURL(blob);
									const a = document.createElement('a');
									a.href = url;
									a.download = `${selectedRoute.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
									document.body.appendChild(a);
									a.click();
									document.body.removeChild(a);
									window.URL.revokeObjectURL(url);
								}}
							>
								<Download className="h-4 w-4" />
								Download GPX
							</Button>
						</>
					)}
				</div>
			);
		}

		if (selectedActivity) {
			return (
				<div id="slide" className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
					<div className="flex justify-between items-center">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{selectedActivity.name}</h3>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 p-0"
							onClick={() => {
								setSelectedRouteId(null);
								if (onActivitySelect) onActivitySelect(null as any);
							}}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Close activity</span>
						</Button>
					</div>
					<div className="flex justify-between gap-2">
						<Badge variant={'secondary'} className="flex-1 flex items-center justify-center">
							{selectedActivity.type}
						</Badge>
						<Badge variant={'secondary'} className="flex-1 flex items-center justify-center">
							{selectedActivity.start_date.slice(0, 10)}
						</Badge>
					</div>
					<Card>
						<CardHeader>
							<p>Distance: {(selectedActivity.distance / 1000).toFixed(2)} km</p>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<p>Moving time: {formatTime(selectedActivity.moving_time)}</p>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<p>Total elevation gain: {selectedActivity.total_elevation_gain} m</p>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<p>Moving speed: {(selectedActivity.average_speed * 3.6).toFixed(2)} km/t</p>
						</CardHeader>
					</Card>
					{selectedActivity && <ElevationDetails source={selectedActivity} />}
				</div>
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
					<div className="grow gap-2 overflow-y-auto">
						<div className="flex flex-col gap-4 mb-4">
							<div className="flex items-center justify-between">
								<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Routes</h3>
							</div>
							<div className="relative">
								<Button
									variant="outline"
									className="w-full flex items-center justify-center gap-2"
									disabled={!userId || !onRouteSave}
								>
									<Upload className="h-4 w-4" />
									Upload GPX File
								</Button>
								{userId && onRouteSave && (
									<GpxUpload
										onRouteSave={onRouteSave}
										userId={userId}
										className="absolute inset-0 opacity-0 cursor-pointer"
									/>
								)}
							</div>
						</div>
						{routes && routes.length > 0 ? (
							routes.map((route) => (
								<Card
									key={route.id}
									className="mb-2 hover:bg-accent cursor-pointer transition-colors"
									onClick={() => {
										onRouteSelect?.(route);
										setSelectedRouteId(route.id);
									}}
								>
									<CardHeader>
										<CardTitle>{route.name}</CardTitle>
										{route.geometry && (route.geometry as LineString).coordinates && (
											<CardDescription>
												Distance: {calculateRouteDistance((route.geometry as LineString).coordinates).toFixed(2)} km
											</CardDescription>
										)}
									</CardHeader>
									<CardContent>
										<p>Created: {new Date(route.created_at).toLocaleString()}</p>
									</CardContent>
								</Card>
							))
						) : (
							<p className="text-muted-foreground">No routes yet</p>
						)}
					</div>
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
