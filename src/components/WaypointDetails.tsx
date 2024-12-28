'use client';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Edit2, Check, X, Trash2 } from 'lucide-react';
import type { DbWaypoint } from '@/types/supabase';
import { useState, useEffect } from 'react';

interface WaypointDetailsProps {
	waypoint: DbWaypoint;
	editingWaypointId: string | null;
	editingWaypointName: string;
	editingWaypointComments: string;
	onEditStart: () => void;
	onEditCancel: () => void;
	onWaypointRename?: (waypointId: string, newName: string) => void;
	onWaypointDelete?: (waypointId: string) => void;
	onWaypointCommentUpdate?: (waypointId: string, comments: string) => void;
	onClose?: () => void;
	setEditingWaypointName: (name: string) => void;
	setEditingWaypointComments: (comments: string) => void;
}

export function WaypointDetails({
	waypoint,
	editingWaypointId,
	editingWaypointName,
	editingWaypointComments,
	onEditStart,
	onEditCancel,
	onWaypointRename,
	onWaypointDelete,
	onWaypointCommentUpdate,
	onClose,
	setEditingWaypointName,
	setEditingWaypointComments,
}: WaypointDetailsProps) {
	// Local state to track the current comments
	const [currentComments, setCurrentComments] = useState(waypoint.comments || '');

	// Update local state when waypoint changes
	useEffect(() => {
		setCurrentComments(waypoint.comments || '');
	}, [waypoint.comments]);

	const handleSave = () => {
		onWaypointRename?.(waypoint.id, editingWaypointName);
		onWaypointCommentUpdate?.(waypoint.id, editingWaypointComments);
		// Update local state immediately
		setCurrentComments(editingWaypointComments);
		onEditCancel();
	};

	return (
		<div className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
			<div className="flex justify-between items-center">
				<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{waypoint.name}</h3>
				<div className="flex gap-1">
					<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={onEditStart}>
						<Edit2 className="h-4 w-4" />
						<span className="sr-only">Edit waypoint</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 p-0"
						onClick={(e) => {
							e.stopPropagation();
							onWaypointDelete?.(waypoint.id);
						}}
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">Delete waypoint</span>
					</Button>
					<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={onClose}>
						<X className="h-4 w-4" />
						<span className="sr-only">Close waypoint</span>
					</Button>
				</div>
			</div>
			{editingWaypointId === waypoint.id ? (
				<div className="space-y-4">
					<div className="flex gap-2">
						<Input
							value={editingWaypointName}
							onChange={(e) => setEditingWaypointName(e.target.value)}
							className="h-8"
						/>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Comments</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								placeholder="Add comments..."
								value={editingWaypointComments}
								onChange={(e) => setEditingWaypointComments(e.target.value)}
								className="min-h-[100px]"
							/>
						</CardContent>
					</Card>
					<div className="flex gap-2 justify-end">
						<Button variant="ghost" size="sm" onClick={handleSave}>
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
							<p>
								Coordinates: {waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
							</p>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<p>Created: {new Date(waypoint.created_at).toLocaleString()}</p>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Comments</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm">{currentComments || 'No comments'}</p>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
