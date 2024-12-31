'use client';

import { Navigation, Medal, Route, MapPin, User, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
	activeItem: string;
	onItemSelect: (item: string) => void;
}

const navigationItems = [
	{ id: 'nearby', icon: Navigation, label: 'Nearby' },
	{ id: 'activities', icon: Medal, label: 'Activities' },
	{ id: 'routes', icon: Route, label: 'Routes' },
	{ id: 'waypoints', icon: MapPin, label: 'Waypoints' },
	{ id: 'avalanche', icon: Snowflake, label: 'Avalanche' },
	{ id: 'profile', icon: User, label: 'Profile' },
];

export function MobileNavBar({ activeItem, onItemSelect }: MobileNavBarProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-[10]">
			<nav className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom,16px)]">
				{navigationItems.map((item) => {
					const Icon = item.icon;
					return (
						<button
							key={item.id}
							onClick={() => onItemSelect(item.id)}
							className={cn(
								'flex flex-col items-center justify-center w-full h-full',
								'text-xs gap-1 transition-colors',
								activeItem === item.id ? 'text-primary' : 'text-muted-foreground hover:text-primary'
							)}
						>
							<Icon className="h-5 w-5" />
							<span>{item.label}</span>
						</button>
					);
				})}
			</nav>
		</div>
	);
}
