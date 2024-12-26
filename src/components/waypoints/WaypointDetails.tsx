'use client';

import { Edit2, Trash2, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import type { DbWaypoint } from '@/types/supabase';
import { useState } from 'react';

interface WaypointDetailsProps {
	waypoint: DbWaypoint;
	onDelete?: (waypointId: string) => void;
	onEdit?: (waypointId: string, newName: string, newComment: string) => void;
}

export const WaypointDetails = ({ waypoint, onDelete, onEdit }: WaypointDetailsProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(waypoint.name);
	const [editComment, setEditComment] = useState(waypoint.comments || '');

	const handleSave = () => {
		if (!onEdit) return;
		if (editName.trim() === '') return;
		onEdit(waypoint.id as string, editName, editComment);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditName(waypoint.name);
		setEditComment(waypoint.comments || '');
		setIsEditing(false);
	};

	return (
		<div className="p-4 space-y-4">
			<div className="flex justify-between items-start">
				<div className="flex-1 mr-4">
					{isEditing ? (
						<div className="space-y-2">
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								placeholder="Waypoint name"
								className="font-semibold text-lg"
							/>
							<Textarea
								value={editComment}
								onChange={(e) => setEditComment(e.target.value)}
								placeholder="Add a comment..."
								className="min-h-[100px]"
							/>
						</div>
					) : (
						<>
							<h2 className="text-xl font-semibold">{waypoint.name}</h2>
							<p className="text-sm text-muted-foreground">
								{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
							</p>
							{waypoint.comments && <p className="text-sm text-muted-foreground mt-2">{waypoint.comments}</p>}
						</>
					)}
				</div>
				<div className="flex gap-2">
					{isEditing ? (
						<>
							<Button variant="ghost" size="icon" onClick={handleSave}>
								<Check className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="icon" onClick={handleCancel}>
								<X className="h-4 w-4" />
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									if (!onDelete) return;
									if (window.confirm('Are you sure you want to delete this waypoint?')) {
										onDelete(waypoint.id as string);
									}
								}}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
