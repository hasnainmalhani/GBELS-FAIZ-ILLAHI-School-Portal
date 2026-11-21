// GHS Portal service worker: keeps the app files for quick opening.
// It never stores Supabase data, logins or photos – those always come live from the internet.
const V = "ghs-portal-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; // Supabase, libraries and photos go straight to the network
  // Newest files first; fall back to the saved copy when there is no connection.
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(V).then((c) => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match("./")))
  );
});
