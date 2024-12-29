// Service worker for caching and offline functionality
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open('v1').then((cache) => {
			return cache.addAll(['/', '/manifest.json', '/favicon.svg']);
		})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			// Return cached response if found
			if (response) {
				return response;
			}

			// Clone the request because it can only be used once
			const fetchRequest = event.request.clone();

			// Make network request and cache the response
			return fetch(fetchRequest)
				.then((response) => {
					// Don't cache non-success responses or non-GET requests
					if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
						return response;
					}

					// Clone the response because it can only be used once
					const responseToCache = response.clone();

					// Only cache same-origin requests
					if (event.request.url.startsWith(self.location.origin)) {
						caches.open('v1').then((cache) => {
							cache.put(event.request, responseToCache);
						});
					}

					return response;
				})
				.catch(() => {
					// Return a fallback response for failed network requests
					return new Response('Network request failed', {
						status: 503,
						statusText: 'Service Unavailable',
						headers: new Headers({
							'Content-Type': 'text/plain',
						}),
					});
				});
		})
	);
});
