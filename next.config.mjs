/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ['cache.kartverket.no', 'opencache.statkart.no', 'nve.geodataonline.no', 'gis3.nve.no', 'api.mapbox.com'],
	},
	async headers() {
		return [
			{
				// Matching all API routes
				source: '/api/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
					{
						key: 'Access-Control-Allow-Headers',
						value:
							'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
					},
				],
			},
			{
				// Matching all Mapbox API requests
				source: '/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Origin', value: 'https://api.mapbox.com' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
					{ key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
				],
			},
		];
	},
};

export default nextConfig;
