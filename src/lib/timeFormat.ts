export function formatTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}`;
	}
	return `${minutes} min`;
} 