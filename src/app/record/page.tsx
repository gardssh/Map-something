'use client';

import { ActivityRecorder } from '@/components/recording/ActivityRecorder';

export default function RecordPage() {
	return (
		<div className="container mx-auto max-w-2xl py-8">
			<h1 className="text-2xl font-bold mb-6 text-center">Record Activity</h1>
			<ActivityRecorder />
		</div>
	);
}
