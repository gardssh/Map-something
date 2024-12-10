'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Route, MapPin, Medal, Navigation, Trash2, Edit2, Check, X, Menu, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import './SideBar/styles.css';
import { formatTime } from '@/lib/timeFormat';
import { signIn, signOut } from 'next-auth/react';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { switchCoordinates } from './activities/switchCor';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import * as turf from '@turf/turf';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ACTIVITY_CATEGORIES, ActivityCategory, categorizeActivity } from '@/lib/categories';
import { Activity } from '@/types/activity';
import { DrawnRoute } from '@/types/route';
import { Input } from '@/components/ui/input';
import { Waypoint } from '@/types/waypoint';

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

type ViewType = 'nearby' | 'activities' | 'routes' | 'waypoints';

interface SideBarProps {
	activities: Activity[];
	status: 'authenticated' | 'loading' | 'unauthenticated';
	visibleActivitiesId: number[];
	selectedRouteId: number | null;
	selectedActivity: Activity | null;
	map: mapboxgl.Map | null;
	onActivitySelect: (activity: Activity) => void;
	selectedRoute?: DrawnRoute | null;
	routes: DrawnRoute[];
	onRouteSelect?: (route: DrawnRoute | null) => void;
	onRouteDelete?: (routeId: string) => void;
	onRouteRename?: (routeId: string, newName: string) => void;
	waypoints?: Waypoint[];
	onWaypointDelete?: (waypointId: string) => void;
}

export default function SideBar({
	activities,
	status,
	visibleActivitiesId,
	selectedRouteId,
	selectedActivity,
	map,
	onActivitySelect,
	selectedRoute,
	routes,
	onRouteSelect,
	onRouteDelete,
	onRouteRename,
	waypoints,
	onWaypointDelete,
}: SideBarProps) {
	const [selectedView, setSelectedView] = useState<ViewType>('nearby');
	const visibleActivities = activities.filter((activity: any) => visibleActivitiesId.includes(activity.id));
	const scrollRef = useRef<HTMLDivElement>(null);

	const scrollIntoView = useCallback(() => {
		scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}, []);

	useEffect(() => {
		scrollIntoView();
	}, [selectedRouteId, scrollIntoView]);

	const [chartData, setChartData] = useState<ElevationPoint[]>([]);

	const getElevationData = useCallback(async (activity: any) => {
		if (!activity?.map?.summary_polyline) return [];

		const coordinates = switchCoordinates(activity);

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

	// Update chart data when activity changes
	useEffect(() => {
		if (selectedActivity) {
			getElevationData(selectedActivity).then((points) => {
				setChartData(points);
			});
		} else {
			setChartData([]);
		}
	}, [selectedActivity, getElevationData]);

	const chartConfig = {
		elevation: {
			label: 'Elevation (m)',
			color: 'hsl(var(--primary))',
		},
	} satisfies ChartConfig;

	const navigationItems = [
		{ id: 'nearby', icon: Navigation, label: 'Nearby' },
		{ id: 'activities', icon: Medal, label: 'Activities' },
		{ id: 'routes', icon: Route, label: 'Routes' },
		{ id: 'waypoints', icon: MapPin, label: 'Waypoints' },
	] as const;

	const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([
		'Foot Sports',
		'Cycle Sports',
		'Water Sports',
		'Winter Sports',
		'Other Sports',
	]);

	const toggleCategory = (category: ActivityCategory) => {
		setSelectedCategories((prev) =>
			prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
		);
	};

	const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState<string>('');
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button 
				variant="secondary" 
				size="icon" 
				className={`
					fixed left-4 top-4 z-50 md:hidden
					transition-all duration-300
					${isOpen ? 'translate-x-[23rem]' : 'translate-x-0'}
					bg-background/95 shadow-md hover:bg-background
				`}
				onClick={() => setIsOpen(!isOpen)}
			>
				{isOpen ? <ArrowLeft className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
			</Button>
			<div
				className={cn(
					'bg-background w-96 border-r h-full overflow-hidden transition-transform duration-300 ease-in-out',
					'md:relative md:translate-x-0',
					'absolute -translate-x-full z-50',
					isOpen && 'translate-x-0'
				)}
			>
				{selectedRoute ? (
					<div className="grow p-4 flex flex-col gap-4 relativeoverflow-y-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{selectedRoute.name}</h3>
						<Card>
							<CardHeader>
								<p>Distance: {selectedRoute.distance.toFixed(2)}km</p>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader>
								<p>Created: {new Date(selectedRoute.createdAt).toLocaleString()}</p>
							</CardHeader>
						</Card>
						{/* Add elevation chart here similar to activities */}
					</div>
				) : selectedActivity ? (
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
						{/* Cards */}
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
						<Card>
							<CardHeader>
								<CardTitle>Elevation Profile</CardTitle>
							</CardHeader>
							<CardContent>
								<ChartContainer config={chartConfig}>
									<LineChart data={chartData} margin={{ left: 24, right: 24, bottom: 24 }} height={300}>
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
					</div>
				) : (
					<div className="p-4 flex flex-col gap-4 relative grow overflow-y-auto">
						<Tabs defaultValue={selectedView} onValueChange={(value: string) => setSelectedView(value as ViewType)}>
							<TabsList className="grid grid-cols-4 h-auto gap-4">
								{navigationItems.map((item) => {
									const Icon = item.icon;
									return (
										<TabsTrigger
											key={item.id}
											value={item.id}
											className="flex flex-col gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
										>
											<Icon className="h-5 w-5" />
											<span className="text-xs font-medium">{item.label}</span>
										</TabsTrigger>
									);
								})}
							</TabsList>

							<TabsContent value="nearby" className="mt-4">
								<div className="grow gap-2 overflow-y-auto">
									<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Nearby</h3>
									{visibleActivities.map((activity: any) => (
										<div key={activity.id}>
											<Card
												className={'mb-2 hover:bg-accent cursor-pointer transition-colors'}
												onClick={() => onActivitySelect(activity)}
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
							</TabsContent>

							<TabsContent value="activities" className="mt-4">
								<div className="grow gap-2 overflow-y-auto">
									<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">All Activities</h3>

									{/* Category filters */}
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

									{/* Filtered activities list */}
									{activities
										.filter((activity) =>
											selectedCategories.includes(categorizeActivity(activity.sport_type) as ActivityCategory)
										)
										.map((activity: any) => (
											<div key={activity.id}>
												<Card
													className={'mb-2 hover:bg-accent cursor-pointer transition-colors'}
													onClick={() => onActivitySelect(activity)}
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
							</TabsContent>

							<TabsContent value="routes" className="mt-4">
								<div className="grow gap-2 overflow-y-auto">
									<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Routes</h3>
									{routes && routes.length > 0 ? (
										routes.map((route) => (
											<Card
												key={route.id}
												className={'mb-2 hover:bg-accent transition-colors'}
											>
												<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
													<div className="cursor-pointer flex-grow">
														{editingRouteId === route.id ? (
															<div className="flex items-center gap-2">
																<Input
																	value={editingName}
																	onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingName(e.target.value)}
																	onClick={(e: React.MouseEvent) => e.stopPropagation()}
																	className="h-8"
																	autoFocus
																/>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 p-0"
																	onClick={(e) => {
																		e.stopPropagation();
																		onRouteRename?.(route.id, editingName);
																		setEditingRouteId(null);
																	}}
																>
																	<Check className="h-4 w-4" />
																	<span className="sr-only">Save name</span>
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 p-0"
																	onClick={(e) => {
																		e.stopPropagation();
																		setEditingRouteId(null);
																	}}
																>
																	<X className="h-4 w-4" />
																	<span className="sr-only">Cancel edit</span>
																</Button>
															</div>
														) : (
															<div onClick={() => onRouteSelect?.(route)}>
																<CardTitle>{route.name}</CardTitle>
																<CardDescription>Distance: {route.distance.toFixed(2)} km</CardDescription>
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
													<p>Created: {new Date(route.createdAt).toLocaleString()}</p>
												</CardContent>
											</Card>
										))
									) : (
										<p className="text-muted-foreground">No routes yet</p>
									)}
								</div>
							</TabsContent>

							<TabsContent value="waypoints" className="mt-4">
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
													<p>Created: {new Date(waypoint.createdAt).toLocaleString()}</p>
												</CardContent>
											</Card>
										))
									) : (
										<p className="text-muted-foreground">No waypoints yet</p>
									)}
								</div>
							</TabsContent>
						</Tabs>
					</div>
				)}
				<div className="sticky bottom-0 p-4 border-t bg-background">
					{status !== 'authenticated' && (
						<Button variant={'secondary'} className="w-full" disabled>
							Sign in (coming soon)
						</Button>
					)}
					{status === 'authenticated' && (
						<Button variant={'secondary'} className="w-full" onClick={() => signOut()}>
							Sign out
						</Button>
					)}
				</div>
			</div>
			{isOpen && (
				<div 
					className="fixed inset-0 bg-black/20 -z-10 md:hidden pointer-events-none" 
					aria-hidden="true"
				/>
			)}
		</>
	);
}
