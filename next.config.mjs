/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'cache.kartverket.no',
            'opencache.statkart.no',
            'nve.geodataonline.no',
            'gis3.nve.no'
        ],
    },
};

export default nextConfig;
