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
import { Menu, User, Coffee, MessageCircle, LogOut } from 'lucide-react';
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
				<Button variant="ghost" className="relative h-7 w-7 rounded-full">
					<Avatar className="h-7 w-7">
						<AvatarImage src={userAvatar} alt={fullName} />
						<AvatarFallback>{displayInitials}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48" align="start" sideOffset={8}>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{fullName}</p>
						<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile" className="w-full flex items-center">
						<User className="mr-2 h-4 w-4" />
						Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<a
						href="https://buymeacoffee.com/gardsh"
						target="_blank"
						rel="noopener noreferrer"
						className="w-full flex items-center"
					>
						<Coffee className="mr-2 h-4 w-4" />
						Donate
					</a>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<a href="mailto:d48bwgqhrv@privaterelay.appleid.com" className="w-full flex items-center">
						<MessageCircle className="mr-2 h-4 w-4" />
						Send Feedback
					</a>
				</DropdownMenuItem>
				<DropdownMenuItem className="w-full flex items-center" onClick={() => signOut()}>
					<LogOut className="mr-2 h-4 w-4" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
