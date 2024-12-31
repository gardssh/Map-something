'use client';

import { Navigation, Medal, Route, MapPin, PanelLeft, PanelLeftClose, Snowflake } from 'lucide-react';
import { NavUser } from '@/components/nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

export const navigationItems = [
	{ id: 'nearby', icon: Navigation, label: 'Nearby' },
	{ id: 'activities', icon: Medal, label: 'Activities' },
	{ id: 'routes', icon: Route, label: 'Routes' },
	{ id: 'waypoints', icon: MapPin, label: 'Waypoints' },
	{ id: 'avalanche', icon: Snowflake, label: 'Avalanche' },
] as const;

interface SidebarNavigationProps {
	activeItem: string;
	open: boolean;
	setOpen: (open: boolean) => void;
	onNavigate: (itemId: string) => void;
}

export function SidebarNavigation({ activeItem, open, setOpen, onNavigate }: SidebarNavigationProps) {
	return (
		<Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton isActive={open} className="px-2.5 md:px-2" onClick={() => setOpen(!open)}>
							{open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
							<span>Toggle Sidebar</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<div className="mx-2 my-2 h-[1px] bg-border" />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent className="px-1.5 md:px-0">
						<SidebarMenu>
							{navigationItems.map((item) => (
								<SidebarMenuItem key={item.id}>
									<SidebarMenuButton
										tooltip={{
											children: item.label,
											hidden: false,
										}}
										onClick={() => onNavigate(item.id)}
										isActive={activeItem === item.id}
										className="px-2.5 md:px-2"
									>
										<item.icon className="h-4 w-4" />
										<span>{item.label}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
