'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Route, MapPin, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import './SideBar/styles.css';
import { formatTime } from '@/lib/timeFormat';
import { signIn, signOut } from 'next-auth/react';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { switchCoordinates } from './activities/switchCor';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import * as turf from '@turf/turf';

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

interface Activity {
	id: number;
	name: string;
	type: string;
	distance: number;
	moving_time: number;
	total_elevation_gain: number;
	average_speed: number;
	start_date: string;
	map: {
		summary_polyline: string;
	};
	elev_low: number;
	elev_high: number;
}

export default function SideBar({
	activities,
	status,
	visibleActivitiesId,
	selectedRouteId,
	selectedActivity,
}: {
	activities: Activity[];
	status: 'authenticated' | 'loading' | 'unauthenticated';
	visibleActivitiesId: number[];
	selectedRouteId: number | null;
	selectedActivity: Activity | null;
}) {
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
			const waypoints = limitedCoordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
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
						elevation: elevation
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
					elevation: activity.elev_low + 
						(activity.total_elevation_gain * (distance / (activity.distance / 1000)))
				};
			});
		}
	}, []);

	// Update chart data when activity changes
	useEffect(() => {
		if (selectedActivity) {
			getElevationData(selectedActivity).then(points => {
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

	return (
		<div className="w-1/3 flex flex-col gap-4 relative">
			{selectedActivity ? (
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
								<LineChart 
									data={chartData} 
									margin={{ left: 24, right: 24, bottom: 24 }}
									height={300}
								>
									<CartesianGrid 
										vertical={false} 
										strokeDasharray="3 3" 
										/>
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
					<div className="flex flex-col gap-1">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Library</h3>
						<Button variant={'ghost'} style={{ justifyContent: 'flex-start' }}>
							<div style={{ display: 'flex', gap: '10px' }}>
								<Medal className="h-5 w-5 mr-2" />
								Activity
							</div>
							<Badge style={{ marginLeft: 'auto' }}>{activities.length}</Badge>
						</Button>
						<Button variant={'ghost'} style={{ justifyContent: 'flex-start', overflow: 'visible' }}>
							<div style={{ display: 'flex', gap: '10px' }}>
								<Route className="h-5 w-5 mr-2" />
								Routes
							</div>
							<Badge style={{ marginLeft: 'auto' }}>Coming soon</Badge>
						</Button>
						<Button variant={'ghost'} style={{ justifyContent: 'flex-start' }}>
							<div style={{ display: 'flex', gap: '10px' }}>
								<MapPin className="h-5 w-5 mr-2" />
								Waypoint
							</div>
							<Badge style={{ marginLeft: 'auto' }}>Coming soon</Badge>
						</Button>
					</div>
					<div className="grow gap-2 overflow-y-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Nearby</h3>
						{visibleActivities.map((activity: any) => (
							<div key={activity.id}>
								<Card className={'mb-2'}>
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
				</div>
			)}
			<div className="sticky bottom-0">
				{status !== 'authenticated' && (
					<Button variant={'secondary'} className="w-full" onClick={() => signIn()}>
						Sign in
					</Button>
				)}
				{status === 'authenticated' && (
					<Button variant={'secondary'} className="w-full" onClick={() => signOut()}>
						Sign out
					</Button>
				)}
			</div>
		</div>
	);
}
