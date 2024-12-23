import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface EditDetailsFormProps {
	initialName: string;
	initialComments: string | null;
	onSave: (name: string, comments: string) => void;
	onCancel: () => void;
}

export function EditDetailsForm({ initialName, initialComments, onSave, onCancel }: EditDetailsFormProps) {
	const [name, setName] = useState(initialName);
	const [comments, setComments] = useState(initialComments || '');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(name, comments);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">Edit Details</h3>
				<button type="button" onClick={onCancel} className="p-2 hover:bg-accent rounded-full">
					<X className="h-4 w-4" />
				</button>
			</div>
			<div className="space-y-2">
				<label htmlFor="name" className="text-sm font-medium">
					Name
				</label>
				<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
			</div>
			<div className="space-y-2">
				<label htmlFor="comments" className="text-sm font-medium">
					Comments
				</label>
				<Textarea
					id="comments"
					value={comments}
					onChange={(e) => setComments(e.target.value)}
					placeholder="Enter comments"
					rows={3}
				/>
			</div>
			<div className="flex gap-2">
				<Button type="submit" className="flex-1">
					Save
				</Button>
				<Button type="button" variant="outline" onClick={onCancel} className="flex-1">
					Cancel
				</Button>
			</div>
		</form>
	);
}
