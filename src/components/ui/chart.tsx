'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltipContent } from './chart-tooltip';

export type { ChartConfig };
export { ChartContainer, ChartTooltip, ChartTooltipContent };

interface ChartConfig {
	[key: string]: {
		label: string;
		color: string;
	};
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactElement;
	config: ChartConfig;
}

function ChartContainer({ children, config, ...props }: ChartContainerProps) {
	return (
		<div {...props} className="relative w-full h-[220px] px-6">
			<div
				className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground"
				style={{ marginLeft: '-12px' }}
			>
				Elevation (m)
			</div>
			<div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Distance (km)</div>
			<ResponsiveContainer width="100%" height="100%">
				{children}
			</ResponsiveContainer>
		</div>
	);
}

const ChartTooltip = Tooltip;
