import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type ActivityCategory = 'Foot Sports' | 'Cycle Sports' | 'Water Sports' | 'Winter Sports' | 'Other Sports';

const activityCategories: { [name: string]: string[] } = {
	'Foot Sports': ['Run', 'Trail Run', 'Walk', 'Hike', 'Virtual Run'],
	'Cycle Sports': [
		'Ride',
		'Mountain Bike Ride',
		'GravelRide',
		'E-Bike Ride',
		'E-Mountain Bike Ride',
		'Velomobile',
		'Virtual Ride',
	],
	'Water Sports': ['Canoe', 'Kayaking', 'Kitesurf', 'Rowing', 'Stand Up Paddling', 'Surf', 'Swim', 'Windsurf', 'Sail'],
	'Winter Sports': ['Ice Skate', 'AlpineSki', 'BackcountrySki', 'NordicSki', 'Snowboard', 'Snowshoe'],
	'Other Sports': [
		'Handcycle',
		'Inline Skate',
		'RockClimbing',
		'Roller Ski',
		'Golf',
		'Skateboard',
		'Football (Soccer)',
		'Wheelchair',
		'Badminton',
		'Tennis',
		'Pickleball',
		'Crossfit',
		'Elliptical',
		'Stair Stepper',
		'WeightTraining',
		'Yoga',
		'Workout',
		'HIIT',
		'Pilates',
		'Table Tennis',
		'Squash',
		'Racquetball',
	],
};

const categoryColors: { [name: string]: string } = {
	'Foot Sports': '#FF5733', // Example color
	'Cycle Sports': '#33FF57',
	'Water Sports': '#3357FF',
	'Winter Sports': '#FF33A1',
	'Other Sports': '#FFC300',
	'Unknown Category': '#000000', // Default color for unknown categories
};

export function categorizeActivity(activityType: string) {
	for (const category in activityCategories) {
		if (activityCategories[category].includes(activityType)) {
			return category;
		}
	}
	return 'Unknown Category';
}

export function getActivityColor(activityType: string) {
	const category = categorizeActivity(activityType);
	return categoryColors[category] || categoryColors['Unknown Category'];
}
