// network-first: always try the latest page from GitHub Pages, fall back to cache offline
const CACHE = 'quad-ctrl';   // sw v2: CDN cache bypass

self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // same-origin files: add a unique query so the GitHub Pages CDN (up to 10 min cache) also serves the latest
  const u = new URL(e.request.url);
  const fresh = u.origin === self.location.origin
    ? (u.searchParams.set('_', Date.now()), u.toString()) : e.request;
  e.respondWith(
    fetch(fresh, {cache: 'no-store'})
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
