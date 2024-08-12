'use client';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Route, MapPin, Medal, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

export default function SideBar() {
	return (
		<div className="min-w-80 p-4 flex flex-col gap-4">
			<div className=" flex flex-col gap-1">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Library</h3>
				<Button variant={'ghost'} style={{ justifyContent: 'flex-start' }}>
					<div style={{ display: 'flex', gap: '10px' }}>
						<Medal className="h-5 w-5 mr-2" />
						Activity
					</div>
					<Badge style={{ marginLeft: 'auto' }}>26</Badge>
				</Button>

				<Button variant={'ghost'} style={{ justifyContent: 'flex-start', overflow: 'visible' }}>
					<div style={{ display: 'flex', gap: '10px' }}>
						<Route className="h-5 w-5 mr-2" />
						Routes
					</div>

					<Badge style={{ marginLeft: 'auto' }}>26</Badge>
				</Button>
				<Button variant={'ghost'} style={{ justifyContent: 'flex-start' }}>
					<div style={{ display: 'flex', gap: '10px' }}>
						<MapPin className="h-5 w-5 mr-2" />
						Waypoint
					</div>

					<Badge style={{ marginLeft: 'auto' }}>26</Badge>
				</Button>
			</div>
			<div className="grow gap-2">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Nearby</h3>
				{/* Hahah, denne må fikses. Mye lok her, men noe da! */}
				<ScrollArea className="h-96">
					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>

					<Card className="mb-2">
						<CardHeader>
							<CardTitle>Activity name</CardTitle>
							<CardDescription>some cool stuff</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
					</Card>
				</ScrollArea>
			</div>
			<div>
				<Button variant={'secondary'}>
					<Settings className="h-5 w-5 mr-2" />
					Settings
				</Button>
			</div>
		</div>
	);
}
