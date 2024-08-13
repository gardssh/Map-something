'use client';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Route, MapPin, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

import { signIn, signOut } from 'next-auth/react';

export default function SideBar({ activities, status }) {
	return (
		<div className="min-w-80 p-4 flex flex-col gap-4">
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
				{activities.map((activity) => (
					<Card className="mb-2" key={activity.id}>
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
				))}
			</div>
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
