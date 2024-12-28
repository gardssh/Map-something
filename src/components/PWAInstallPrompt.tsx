'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/features/shared/components/ui/button';
import { Download } from 'lucide-react';

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
	const [showPrompt, setShowPrompt] = useState(false);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setShowPrompt(true);
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			localStorage.setItem('pwa-installed', 'true');
			setShowPrompt(false);
		}

		setDeferredPrompt(null);
	};

	if (!showPrompt) return null;

	return (
		<div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 bg-background border rounded-lg shadow-lg p-4 md:w-80 z-[9999]">
			<div className="flex items-center justify-between gap-4">
				<div className="flex-1">
					<h3 className="font-semibold">Install App</h3>
					<p className="text-sm text-muted-foreground">Get the best experience by installing the app</p>
				</div>
				<Button onClick={handleInstallClick} size="sm">
					<Download className="h-4 w-4 mr-2" />
					Install
				</Button>
			</div>
		</div>
	);
}
