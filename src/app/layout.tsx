import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Villspor',
	description: 'Et kart for meg som er på villspor',
	icons: {
		icon: '/favicon.svg',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" rel="stylesheet" />
			</head>
			<body className={inter.className}>
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}
