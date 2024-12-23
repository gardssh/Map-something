const CACHE_NAME = 'villspor-v1';
const urlsToCache = [
	'/',
	'/manifest.json',
	'/favicon.svg',
	'https://api.tiles.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css',
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Check if we received a valid response
				if (!response || response.status !== 200) {
					return response;
				}

				// Clone the response
				const responseToCache = response.clone();

				// Add to cache
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseToCache);
				});

				return response;
			})
			.catch(() => {
				// If fetch fails, try to get from cache
				return caches.match(event.request).then((response) => {
					return (
						response ||
						new Response('Network error happened', {
							status: 408,
							headers: { 'Content-Type': 'text/plain' },
						})
					);
				});
			})
	);
});
