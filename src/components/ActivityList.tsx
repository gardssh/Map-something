'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/timeFormat';
import { ACTIVITY_CATEGORIES, ActivityCategory, categorizeActivity } from '@/lib/categories';
import type { DbStravaActivity } from '@/types/supabase';
import { useRef } from 'react';

interface ActivityMap {
	summary_polyline: string;
}

interface ActivityWithMap extends DbStravaActivity {
	map: ActivityMap;
}

interface ActivityListProps {
	activities: ActivityWithMap[];
	visibleActivitiesId: number[];
	selectedRouteId: string | number | null;
	onActivitySelect?: (activity: ActivityWithMap | null) => void;
	selectedCategories: ActivityCategory[];
	setSelectedCategories: (categories: ActivityCategory[]) => void;
	mode: 'nearby' | 'all';
}

export function ActivityList({
	activities,
	visibleActivitiesId,
	selectedRouteId,
	onActivitySelect,
	selectedCategories,
	setSelectedCategories,
	mode,
}: ActivityListProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	const toggleCategory = (category: ActivityCategory) => {
		setSelectedCategories(
			selectedCategories.includes(category)
				? selectedCategories.filter((c) => c !== category)
				: [...selectedCategories, category]
		);
	};

	const visibleActivities =
		mode === 'nearby'
			? activities.filter((activity) => visibleActivitiesId.includes(Number(activity.id)))
			: activities.filter((activity) =>
					selectedCategories.includes(categorizeActivity(activity.sport_type) as ActivityCategory)
				);

	return (
		<div className="grow gap-2 overflow-y-auto">
			<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				{mode === 'nearby' ? 'Nearby' : 'All Activities'}
			</h3>

			{mode === 'all' && (
				<div className="flex flex-wrap gap-2 mb-4">
					{ACTIVITY_CATEGORIES.map((category) => (
						<Badge
							key={category}
							variant="outline"
							className={cn(
								'cursor-pointer hover:bg-primary/20 transition-colors',
								selectedCategories.includes(category)
									? 'bg-primary text-primary-foreground hover:bg-primary/90'
									: 'bg-background'
							)}
							onClick={() => toggleCategory(category)}
						>
							{category}
						</Badge>
					))}
				</div>
			)}

			{visibleActivities.map((activity: any) => (
				<div key={activity.id}>
					<Card
						className={'mb-2 hover:bg-accent cursor-pointer transition-colors'}
						onClick={() => onActivitySelect?.(activity)}
					>
						<CardHeader>
							<CardTitle>{activity.name}</CardTitle>
							<CardDescription>{activity.sport_type}</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Time: {formatTime(activity.moving_time)}</p>
						</CardContent>
					</Card>
					{activity.id === selectedRouteId && <div ref={scrollRef} />}
				</div>
			))}
		</div>
	);
}
