'use client';

import { Navigation, Medal, Route, MapPin, AlertTriangle, PanelLeftClose, PanelLeft, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export const navigationItems = [
	{ id: 'nearby', label: 'Nearby', icon: <Navigation className="h-4 w-4" /> },
	{ id: 'activities', label: 'Activities', icon: <Medal className="h-4 w-4" /> },
	{ id: 'routes', label: 'Routes', icon: <Route className="h-4 w-4" /> },
	{ id: 'waypoints', label: 'Waypoints', icon: <MapPin className="h-4 w-4" /> },
	{ id: 'avalanche', label: 'Avalanche', icon: <AlertTriangle className="h-4 w-4" /> },
];

interface SidebarNavigationProps {
	activeItem: string;
	open: boolean;
	setOpen: (open: boolean) => void;
	onNavigate: (itemId: string) => void;
}

export function SidebarNavigation({ activeItem, open, setOpen, onNavigate }: SidebarNavigationProps) {
	const { signOut } = useAuth();

	return (
		<div className="h-full py-4 flex flex-col px-2">
			<button
				onClick={() => setOpen(!open)}
				className="w-full p-2 mb-2 flex justify-center hover:bg-accent rounded-md transition-colors"
				title={open ? 'Hide sidebar' : 'Show sidebar'}
			>
				{open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
			</button>
			<nav className="space-y-1.5 flex-1">
				{navigationItems.map((item) => (
					<button
						key={item.id}
						onClick={() => onNavigate(item.id)}
						className={`w-full p-2 flex justify-center hover:bg-accent rounded-md transition-colors ${
							activeItem === item.id ? 'bg-accent' : ''
						}`}
						title={item.label}
					>
						{item.icon}
					</button>
				))}
			</nav>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						className="w-full p-2 flex justify-center hover:bg-accent rounded-md transition-colors"
						title="User menu"
					>
						<User className="h-4 w-4" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					side="right"
					sideOffset={5}
					align="end"
					avoidCollisions={false}
					className="w-48 -translate-y-[24px]"
				>
					<DropdownMenuItem asChild>
						<Link href="/profile" className="flex items-center">
							<User className="h-4 w-4 mr-2" />
							Profile
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => signOut()} className="flex items-center text-destructive">
						<LogOut className="h-4 w-4 mr-2" />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
