'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Settings } from 'lucide-react';
import Link from 'next/link';

export function NavUser() {
	const { user, signOut } = useAuth();

	if (!user) return null;

	const fullName = user.user_metadata?.name || user.user_metadata?.full_name || '';
	const userAvatar = user.user_metadata?.avatar_url;

	const nameInitials = fullName
		.split(' ')
		.map((name: string) => name[0])
		.filter(Boolean);

	const initials =
		nameInitials.length > 3 ? `${nameInitials[0]}${nameInitials[nameInitials.length - 1]}` : nameInitials.join('');

	const displayInitials = initials.toUpperCase() || 'U';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full md:h-10 md:w-10">
					<Avatar className="h-8 w-8 md:h-10 md:w-10">
						<AvatarImage src={userAvatar} alt={fullName} />
						<AvatarFallback>{displayInitials}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[var(--sidebar-width-icon)]" align="start" sideOffset={8}>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{fullName}</p>
						<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile" className="flex items-center">
						<Settings className="mr-2 h-4 w-4" />
						Profile Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
