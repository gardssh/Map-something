'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	return (
		<div className={cn('flex min-h-screen flex-col md:flex-row', 'transition-all duration-300 ease-in-out')}>
			{children}
		</div>
	);
}
