/* Service worker: installable app shell + push-style notifications. Same-site files: network first, cached fallback. */
const CACHE='panaybike-v8';
const SHELL=['./','index.html','style.css','pro.css','ultra.css','ultra.js','sync.js','app.js','plus.js','pro.js','install.js','config.js','logo.png','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(ch=>ch.put(r,c))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
/* tapping a notification opens/focuses the app and jumps to the right tab */
self.addEventListener('notificationclick',e=>{
  e.notification.close();const go=(e.notification.data&&e.notification.data.go)||'home';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){if('focus' in c){c.postMessage({pbGo:go});return c.focus()}}
    return clients.openWindow('./index.html#'+go)}));
});
