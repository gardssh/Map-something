/** @type {import('next').NextConfig} */
const nextConfig = {
	// Disable service worker in development
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Service-Worker-Allowed',
						value: '/',
					},
				],
			},
		];
	},
	// Disable automatic static optimization for pages that need to be dynamic
	reactStrictMode: true,
	// Ensure proper handling of map tiles and other external resources
	images: {
		domains: ['stage.kart.gardsh.no'],
	},
	// Disable service worker in development
	webpack: (config, { dev, isServer }) => {
		if (dev && !isServer) {
			// Disable service worker in development
			config.plugins = config.plugins.filter((plugin) => plugin.constructor.name !== 'WorkboxPlugin');
		}
		return config;
	},
};

module.exports = nextConfig;
