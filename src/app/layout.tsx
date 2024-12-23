import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWAInstall } from '@/components/PWAInstall';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Villspor',
	description: 'Et kart for meg som er på villspor',
	icons: {
		icon: '/favicon.svg',
	},
	manifest: '/manifest.json',
	viewport: {
		width: 'device-width',
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
	},
	themeColor: '#000000',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Villspor',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" rel="stylesheet" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="mobile-web-app-capable" content="yes" />
			</head>
			<body className={`${inter.className} overflow-x-hidden`}>
				<Providers>
					<PWAInstall />
					{children}
				</Providers>
			</body>
		</html>
	);
}
