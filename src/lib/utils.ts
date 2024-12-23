import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function categorizeActivity(sportType: string) {
	const footSports = ['Run', 'Walk', 'Hike', 'Trail Run'];
	const cycleSports = ['Ride', 'Mountain Bike', 'Gravel Bike', 'E-Bike Ride'];
	const waterSports = ['Swim', 'Kayak', 'Canoe', 'Row', 'Stand Up Paddle'];
	const winterSports = ['Alpine Ski', 'Nordic Ski', 'Backcountry Ski', 'Snowboard', 'Snowshoe'];

	if (footSports.includes(sportType)) return 'Foot Sports';
	if (cycleSports.includes(sportType)) return 'Cycle Sports';
	if (waterSports.includes(sportType)) return 'Water Sports';
	if (winterSports.includes(sportType)) return 'Winter Sports';
	return 'Other Sports';
}

