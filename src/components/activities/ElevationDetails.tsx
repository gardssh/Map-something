'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ElevationProfile from '@/components/elevation/ElevationProfile';
import type { ElevationStats } from '@/services/elevation/types';
import type { ActivityWithMap } from '@/types/activity';
import type { DbRoute } from '@/types/supabase';
import { getElevationData } from '@/services/elevation';

interface ElevationDetailsProps {
	source: ActivityWithMap | DbRoute;
}

export function ElevationDetails({ source }: ElevationDetailsProps) {
	const [stats, setStats] = useState<ElevationStats>({
		totalAscent: 0,
		totalDescent: 0,
		maxElevation: 0,
		minElevation: 0,
	});

	useEffect(() => {
		async function fetchElevationData() {
			// Add missing properties for ActivityWithMap to match Activity type
			const sourceWithDefaults =
				'sport_type' in source
					? {
							...source,
							selected: true,
							visible: true,
							properties: source.properties || {},
							source_id: source.source_id || 'activities',
							layer_id: source.layer_id || `activity-${source.id}`,
							is_hovered: source.is_hovered || false,
						}
					: source;

			const { stats } = await getElevationData(sourceWithDefaults as any);
			setStats(stats);
		}

		fetchElevationData();
	}, [source]);

	const polyline = 'summary_polyline' in source ? source.summary_polyline : '';

	return (
		<div className="w-full mb-6">
			<Card>
				<CardContent className="p-4">
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<div className="text-sm text-muted-foreground">Total Ascent</div>
							<div className="text-lg font-semibold">{stats.totalAscent}m</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">Total Descent</div>
							<div className="text-lg font-semibold">{stats.totalDescent}m</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">Max Elevation</div>
							<div className="text-lg font-semibold">{stats.maxElevation}m</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">Min Elevation</div>
							<div className="text-lg font-semibold">{stats.minElevation}m</div>
						</div>
					</div>
					{polyline && <ElevationProfile polyline={polyline} height={150} />}
				</CardContent>
			</Card>
		</div>
	);
}
