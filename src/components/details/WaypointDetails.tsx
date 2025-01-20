'use client';

import { Edit2, Trash2, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardHeader, CardContent } from '../ui/card';
import type { DbWaypoint } from '@/types/supabase';
import { useState, useEffect } from 'react';

interface WaypointDetailsProps {
	waypoint: DbWaypoint;
	onDelete?: (waypointId: string) => void;
	onEdit?: (waypointId: string, newName: string, newComment: string) => void;
	onClose?: () => void;
}

export function WaypointDetails({ waypoint, onDelete, onEdit, onClose }: WaypointDetailsProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(waypoint.name);
	const [editComment, setEditComment] = useState(waypoint.comments || '');

	useEffect(() => {
		setEditName(waypoint.name);
		setEditComment(waypoint.comments || '');
	}, [waypoint]);

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
		<div id="slide" className="grow p-4 flex flex-col gap-4 relative overflow-y-auto">
			<div className="flex justify-between items-start bg-muted/50 p-4 rounded-lg">
				<div>
					<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{waypoint.name}</h3>
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
							{onClose && (
								<Button variant="ghost" size="icon" onClick={onClose}>
									<X className="h-4 w-4" />
								</Button>
							)}
						</>
					)}
				</div>
			</div>

			{isEditing ? (
				<Card>
					<CardContent className="p-4 space-y-2">
						<Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Waypoint name" />
						<Textarea
							value={editComment}
							onChange={(e) => setEditComment(e.target.value)}
							placeholder="Add a comment..."
							className="min-h-[100px]"
						/>
					</CardContent>
				</Card>
			) : (
				<>
					<Card>
						<CardHeader>
							<p>Coordinates</p>
							<p className="text-lg font-medium">
								{waypoint.coordinates[0].toFixed(6)}, {waypoint.coordinates[1].toFixed(6)}
							</p>
						</CardHeader>
					</Card>

					{waypoint.comments && (
						<Card>
							<CardHeader>
								<p>Comments</p>
								<p className="text-lg font-medium">{waypoint.comments}</p>
							</CardHeader>
						</Card>
					)}
				</>
			)}
		</div>
	);
}
