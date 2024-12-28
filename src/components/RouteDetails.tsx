'use client';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Check, X, Trash2, Download } from 'lucide-react';
import type { DbRoute } from '@/types/supabase';
import type { RouteWithDistance } from '@/types/route';
import { ElevationDetails } from './ElevationDetails';
import { LineString } from 'geojson';

interface RouteDetailsProps {
	route: DbRoute;
	editingRouteId: string | null;
	editingName: string;
	editingComments: string;
	onEditStart: () => void;
	onEditCancel: () => void;
	onRouteRename?: (routeId: string, newName: string) => void;
	onRouteDelete?: (routeId: string) => void;
	onRouteCommentUpdate?: (routeId: string, comments: string) => void;
	onClose?: () => void;
	setEditingName: (name: string) => void;
	setEditingComments: (comments: string) => void;
}

export function RouteDetails({
	route,
	editingRouteId,
	editingName,
	editingComments,
	onEditStart,
	onEditCancel,
	onRouteRename,
	onRouteDelete,
	onRouteCommentUpdate,
	onClose,
	setEditingName,
	setEditingComments,
}: RouteDetailsProps) {
	return (
		<div className="grow flex flex-col h-full relative">
			{/* Scrollable content area */}
			<div className="flex-1 overflow-y-auto p-4 pb-20">
				<div className="flex justify-between items-center">
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{route.name}</h3>
					<div className="flex gap-1">
						<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={onEditStart}>
							<Edit2 className="h-4 w-4" />
							<span className="sr-only">Edit route</span>
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
						<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={onClose}>
							<X className="h-4 w-4" />
							<span className="sr-only">Close route</span>
						</Button>
					</div>
				</div>

				{editingRouteId === route.id ? (
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
									onRouteRename?.(route.id, editingName);
									onRouteCommentUpdate?.(route.id, editingComments);
									onEditCancel();
								}}
							>
								<Check className="h-4 w-4 mr-1" />
								Save
							</Button>
							<Button variant="ghost" size="sm" onClick={onEditCancel}>
								<X className="h-4 w-4 mr-1" />
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<>
						<div className="space-y-4 mt-4">
							<Card>
								<CardHeader>
									<p>Distance: {(route as RouteWithDistance)?.distance?.toFixed(2) || 'N/A'}km</p>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader>
									<p>Created: {new Date(route.created_at).toLocaleString()}</p>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Comments</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm">{route.comments || 'No comments'}</p>
								</CardContent>
							</Card>
							<ElevationDetails source={route} />
						</div>
					</>
				)}
			</div>

			{/* Fixed download button at the bottom */}
			{!editingRouteId && (
				<div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
					<Button
						variant="secondary"
						className="w-full flex gap-2"
						onClick={() => {
							if (!route.geometry) return;

							// Create GPX content
							const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Villspor">
    <trk>
        <n>${route.name}<n>
        <trkseg>
            ${(route.geometry as LineString).coordinates
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
							a.download = `${route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
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
			)}
		</div>
	);
}
