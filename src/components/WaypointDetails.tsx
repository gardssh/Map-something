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
		// Update local state and waypoint object immediately
		setCurrentComments(editingWaypointComments);
		waypoint.name = editingWaypointName;
		waypoint.comments = editingWaypointComments;
		onEditCancel();
	};

	return (
		<div className="p-4 space-y-4 relative">
			<div className="space-y-4">
				<div className="flex justify-between items-start">
					<div className="flex-1 mr-4">
						{editingWaypointId === waypoint.id ? (
							<div className="space-y-2">
								<Input
									value={editingWaypointName}
									onChange={(e) => setEditingWaypointName(e.target.value)}
									placeholder="Waypoint name"
									className="font-semibold text-lg"
								/>
								<Textarea
									value={editingWaypointComments}
									onChange={(e) => setEditingWaypointComments(e.target.value)}
									placeholder="Add a comment..."
									className="min-h-[100px]"
								/>
							</div>
						) : (
							<>
								<h2 className="text-xl font-semibold">{waypoint.name}</h2>
								{waypoint.comments && <p className="text-sm text-muted-foreground mt-2">{waypoint.comments}</p>}
							</>
						)}
					</div>
					<div className="flex gap-2">
						{editingWaypointId === waypoint.id ? (
							<>
								<Button variant="ghost" size="icon" onClick={handleSave}>
									<Check className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon" onClick={onEditCancel}>
									<X className="h-4 w-4" />
								</Button>
							</>
						) : (
							<>
								<Button variant="ghost" size="icon" onClick={onEditStart}>
									<Edit2 className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={(e) => {
										e.stopPropagation();
										onWaypointDelete?.(waypoint.id);
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon" onClick={onClose}>
									<X className="h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">Coordinates</p>
						<p>
							{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Created</p>
						<p>{new Date(waypoint.created_at).toLocaleString()}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
