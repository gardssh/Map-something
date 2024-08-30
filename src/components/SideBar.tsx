'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Route, MapPin, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import './SideBar/styles.css';
import { formatTime } from '@/lib/timeFormat';
import { signIn, signOut } from 'next-auth/react';

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { switchCoordinates } from './activities/switchCor';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function SideBar({
	activities,
	status,
	visibleActivitiesId,
	selectedRouteId,
	selectedActivity,
}: {
	activities: any;
	status: any;
	visibleActivitiesId: number[];
	selectedRouteId: number | null;
	selectedActivity: any;
}) {
	const visibleActivities = activities.filter((activity: any) => visibleActivitiesId.includes(activity.id));
	const scrollRef = useRef<HTMLDivElement>(null);

	const scrollIntoView = useCallback(() => {
		scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}, []);

	useEffect(() => {
		scrollIntoView();
	}, [selectedRouteId, scrollIntoView]);

	const chartData = [
		{ km: 1, elevation: 186 },
		{ km: 2, elevation: 305 },
		{ km: 3, elevation: 237 },
		{ km: 4, elevation: 73 },
		{ km: 5, elevation: 209 },
		{ km: 6, elevation: 214 },
	];
	const chartConfig = {
		elevation: {
			label: 'Elevation',
			color: 'hsl(var(--chart-1))',
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
							<CardTitle>Elevation</CardTitle>
						</CardHeader>
						<CardContent>
							<ChartContainer config={chartConfig}>
								<LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="km"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										tickFormatter={(value) => value}
									/>
									<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
									<Line dataKey="elevation" type="natural" stroke="#000000" strokeWidth={2} dot={false} />
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
