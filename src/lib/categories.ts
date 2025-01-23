export const ACTIVITY_CATEGORIES = [
  'Foot Sports',
  'Cycle Sports',
  'Water Sports',
  'Winter Sports',
  'Other Sports',
] as const;

export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];

export function categorizeActivity(sportType: string): ActivityCategory {
  const footSports = [
    'Run', 
    'Hike', 
    'Walk', 
    'Trail Run'
  ];

  const cycleSports = [
    'Ride', 
    'Mountain Bike', 
    'Gravel Bike', 
    'GravelRide'
  ];

  const waterSports = [
    'Kayak',
    'Kayaking',
    'Sail',
    'Rowing'
  ];

  const winterSports = [
    'Ski', 
    'Snowboard', 
    'Cross Country Ski', 
    'Backcountry Ski',
    'BackcountrySki',
    'NordicSki',
    'Alpine Ski',
    'AlpineSki',
    'Snowshoe'
  ];

  const otherSports = [
    'WeightTraining',
    'Workout',
    'RockClimbing',
    'VirtualRide',
    'Swim',
    'Tennis',
    'Golf'
  ];

  if (otherSports.includes(sportType)) return 'Other Sports';
  if (footSports.includes(sportType)) return 'Foot Sports';
  if (cycleSports.includes(sportType)) return 'Cycle Sports';
  if (waterSports.includes(sportType)) return 'Water Sports';
  if (winterSports.includes(sportType)) return 'Winter Sports';
  return 'Other Sports';
} 