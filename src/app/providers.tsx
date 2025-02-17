'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<Toaster position="top-right" />
			{children}
		</AuthProvider>
	);
}
