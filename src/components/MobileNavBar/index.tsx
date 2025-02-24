import { Map, Navigation, Route, MapPin, User } from 'lucide-react';

interface MobileNavBarProps {
	activeItem: string;
	onItemSelect: (item: string) => void;
}

export function MobileNavBar({ activeItem, onItemSelect }: MobileNavBarProps) {
	return (
		<div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-4 z-20">
			<button
				className={`flex flex-col items-center justify-center space-y-1 ${
					activeItem === 'nearby' ? 'text-primary' : 'text-muted-foreground'
				}`}
				onClick={() => onItemSelect('nearby')}
			>
				<Navigation className="h-6 w-6" />
				<span className="text-[11px]">Nearby</span>
			</button>

			<button
				className={`flex flex-col items-center justify-center space-y-1 ${
					activeItem === 'routes' ? 'text-primary' : 'text-muted-foreground'
				}`}
				onClick={() => onItemSelect('routes')}
			>
				<Route className="h-6 w-6" />
				<span className="text-[11px]">Routes</span>
			</button>

			<button
				className={`flex flex-col items-center justify-center space-y-1 ${
					activeItem === 'waypoints' ? 'text-primary' : 'text-muted-foreground'
				}`}
				onClick={() => onItemSelect('waypoints')}
			>
				<MapPin className="h-6 w-6" />
				<span className="text-[11px]">Waypoints</span>
			</button>

			<button
				className={`flex flex-col items-center justify-center space-y-1 ${
					activeItem === 'profile' ? 'text-primary' : 'text-muted-foreground'
				}`}
				onClick={() => onItemSelect('profile')}
			>
				<User className="h-6 w-6" />
				<span className="text-[11px]">Profile</span>
			</button>
		</div>
	);
}
