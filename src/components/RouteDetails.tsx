'use client';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Check, X, Trash2 } from 'lucide-react';
import type { DbRoute } from '@/types/supabase';
import type { RouteWithDistance } from '@/types/route';
import { ElevationDetails } from './ElevationDetails';

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
		<div className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
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
				</>
			)}
		</div>
	);
}
