// MyAi Service Worker
const CACHE_NAME = 'myai-v1';
const STATIC_CACHE = 'myai-static-v1';

// URLs to cache for offline functionality
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('MyAi SW: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('MyAi SW: Caching static resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('MyAi SW: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('MyAi SW: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('MyAi SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('MyAi SW: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for Convex API calls (they need to be online)
  if (event.request.url.includes('convex.cloud') ||
      event.request.url.includes('convex.') ||
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // For navigation requests, try to fetch, fallback to cache
        if (event.request.mode === 'navigate') {
          return fetch(event.request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Return cached index.html for navigation requests when offline
              return caches.match('/');
            });
        }

        // For other requests, try network first
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache valid responses
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return from cache if network fails
            return caches.match(event.request);
          });
      })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('MyAi SW: Background sync triggered:', event.tag);

  if (event.tag === 'myai-sync') {
    event.waitUntil(
      // Here you could implement offline message queue sync
      // For now, just log that sync occurred
      console.log('MyAi SW: Syncing offline data...')
    );
  }
});

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  console.log('MyAi SW: Push notification received');

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'You have a new update from MyAi',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'myai-notification',
      renotify: true,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open MyAi'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MyAi', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('MyAi SW: Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Log service worker errors
self.addEventListener('error', (event) => {
  console.error('MyAi SW: Error occurred:', event.error);
});

console.log('MyAi SW: Service Worker loaded successfully');
