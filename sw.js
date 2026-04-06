/* YrWeather — Service Worker (offline shell + network-first API) */
const CACHE = 'yrweather-v4';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.json',
               './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const { hostname } = url;

  // Always go to network for API, geocoding, and cross-origin font resources
  const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
  const API_HOSTS  = new Set(['api.met.no', 'nominatim.openstreetmap.org']);

  if (API_HOSTS.has(hostname) || FONT_HOSTS.has(hostname)) {
    e.respondWith(
      fetch(e.request).catch(() =>
        API_HOSTS.has(hostname)
          ? new Response(JSON.stringify({ error: 'offline' }), {
              headers: { 'Content-Type': 'application/json' }
            })
          : new Response('', { status: 503 })
      )
    );
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});