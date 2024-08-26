'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Route, MapPin, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import './SideBar/styles.css';

import { signIn, signOut } from 'next-auth/react';

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

	return (
		<div className="w-1/3 flex flex-col gap-4 relative">
			{selectedActivity ? (
				<div id="slide" className="bg-slate-100 grow p-4 flex flex-col gap-4 relative">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{selectedActivity.name}</h3>
				</div>
			) : (
				<div className="p-4 flex flex-col gap-4 relative grow">
					<div className=" flex flex-col gap-1">
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
					<div className="grow gap-2 overflow-auto">
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Nearby</h3>
						{/* Disse kortene skal ta inn ting om aktiviteter */}
						{visibleActivities.map((activity) => (
							<div key={activity.id}>
								<Card className={'mb-2' + (activity.id === selectedRouteId && ' border-solid border-2 border-black')}>
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
			<div>
				{status !== 'authenticated' && (
					<Button variant={'secondary'} className=" w-full" onClick={() => signIn()}>
						Sign in
					</Button>
				)}
				{status === 'authenticated' && (
					<Button variant={'secondary'} className=" w-full" onClick={() => signOut()}>
						Sign out
					</Button>
				)}
			</div>
		</div>
	);
}
