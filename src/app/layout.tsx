import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <head>

      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css' rel='stylesheet' />
    </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
