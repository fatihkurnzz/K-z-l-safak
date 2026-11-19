// Servis çalışanı. Ham game/ klasöründe (geliştirme): önce ağ, düşerse önbellek (çalışma zamanı önbelleği).
// `npm run app` (.app/sw.js) bu dosyadaki DD_BUILD satırını doldurur: bütün dosyalar kurulumda önbelleğe alınır,
// önce önbellek kullanılır (internetsiz açılış); yeni sürüm gelince eski önbellek silinir.
const DD_BUILD = null; // {ver, files} — yalnız derlemede
const PRE = DD_BUILD ? DD_BUILD.files : [];
const CACHE = 'dd-' + (DD_BUILD ? DD_BUILD.ver : 'dev');
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    if (PRE.length) { const c = await caches.open(CACHE); for (let i = 0; i < PRE.length; i += 20) await c.addAll(PRE.slice(i, i + 20)); }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('dd-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (PRE.length) { const hit = await c.match(r, { ignoreSearch: true }); if (hit) return hit; }
    try {
      const res = await fetch(r);
      if (res && res.ok && res.status === 200) c.put(r, res.clone()).catch(() => { });
      return res;
    } catch (err) {
      const hit = await c.match(r, { ignoreSearch: true });
      if (hit) return hit;
      if (r.mode === 'navigate') { const i = await c.match('index.html') || await c.match('./'); if (i) return i; }
      throw err;
    }
  })());
});
// Bildirime dokunma: oyunu öne getir, ilgili ekranı aç (ui-kalicilik.js 'message' dinleyicisi)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = e.notification.data?.go;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all[0] || await self.clients.openWindow('./');
    if (c) { try { await c.focus(); } catch { } c.postMessage({ dd: 'notif', go }); }
  })());
});
