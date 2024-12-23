'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartTooltipContentProps {
	className?: string;
	nameKey?: string;
	formatter?: (value: any) => [string, string];
	labelFormatter?: (value: any, payload: any) => string;
	active?: boolean;
	payload?: any[];
}

export function ChartTooltipContent({
	className,
	nameKey,
	formatter,
	labelFormatter,
	active,
	payload,
}: ChartTooltipContentProps) {
	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className={cn('rounded-lg border bg-background p-2 shadow-md', className)}>
			{labelFormatter && <div className="mb-1 text-sm font-medium">{labelFormatter(payload[0].value, payload)}</div>}
			<div className="flex flex-col gap-1">
				{payload.map((entry, index) => {
					const [label, value] = formatter ? formatter(entry.value) : [entry.name, entry.value];
					return (
						<div key={`item-${index}`} className="flex items-center justify-between gap-2">
							<span className="text-sm text-muted-foreground">{label}</span>
							<span className="text-sm font-medium">{value}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
