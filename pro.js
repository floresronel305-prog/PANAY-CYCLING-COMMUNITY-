/* pro.js – PRO layer for PanayBike. Loaded AFTER app.js/plus.js; nothing is removed.
   1) animated background  2) toast stack  3) notification center + real phone notifications
   4) background watchers (chat, SOS, new rides, ride reminders)  5) ripple/haptics, nav unread dots */
(function(){
const $=s=>document.querySelector(s),ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 1) animated background: glowing orbs, flowing road lines with riders, dust ---------- */
const cv=document.createElement('canvas');cv.id='bgfx';document.body.prepend(cv);const g=cv.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W,H,rgb=[37,99,235],fr=0,last=0;
const dust=Array.from({length:30},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.6+.5,s:Math.random()*.012+.004}));
function res(){const d=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0);if(reduce)draw(0)}
function col(){const m=/^#?([0-9a-f]{6})$/i.exec(getComputedStyle(document.documentElement).getPropertyValue('--a').trim());if(m){const n=parseInt(m[1],16);rgb=[n>>16,n>>8&255,n&255]}}
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const py=(i,x,t)=>H*(.22+.28*i)+Math.sin(x/W*5+t*.4+i*2)*H*.05+Math.sin(x/W*11-t*.3)*H*.015;
function draw(t){
  const light=document.documentElement.dataset.theme=='light',k=light?.55:1,alt=[rgb[2],rgb[0],rgb[1]];
  g.clearRect(0,0,W,H);
  [[.15,.12,.5,0,rgb],[.9,.35,.42,2,alt],[.25,.85,.55,4,rgb],[.95,.95,.4,6,alt]].forEach(([x,y,r,p,c])=>{
    const cx=(x+.07*Math.sin(t*.18+p))*W,cy=(y+.06*Math.cos(t*.15+p))*H,R=r*Math.max(W,H),gr=g.createRadialGradient(cx,cy,0,cx,cy,R);
    gr.addColorStop(0,rgba(c,.26*k));gr.addColorStop(1,rgba(c,0));g.fillStyle=gr;g.fillRect(0,0,W,H)});
  for(let i=0;i<3;i++){
    g.beginPath();for(let x=0;x<=W+20;x+=20)x?g.lineTo(x,py(i,x,t)):g.moveTo(x,py(i,x,t));
    g.setLineDash([7,12]);g.lineDashOffset=-t*18*(1+i*.3);g.strokeStyle=rgba(rgb,.17*k);g.lineWidth=2;g.stroke();g.setLineDash([]);
    const u=(t*.045*(1+i*.2)+i*.33)%1;
    for(let j=9;j>=0;j--){const x=(u-j*.006+1)%1*W,a=(1-j/10);g.beginPath();g.arc(x,py(i,x,t),j?2.2*a:3.4,0,7);g.fillStyle=rgba(j?rgb:[255,255,255],(j?.35:.9)*a*k);if(!j){g.shadowColor=rgba(rgb,1);g.shadowBlur=14}g.fill();g.shadowBlur=0}}
  dust.forEach(d=>{d.y-=d.s/60;if(d.y<0){d.y=1;d.x=Math.random()}g.beginPath();g.arc(d.x*W+Math.sin(t+d.x*9)*8,d.y*H,d.r,0,7);g.fillStyle=rgba(light?rgb:[255,255,255],.22*k);g.fill()});
}
function loop(ts){if(document.hidden){setTimeout(()=>requestAnimationFrame(loop),600);return}
  if(ts-last>=33){last=ts;if(!(fr++%60))col();draw(ts/1000)}requestAnimationFrame(loop)}
addEventListener('resize',res);res();col();if(!reduce)requestAnimationFrame(loop);

/* ---------- 2) toast stack (replaces the old single toast; same toast(msg) call everywhere) ---------- */
const TW=document.createElement('div');TW.id='toasts';document.body.appendChild(TW);
const ICON={ok:'✅',err:'⚠️',info:'💬',sos:'🆘',ride:'🚴',chat:'💬'};
window.toast=function(m,o){o=o||{};m=String(m);
  const type=o.type||(/could not|not sent|not uploaded|error|wrong|blocked|unavailable|failed|busy|admins only|enter |fill |use 6|needs|must /i.test(m)?'err':/saved|published|joined|applied|added|welcome|updated|sent|logged|reset|deleted|shared|\bon\b/i.test(m)?'ok':'info'),
  el=document.createElement('div'),ms=o.ms||(type=='sos'?9000:3400);
  el.className='tt '+(type=='sos'?'sos':type=='ok'?'ok':type=='err'?'err':'');el.style.setProperty('--d',ms+'ms');
  el.innerHTML=`<div class="ti">${ICON[o.icon||type]||'💬'}</div><div class="tx">${o.title?'<b>'+esc(o.title)+'</b>':''}${esc(m)}</div><div class="tp"></div>`;
  const kill=()=>{el.classList.add('out');setTimeout(()=>el.remove(),300)};
  if(o.go)el.onclick=()=>{kill();window.go(o.go)};
  let x0=null;el.addEventListener('pointerdown',e=>x0=e.clientX);
  el.addEventListener('pointerup',e=>{if(x0!==null&&Math.abs(e.clientX-x0)>50){el.style.transform=`translateX(${e.clientX>x0?'':'-'}120%)`;kill()}x0=null});
  TW.appendChild(el);while(TW.children.length>3)TW.firstChild.remove();setTimeout(kill,ms);
  if(!o.silent&&/badge|ride saved|joined/i.test(m))store({type:'ok',title:'Activity',body:m});
};

/* ---------- 3) notification center ---------- */
let N=[];try{N=JSON.parse(ls('pb_notifs')||'[]')}catch(e){}
const save=()=>ls('pb_notifs',JSON.stringify(N.slice(0,40))),U={chat:0,events:0};
function store(n){N.unshift({id:Date.now()+Math.random(),t:Date.now(),read:false,...n});N=N.slice(0,40);save();badge()}
function badge(){const b=$('#bell i');if(!b)return;const c=N.filter(n=>!n.read).length;b.dataset.n=c;b.textContent=c>9?'9+':c||''}
let au;function chime(){if(ls('pb_mute')=='1')return;try{au=au||new(window.AudioContext||window.webkitAudioContext)();[880,1175].forEach((f,i)=>{const o=au.createOscillator(),v=au.createGain();o.frequency.value=f;o.type='sine';v.gain.setValueAtTime(.0001,au.currentTime+i*.12);v.gain.exponentialRampToValueAtTime(.06,au.currentTime+i*.12+.02);v.gain.exponentialRampToValueAtTime(.0001,au.currentTime+i*.12+.25);o.connect(v);v.connect(au.destination);o.start(au.currentTime+i*.12);o.stop(au.currentTime+i*.12+.3)})}catch(e){}}
/* notify({type:'chat|ride|sos|info', title, body, go:'chat'}) – in-app toast + bell + sound + vibration + phone notification when app is in background */
window.notify=function(n){n={type:'info',...n};store(n);const b=$('#bell');if(b){b.classList.remove('ring');void b.offsetWidth;b.classList.add('ring')}
  const sos=n.type=='sos';toast(n.body||'',{title:n.title,type:sos?'sos':'info',icon:n.type,go:n.go,silent:1,ms:sos?9000:4500});chime();
  if(navigator.vibrate)navigator.vibrate(sos?[200,100,200,100,400]:[80,40,80]);
  if(document.hidden&&window.Notification&&Notification.permission=='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(r=>r.showNotification(n.title||'PanayBike',{body:n.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:n.type+(n.tag||''),vibrate:sos?[300,100,300,100,600]:[100,50,100],requireInteraction:sos,data:{go:n.go||'home'}})).catch(()=>{})};
const ago=t=>{const s=(Date.now()-t)/1000;return s<60?'now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':new Date(t).toLocaleDateString()};
const KC={sos:'#ef4444',ride:'#22c55e',chat:'#3b82f6',ok:'#22c55e',info:'#8b5cf6'};
const W_=document.createElement('div');W_.id='npw';W_.onclick=e=>{if(e.target==W_)closeP()};document.body.appendChild(W_);
function panel(){const ok=window.Notification&&Notification.permission=='granted',can=!!window.Notification;
  W_.innerHTML=`<div id="npp"><div class="nh"><b>🔔 Notifications</b><button class="chip" id="nmu">${ls('pb_mute')=='1'?'🔇 Muted':'🔊 Sound'}</button><button class="chip" id="nx">✕</button></div>
  <div class="nl">${N.length?N.map((n,i)=>`<div class="ni ${n.read?'':'u'}" data-i="${i}" style="--k:${KC[n.type]||KC.info}"><div class="ic">${ICON[n.type]||'🔔'}</div><div style="flex:1;min-width:0"><b>${esc(n.title||'PanayBike')}</b><div class="mut">${esc(n.body||'')}</div><div class="mut" style="opacity:.7">${ago(n.t)}</div></div></div>`).join(''):'<div class="ne"><div>🔕</div>You are all caught up.</div>'}</div>
  <div class="nf">${can?`<button class="btn" id="npe">${ok?'Send test':'Enable phone alerts'}</button>`:''}<button class="btn g" id="npc">Clear all</button></div></div>`;
  $('#nx').onclick=closeP;$('#nmu').onclick=()=>{ls('pb_mute',ls('pb_mute')=='1'?'0':'1');panel()};$('#npc').onclick=()=>{N=[];save();badge();panel()};
  const pe=$('#npe');if(pe)pe.onclick=async()=>{if(!ok){const r=await Notification.requestPermission();toast(r=='granted'?'Phone alerts enabled':'Alerts blocked in browser settings');panel()}else{closeP();setTimeout(()=>notify({type:'chat',title:'Test notification',body:'Alerts are working 🚴',go:'home'}),300)}};
  W_.querySelectorAll('.ni').forEach(el=>el.onclick=()=>{const n=N[+el.dataset.i];closeP();if(n&&n.go)go(n.go)})}
function openP(){panel();W_.classList.add('on');setTimeout(()=>{N.forEach(n=>n.read=true);save();badge()},900)}
function closeP(){W_.classList.remove('on')}
const bell=document.createElement('button');bell.id='bell';bell.setAttribute('aria-label','Notifications');bell.innerHTML='<span>🔔</span><i data-n="0"></i>';bell.onclick=openP;$('#acct').before(bell);badge();
addEventListener('keydown',e=>{if(e.key=='Escape')closeP()});

/* ---------- 4) background watchers (work when LIVE_URL / Firebase is set) ---------- */
function dots(){document.querySelectorAll('nav button').forEach(b=>{const m=/go\('(\w+)'\)/.exec(b.getAttribute('onclick')||'');b.querySelector('.dot')?.remove();if(m&&U[m[1]]>0)b.insertAdjacentHTML('beforeend','<i class="dot"></i>')})}
const _go=window.go;window.go=function(v){U[v]=0;return _go.apply(this,arguments)};
const _hd=window.hd;window.hd=function(){_hd.apply(this,arguments);dots()};
async function pollChat(){const b=LV(),u=me();if(!b||!u)return;try{
  const r=await fetch(b+'/chat.json?orderBy=%22%24key%22&limitToLast=15');if(!r.ok)return;const j=await r.json()||{},ks=Object.keys(j).sort(),sk='pb_seen_chat_'+u.id,seen=ls(sk);if(!ks.length)return;ls(sk,ks[ks.length-1]);if(seen===null)return;
  const fresh=ks.filter(k=>k>seen).map(k=>j[k]).filter(m=>m&&m.x&&m.u!=u.id),sos=fresh.filter(m=>/^🆘/.test(m.x));
  sos.forEach(m=>notify({type:'sos',title:'🆘 SOS from '+m.n,body:'A rider needs help. Tap to see the location.',go:'chat',tag:m.t}));
  const rest=fresh.filter(m=>!/^🆘/.test(m.x));if(cur=='chat'&&!document.hidden||!rest.length)return;
  U.chat+=rest.length;rest.length>3?notify({type:'chat',title:'Community chat',body:rest.length+' new messages',go:'chat'}):rest.forEach(m=>notify({type:'chat',title:m.n,body:m.x.slice(0,90),go:'chat',tag:m.t}));dots()}catch(e){}}
async function pollEvents(){const b=LV(),u=me();if(!b||!u)return;try{
  const r=await fetch(b+'/events.json');if(!r.ok)return;const j=await r.json()||{},now=Date.now(),sk='pb_seen_ev_'+u.id,seen=ls(sk),known=JSON.parse(seen||'[]'),rem=JSON.parse(ls('pb_rem')||'[]');
  Object.entries(j).forEach(([k,e])=>{if(!e)return;
    if(seen!==null&&!known.includes(k)&&e.u!=u.id){U.events++;notify({type:'ride',title:'New group ride',body:e.t+' · '+evDate(e.ts),go:'events',tag:k});dots()}
    const dt=e.ts-now;if(e.going&&e.going[u.id]&&dt>0&&dt<36e5&&!rem.includes(k)){rem.push(k);notify({type:'ride',title:'Ride starts in '+Math.round(dt/6e4)+' min',body:e.t+(e.m?' · '+e.m:''),go:'events',tag:'r'+k})}});
  ls(sk,JSON.stringify(Object.keys(j)));ls('pb_rem',JSON.stringify(rem.slice(-30)))}catch(e){}}
const tick=()=>{pollChat();pollEvents()};setTimeout(tick,2500);setInterval(pollChat,8000);setInterval(pollEvents,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});

/* ---------- 5) ripple, haptics, deep links from notifications ---------- */
document.addEventListener('pointerdown',e=>{const t=e.target.closest('.btn,.chip,nav button');if(!t)return;const r=t.getBoundingClientRect(),s=Math.max(r.width,r.height)*2,p=document.createElement('span');
  p.className='rip';p.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;t.appendChild(p);setTimeout(()=>p.remove(),600);
  if(t.matches('nav button')&&navigator.vibrate)navigator.vibrate(8)},{passive:true});
if(navigator.serviceWorker)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.pbGo&&V[e.data.pbGo])go(e.data.pbGo)});
if(location.hash.length>1)setTimeout(()=>{const v=location.hash.slice(1);if(V[v])go(v)},500);
if(!ls('pb_welcomed')){ls('pb_welcomed','1');setTimeout(()=>notify({type:'info',title:'Welcome to PanayBike 🚴',body:'Tap the bell to turn on phone alerts for chat, SOS and group rides.',go:'home'}),1800)}
})();
