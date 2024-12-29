'use client';

import { useEffect } from 'react';

export function PWAInstall() {
	useEffect(() => {
		const registerServiceWorker = async () => {
			if ('serviceWorker' in navigator) {
				try {
					const registration = await navigator.serviceWorker.register('/sw.js');
					console.log('Service Worker registered with scope:', registration.scope);
				} catch (error) {
					console.error('Service Worker registration failed:', error);
				}
			}
		};

		registerServiceWorker();
	}, []);

	return null;
}
