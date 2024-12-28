'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ElevationPoint {
	distance: number;
	elevation: number;
}

interface ElevationChartProps {
	data: ElevationPoint[];
}

export const ElevationChart = ({ data }: ElevationChartProps) => {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart data={data} margin={{ left: 48, right: 8, bottom: 24, top: 8 }} height={300}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="distance"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => `${value.toFixed(1)} km`}
					scale="linear"
					domain={[0, 'auto']}
					allowDataOverflow={false}
					type="number"
					interval="preserveEnd"
					minTickGap={30}
				/>
				<YAxis
					dataKey="elevation"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => `${value.toFixed(0)}m`}
					domain={['auto', 'auto']}
					padding={{ top: 10, bottom: 10 }}
					allowDataOverflow={false}
					interval="preserveStartEnd"
					width={40}
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
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						return (
							<div className="rounded-lg border bg-background p-2 shadow-md">
								<div className="mb-1 text-sm font-medium">
									Distance: {Number(payload[0].payload.distance).toFixed(1)} km
								</div>
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm text-muted-foreground">Elevation</span>
									<span className="text-sm font-medium">{Number(payload[0].value).toFixed(0)}m</span>
								</div>
							</div>
						);
					}}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
};
