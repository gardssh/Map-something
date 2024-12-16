'use client';

import * as React from 'react';
import { ArchiveX, Command, File, Inbox, Send, Trash2, Navigation, Medal, Route, MapPin, Edit2, Check, X, Download } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { formatTime } from '@/lib/timeFormat';
import { ACTIVITY_CATEGORIES, ActivityCategory, categorizeActivity } from '@/lib/categories';
import type { DbRoute, DbWaypoint } from '@/types/supabase';
import type { RouteWithDistance } from '@/types/route';
import * as turf from '@turf/turf';
import { LineString, Position } from 'geojson';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	activities: any[];
	visibleActivitiesId: number[];
	selectedRouteId: number | null;
	selectedActivity: any;
	map: mapboxgl.Map | null;
	onActivitySelect?: (activity: any) => void;
	selectedRoute: DbRoute | null;
	routes?: DbRoute[];
	onRouteSelect?: (route: DbRoute) => void;
	onRouteDelete?: (routeId: string) => void;
	onRouteRename?: (routeId: string, newName: string) => void;
	waypoints?: DbWaypoint[];
	onWaypointDelete?: (waypointId: string) => void;
}

const navigationItems = [
	{ id: 'nearby', icon: Navigation, label: 'Nearby' },
	{ id: 'activities', icon: Medal, label: 'Activities' },
	{ id: 'routes', icon: Route, label: 'Routes' },
	{ id: 'waypoints', icon: MapPin, label: 'Waypoints' },
] as const;

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

export function AppSidebar({ 
	activities = [],
	visibleActivitiesId = [],
	selectedRouteId,
	selectedActivity,
	map,
	onActivitySelect,
	selectedRoute,
	routes = [],
	onRouteSelect,
	onRouteDelete,
	onRouteRename,
	waypoints = [],
	onWaypointDelete,
	...props 
}: AppSidebarProps) {
	// All hooks must be called before any conditional returns
	const { user } = useAuth();
	const { setOpen } = useSidebar();
	const [mounted, setMounted] = React.useState(false);
	const [activeItem, setActiveItem] = React.useState('nearby');
	const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null);
	const [editingName, setEditingName] = React.useState<string>('');
	const [selectedCategories, setSelectedCategories] = React.useState<ActivityCategory[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);
	const [chartData, setChartData] = React.useState<ElevationPoint[]>([]);
	const scrollRef = React.useRef<HTMLDivElement>(null);

	const getElevationData = React.useCallback(async (activity: any) => {
		if (!activity?.map?.summary_polyline) return [];

		const routePoints = switchCoordinates(activity);
		const coordinates = routePoints.coordinates;

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
			// Fall back to activity elevation data
			return Array.from({ length: Math.ceil(activity.distance / 100) }, (_, i) => {
				const distance = (i * 100) / 1000; // Every 100 meters
				return {
					distance,
					elevation: activity.elev_low + activity.total_elevation_gain * (distance / (activity.distance / 1000)),
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
			} else {
				setChartData([]);
			}
		};

		fetchElevationData();
	}, [selectedActivity, getElevationData]);

	// Don't render anything until mounted
	if (!mounted) return null;

	const userData = {
		name: user?.user_metadata?.first_name || 'User',
		email: user?.email || '',
		avatar: user?.user_metadata?.avatar_url || '',
	};

	const visibleActivities = activities.filter((activity: any) => visibleActivitiesId.includes(activity.id));

	const calculateRouteDistance = (coordinates: Position[]) => {
		const validCoords = coordinates.filter((coord): coord is [number, number] => 
			Array.isArray(coord) && coord.length === 2
		);
		return turf.length(turf.lineString(validCoords), { units: 'kilometers' });
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
						<LineChart 
							data={chartData} 
							margin={{ left: 48, right: 8, bottom: 24, top: 8 }} 
							height={300}
						>
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

	const toggleCategory = (category: ActivityCategory) => {
		setSelectedCategories((prev) =>
			prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
		);
	};

	const renderContent = () => {
		if (selectedRoute) {
			return (
				<div className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{selectedRoute.name}</h3>
					<Card>
						<CardHeader>
							<p>Distance: {(selectedRoute as RouteWithDistance)?.distance?.toFixed(2) || 'N/A'}km</p>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<p>Created: {new Date(selectedRoute.created_at).toLocaleString()}</p>
						</CardHeader>
					</Card>
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
				</div>
			);
		}

		if (selectedActivity) {
			return (
				<div id="slide" className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{selectedActivity.name}</h3>
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
					{renderElevationChart()}
				</div>
			);
		}

		return (
			<div className="p-4 flex flex-col gap-4 relative grow overflow-y-auto">
				{activeItem === 'nearby' && (
					<div className="grow gap-2 overflow-y-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Nearby</h3>
						{visibleActivities.map((activity: any) => (
							<div key={activity.id}>
								<Card
									className={'mb-2 hover:bg-accent cursor-pointer transition-colors'}
									onClick={() => onActivitySelect?.(activity)}
								>
									<CardHeader>
										<CardTitle>{activity.name}</CardTitle>
										<CardDescription>{activity.sport_type}</CardDescription>
									</CardHeader>
									<CardContent>
										<p>
											Time: {Math.floor(activity.moving_time / 60)}:{activity.moving_time % 60}
										</p>
									</CardContent>
								</Card>
								{activity.id === selectedRouteId && <div ref={scrollRef} />}
							</div>
						))}
					</div>
				)}

				{activeItem === 'activities' && (
					<div className="grow gap-2 overflow-y-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">All Activities</h3>
						<div className="flex flex-wrap gap-2 mb-4">
							{ACTIVITY_CATEGORIES.map((category) => (
								<Badge
									key={category}
									variant="outline"
									className={cn(
										'cursor-pointer hover:bg-primary/20 transition-colors',
										selectedCategories.includes(category)
											? 'bg-primary text-primary-foreground hover:bg-primary/90'
											: 'bg-background'
									)}
									onClick={() => toggleCategory(category)}
								>
									{category}
								</Badge>
							))}
						</div>
						{activities
							.filter((activity) =>
								selectedCategories.includes(categorizeActivity(activity.sport_type) as ActivityCategory)
							)
							.map((activity: any) => (
								<div key={activity.id}>
									<Card
										className={'mb-2 hover:bg-accent cursor-pointer transition-colors'}
										onClick={() => onActivitySelect?.(activity)}
									>
										<CardHeader>
											<CardTitle>{activity.name}</CardTitle>
											<CardDescription>{activity.sport_type}</CardDescription>
										</CardHeader>
										<CardContent>
											<p>
												Time: {Math.floor(activity.moving_time / 60)}:{activity.moving_time % 60}
											</p>
										</CardContent>
									</Card>
									{activity.id === selectedRouteId && <div ref={scrollRef} />}
								</div>
							))}
					</div>
				)}

				{activeItem === 'routes' && (
					<div className="grow gap-2 overflow-y-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Routes</h3>
						{routes && routes.length > 0 ? (
							routes.map((route) => (
								<Card key={route.id} className="mb-2">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<div className="flex-1">
											{editingRouteId === route.id ? (
												<div className="flex gap-2">
													<Input
														value={editingName}
														onChange={(e) => setEditingName(e.target.value)}
														className="h-8"
													/>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 p-0"
															onClick={() => {
																onRouteRename?.(route.id, editingName);
																setEditingRouteId(null);
															}}
														>
															<Check className="h-4 w-4" />
															<span className="sr-only">Save route name</span>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 p-0"
															onClick={() => setEditingRouteId(null)}
														>
															<X className="h-4 w-4" />
															<span className="sr-only">Cancel editing</span>
														</Button>
													</div>
												</div>
											) : (
												<div onClick={() => onRouteSelect?.(route)}>
													<CardTitle>{route.name}</CardTitle>
													{route.geometry && (route.geometry as LineString).coordinates && (
														<CardDescription>
															Distance:{' '}
															{calculateRouteDistance((route.geometry as LineString).coordinates).toFixed(2)} km
														</CardDescription>
													)}
												</div>
											)}
										</div>
										{!editingRouteId && (
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 p-0"
													onClick={(e) => {
														e.stopPropagation();
														setEditingRouteId(route.id);
														setEditingName(route.name);
													}}
												>
													<Edit2 className="h-4 w-4" />
													<span className="sr-only">Edit route name</span>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 p-0"
													onClick={(e) => {
														e.stopPropagation();
														onRouteDelete?.(route.id);
													}}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete route</span>
												</Button>
											</div>
										)}
									</CardHeader>
									<CardContent
										className="cursor-pointer"
										onClick={() => !editingRouteId && onRouteSelect?.(route)}
									>
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
										<div>
											<CardTitle>{waypoint.name}</CardTitle>
											<CardDescription>
												{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
											</CardDescription>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 p-0"
											onClick={() => onWaypointDelete?.(waypoint.id)}
										>
											<Trash2 className="h-4 w-4" />
											<span className="sr-only">Delete waypoint</span>
										</Button>
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

	return (
		<Sidebar collapsible="icon" className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row" {...props}>
			{/* First sidebar - Navigation */}
			<Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
								<a href="/">
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground relative">
										<Image src="/favicon.svg" alt="Villspor Logo" fill className="object-cover p-1" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">Villspor</span>
										<span className="truncate text-xs">Villspor</span>
									</div>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent className="px-1.5 md:px-0">
							<SidebarMenu>
								{navigationItems.map((item) => (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											tooltip={{
												children: item.label,
												hidden: false,
											}}
											onClick={() => {
												setActiveItem(item.id);
												setOpen(true);
											}}
											isActive={activeItem === item.id}
											className="px-2.5 md:px-2"
										>
											<item.icon className="h-4 w-4" />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<NavUser user={userData} />
				</SidebarFooter>
			</Sidebar>

			{/* Second sidebar - Content */}
			<Sidebar collapsible="none" className="hidden flex-1 md:flex">
				<SidebarHeader className="gap-3.5 border-b p-4">
					<div className="flex w-full items-center justify-between">
						<div className="text-base font-medium text-foreground">
							{navigationItems.find(item => item.id === activeItem)?.label}
						</div>
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup className="px-0">
						<SidebarGroupContent>
							{renderContent()}
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
		</Sidebar>
	);
}
