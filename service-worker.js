const CACHE_NAME = 'sim-ppda-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/css/style.css',
    '/js/config.js',
    '/js/api.js',
    '/js/core.js',
    '/js/settings.js',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    // Tambahkan halaman pages yang sering diakses jika perlu
    '/pages/dashboard.html', 
    '/pages/settings.html'
];

// Install Event: Menyimpan aset ke cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Aktivasi langsung
    );
});

// Activate Event: Membersihkan cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event: Strategi Cache First, lalu Network (untuk kecepatan)
self.addEventListener('fetch', (event) => {
    // Kita hanya cache request GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Jika ada di cache, pakai cache
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Jika tidak, ambil dari network
                return fetch(event.request).then((networkResponse) => {
                    // Jika error atau bukan dari origin kita, return saja
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Clone response karena response hanya bisa dipakai sekali
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                });
            })
            .catch(() => {
                // Fallback jika offline total dan request tidak ada di cache
                // Misal return halaman offline.html jika ada
            })
    );
});
