/* Simple service worker: makes the site installable and keeps the app shell available.
   Same-site files are fetched from the network first (so new uploads show up), with a cached fallback. */
const CACHE='panaybike-v4';
const SHELL=['./','index.html','style.css','app.js','plus.js','config.js','logo.png','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return; /* map tiles, Firebase, Wikipedia etc. go straight to the network */
  e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(ch=>ch.put(r,c))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
