import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWAInstall } from '@/components/pwa/PWAInstall';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: 'cover',
	themeColor: '#000000',
};


export const metadata: Metadata = {
	title: 'Villspor',
	description: 'Et kart for meg som er på villspor',
	icons: {
		icon: '/favicon.svg',
		apple: [
			{ url: '/icon-192.png', sizes: '192x192' },
			{ url: '/icon-384.png', sizes: '384x384' },
			{ url: '/icon-512.png', sizes: '512x512' },
		],
	},
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Villspor',
		startupImage: [{ url: '/icon-512.png' }],
	},
	other: {
		'mobile-web-app-capable': 'yes',
		'apple-mobile-web-app-capable': 'yes',
		'apple-touch-icon': '/icon-192.png',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={`${inter.className} overflow-x-hidden`}>
				<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" rel="stylesheet" />
				<Providers>
					<PWAInstall />
					{children}
				</Providers>
			</body>
		</html>
	);
}
