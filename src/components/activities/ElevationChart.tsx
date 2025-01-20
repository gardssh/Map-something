'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { ChartTooltipContent } from '@/components/ui/chart-tooltip';

interface ElevationPoint {
	distance: number; // distance in km
	elevation: number; // elevation in meters
}

interface ElevationChartProps {
	data: ElevationPoint[];
}

export function ElevationChart({ data }: ElevationChartProps) {
	if (data.length === 0) return null;

	const chartConfig = {
		elevation: {
			label: 'Elevation (m)',
			color: 'hsl(var(--primary))',
		},
	};

	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg">Elevation Profile</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="bg-transparent">
					<ChartContainer config={chartConfig}>
						<LineChart data={data} margin={{ left: 32, right: 16, bottom: 16, top: 8 }} height={160}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
							<XAxis
								dataKey="distance"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value) => `${value.toFixed(1)}`}
								scale="linear"
								domain={[0, 'auto']}
								allowDataOverflow={false}
								type="number"
								interval="preserveEnd"
								minTickGap={50}
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								dataKey="elevation"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value) => `${value.toFixed(0)}`}
								domain={['auto', 'auto']}
								padding={{ top: 10, bottom: 10 }}
								allowDataOverflow={false}
								interval="preserveStartEnd"
								width={40}
								tick={{ fontSize: 12 }}
							/>
							<Line
								dataKey="elevation"
								type="monotone"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={false}
								isAnimationActive={false}
							/>
							<Tooltip
								cursor={false}
								content={
									<ChartTooltipContent
										className="w-[150px]"
										nameKey="elevation"
										formatter={(value) => [`${Number(value).toFixed(0)}m`, '']}
										labelFormatter={(value, payload) => {
											if (payload && payload[0]) {
												const distance = payload[0].payload.distance;
												return `${Number(distance).toFixed(1)} km`;
											}
											return '0.0 km';
										}}
									/>
								}
							/>
						</LineChart>
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	);
}
