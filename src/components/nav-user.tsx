'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/features/shared/components/ui/avatar';
import { Button } from '@/features/shared/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/features/shared/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Menu } from 'lucide-react';

export function NavUser() {
	const { user, signOut } = useAuth();

	if (!user) return null;

	const userName = user.user_metadata?.name || 'User';
	const userAvatar = user.user_metadata?.avatar_url;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full md:h-10 md:w-10">
					<Avatar className="h-8 w-8 md:h-10 md:w-10">
						<AvatarImage src={userAvatar} alt={userName} />
						<AvatarFallback>{userName.charAt(0)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{userName}</p>
						<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
