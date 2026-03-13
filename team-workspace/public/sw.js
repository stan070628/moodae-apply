const CACHE_NAME = "indig-collab-v6";
const STATIC_ASSETS = [
    "/",
    "/board",
    "/minutes",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // API calls: network only
    if (request.url.includes("/api/")) return;

    // Next.js JS chunks: network only (content-hashed, no need to cache; prevents stale chunk 404s)
    if (request.url.includes("/_next/static/chunks/") || request.url.includes("/_next/static/css/")) return;

    // HTML pages: network-first (ensures latest deployment is served)
    const isNavigation = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
    if (isNavigation) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
