import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { parseGPX } from '@/utils/gpxParser';
import type { DrawnRoute } from '@/types/route';

interface GpxUploadProps {
	onRouteSave?: (route: DrawnRoute) => void;
	userId: string;
	className?: string;
}

export function GpxUpload({ onRouteSave, userId, className }: GpxUploadProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsLoading(true);
		try {
			const text = await file.text();
			const { name, geometry } = parseGPX(text);

			const route: DrawnRoute = {
				id: `gpx-${Date.now()}`,
				name,
				user_id: userId,
				geometry,
				created_at: new Date().toISOString(),
				distance: 0,
				source: 'gpx_upload',
			};

			console.log('[GpxUpload] Saving GPX route:', route);
			onRouteSave?.(route);
		} catch (error) {
			console.error('Error parsing GPX file:', error);
			// TODO: Add error toast notification
		} finally {
			setIsLoading(false);
			// Reset the input
			event.target.value = '';
		}
	};

	return (
		<div className={className}>
			<input
				type="file"
				accept=".gpx"
				onChange={handleFileUpload}
				className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
				disabled={isLoading}
			/>
		</div>
	);
}
