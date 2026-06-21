const CACHE='edura-v4-3';
const FILES=[
  '/',
  '/index.html',
  '/admin.html',
  '/employee.html',
  '/credential-center.html',
  '/admin-manifest.json',
  '/employee-manifest.json',
  '/edura-v4-3',
  '/edura-v4-3'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  event.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(req).then(cached=>cached||caches.match('/index.html')))
  );
});
