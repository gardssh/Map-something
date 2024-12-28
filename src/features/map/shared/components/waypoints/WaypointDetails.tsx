'use client';

import { useState } from 'react';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { Textarea } from '@/features/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/shared/components/ui/card';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import type { DbWaypoint } from '@/types/supabase';

interface WaypointDetailsProps {
	waypoint: DbWaypoint;
	onDelete?: (waypointId: string) => void;
	onEdit?: (waypointId: string, newName: string, newComment: string) => void;
}

export function WaypointDetails({ waypoint, onDelete, onEdit }: WaypointDetailsProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editingName, setEditingName] = useState(waypoint.name);
	const [editingComments, setEditingComments] = useState(waypoint.comments || '');

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				{isEditing ? (
					<Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-8" />
				) : (
					<h3 className="text-2xl font-semibold">{waypoint.name}</h3>
				)}
				<div className="flex gap-1">
					{isEditing ? (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									if (onEdit) {
										onEdit(waypoint.id, editingName, editingComments);
									}
									setIsEditing(false);
								}}
							>
								<Check className="h-4 w-4 mr-1" />
								Save
							</Button>
							<Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
								<X className="h-4 w-4 mr-1" />
								Cancel
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => setIsEditing(true)}>
								<Edit2 className="h-4 w-4" />
								<span className="sr-only">Edit waypoint</span>
							</Button>
							{onDelete && (
								<Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => onDelete(waypoint.id)}>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">Delete waypoint</span>
								</Button>
							)}
						</>
					)}
				</div>
			</div>

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
					{isEditing ? (
						<Textarea
							placeholder="Add comments..."
							value={editingComments}
							onChange={(e) => setEditingComments(e.target.value)}
							className="min-h-[100px]"
						/>
					) : (
						<p className="text-sm">{waypoint.comments || 'No comments'}</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
