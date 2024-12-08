import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Provider from '@/app/context/client-provider';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import HelpButton from '@/components/HelpButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authOptions);

	return (
		<html lang="en">
			<head>
				<link href="https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" rel="stylesheet" />
			</head>
			<body className={inter.className}>
				<Provider session={session}>
					{children}
					<HelpButton />
				</Provider>
			</body>
		</html>
	);
}
