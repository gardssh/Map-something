'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Navbar() {
	const { user, signOut } = useAuth();
	const router = useRouter();
	const firstName = user?.user_metadata?.first_name || '';
	const displayName = firstName || 'User';

	const handleSignOut = async () => {
		await signOut();
		router.push('/');
		router.refresh();
	};

	return (
		<nav className="w-full h-14 bg-[#FFFFFF] fixed top-0 left-0 border-b">
			<div className="w-full h-full px-4 flex items-center">
				{/* Logo and Name */}
				<Link href="/" className="flex items-center gap-4 pl-4 hover:opacity-80 transition-opacity">
					<div className="relative w-10 h-10 overflow-hidden rounded-2xl">
						<Image src="/favicon.svg" alt="Villspor Logo" fill className="object-cover" />
					</div>
					<h1 className="text-[#1D1B20] text-xl font-medium">Villspor</h1>
				</Link>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Profile Section - Only show when user is logged in */}
				{user && (
					<div className="pr-4">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="flex items-center gap-2">
									<Avatar className="h-8 w-8">
										<AvatarImage src={user?.user_metadata?.avatar_url} />
										<AvatarFallback>{firstName ? firstName[0] : 'U'}</AvatarFallback>
									</Avatar>
									<span className="text-[#1E1E1E] text-sm">{displayName}</span>
									<ChevronDown className="h-4 w-4 text-[#1C1A1F]" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem asChild>
									<Link href="/profile">Profile Settings</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/dashboard">Dashboard</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</div>
		</nav>
	);
}
