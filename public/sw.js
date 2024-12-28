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
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip certain URLs that shouldn't be cached
	const url = new URL(event.request.url);
	if (
		url.pathname.startsWith('/api/') ||
		url.pathname.includes('chrome-extension') ||
		url.pathname.includes('geoapify')
	) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((response) => {
					// Don't cache if not a valid response
					if (!response || response.status !== 200 || response.type !== 'basic') {
						return response;
					}

					// Clone the response for caching
					const responseToCache = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => {
							cache.put(event.request, responseToCache);
						})
						.catch((err) => {
							console.warn('Cache put error:', err);
						});

					return response;
				})
				.catch((error) => {
					console.warn('Fetch error:', error);
					return new Response('Network error', { status: 408 });
				});
		})
	);
});
