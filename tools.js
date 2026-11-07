/* tools.js – "⋯" App options: Desktop/Mobile view, Dark/Light, Fullscreen, Text size, Refresh app, Share, Install, Top, Home. */
(function(){
const $=s=>document.querySelector(s),vp=$('meta[name=viewport]'),BASE=vp.content;
const ls=(k,d)=>{try{return localStorage.getItem(k)??d}catch(e){return d}},ss=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const desk=()=>ls('pb_desk','0')=='1',zoom=()=>+ls('pb_zoom','1');
const apply=()=>{vp.content=desk()?'width=1100, initial-scale=0.35, user-scalable=yes':BASE;document.body.style.zoom=zoom()!=1?zoom():''};
apply();
window.tDesk=()=>{ss('pb_desk',desk()?'0':'1');apply();closeM();toast(desk()?'Desktop view ON':'Mobile view ON')};
window.tTheme=()=>{const u=me(),m=document.documentElement.dataset.theme=='light'?'dark':'light';if(u)u.mode=m;D.mode=m;sv();theme();closeM()};
window.tFull=()=>{closeM();const d=document;d.fullscreenElement?d.exitFullscreen():d.documentElement.requestFullscreen&&d.documentElement.requestFullscreen().catch(()=>toast('Fullscreen not supported here'))};
window.tZoom=d=>{const z=Math.min(1.4,Math.max(.8,Math.round((zoom()+d)*10)/10));ss('pb_zoom',z);apply();toast('Text size '+Math.round(z*100)+'%')};
window.tRefresh=async()=>{toast('Updating app…');try{const r=await navigator.serviceWorker.getRegistrations();await Promise.all(r.map(x=>x.unregister()));const k=await caches.keys();await Promise.all(k.map(x=>caches.delete(x)))}catch(e){}location.reload()};
window.tInst=()=>{closeM();const b=$('#instbtn');b?b.click():toast('App is already installed 👍')};
window.tools=()=>{const g=(i,t,f)=>`<button onclick="${f}">${i}<span>${t}</span></button>`;
 $('#modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md"><h3>App options</h3><div class="mg">${g(desk()?'📱':'🖥️',desk()?'Mobile view':'Desktop view','tDesk()')}${g('🌓','Dark / Light','tTheme()')}${g('⛶','Fullscreen','tFull()')}${g('🔎＋','Text bigger','tZoom(.1)')}${g('🔎－','Text smaller','tZoom(-.1)')}${g('🔄','Refresh app','tRefresh()')}${g('📤','Share app','closeM();shareApp()')}${g('📲','Install','tInst()')}${g('⬆️','Go to top','closeM();scrollTo({top:0,behavior:\'smooth\'})')}${g('🏠','Home','closeM();go(\'home\')')}</div><button class="btn g" style="width:100%" onclick="closeM()">Close</button></div></div>`};
const b=document.createElement('button');b.id='apptools';b.textContent='⋯';b.title='App options';b.onclick=tools;const h=document.querySelector('header');(function(){const r=$('#bell')||$('#acct');r&&r.parentNode?r.parentNode.insertBefore(b,r):h.appendChild(b)})();if(!$('#instbtn'))b.style.marginLeft='auto';
})();
