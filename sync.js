/* sync.js – ONE shared server for every user + GPS tracker fix + new buttons/features.
   Loaded LAST (after ultra.js). It overrides/wraps functions from app.js, nothing is deleted.
   Server = Firebase Realtime Database (LIVE_URL in config.js, or the admin "connect link"). */
(function(){
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const adminNow=()=>{const u=me();return !!u&&u.role=='admin'};

/* ---------- server helpers ---------- */
async function fx(path,method,body){const b=LV();if(!b)return{ok:false,d:null};
  try{const r=await fetch(b+path.replace(/(\?|$)/,'.json$1'),{method:method||'GET',body:body===undefined?undefined:JSON.stringify(body)});
    if(!r.ok)return{ok:false,d:null};if(method=='DELETE')return{ok:true,d:null};return{ok:true,d:await r.json()}}catch(e){return{ok:false,d:null}}}
const uid=k=>{let a=5381,b=2166136261;for(let i=0;i<k.length;i++){const c=k.charCodeAt(i);a=(Math.imul(a,33)^c)>>>0;b=Math.imul(b^c,16777619)>>>0}return'u'+a.toString(36)+b.toString(36)};
async function hp(key,pw){try{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('pb1|'+key+'|'+pw));return'h:'+[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return pw}}
const pub=u=>{const r={...u};delete r.photo;return r};
const saveLocal=()=>{try{localStorage.setItem('pbc',JSON.stringify(D))}catch(e){}};
function mergeU(s){let l=D.users.find(x=>x.key==s.key);if(l)Object.assign(l,s);else{l={...s};D.users.push(l)}return l}
const ageTxt=a=>a<6e4?'just now':a<36e5?Math.round(a/6e4)+' min ago':Math.round(a/36e5)+' h ago';

/* ---------- connect link (?server=...) ---------- */
(function(){try{const q=new URLSearchParams(location.search).get('server');if(!q)return;history.replaceState(null,'',location.pathname+location.hash);
  if(typeof LIVE_URL!=='undefined'&&LIVE_URL)return;const u=q.replace(/\/$/,'');
  if(!/^https:\/\/[\w.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(u)||LV()==u)return;
  if(confirm('Connect this app to the shared PanayBike server?\n'+u)){localStorage.setItem('pb_server',u);location.reload()}}catch(e){}})();

/* ---------- server status ---------- */
async function srvPing(el){if(!el)return false;const b=LV();
  if(!b){el.innerHTML=`🔴 <b>Not connected to the shared server</b><div class="mut">Accounts, chat, rides and live GPS stay on this phone only. ${adminNow()?'Open Admin > Shared server to connect.':'Ask the admin to connect the server.'}</div>`;return false}
  const t0=performance.now();let ok=false;try{ok=(await fetch(b+'/live.json?shallow=true')).ok}catch(e){}
  el.innerHTML=ok?`🟢 <b>Connected to the shared server</b><div class="mut">Everyone sees the same data · ${Math.round(performance.now()-t0)} ms</div>`:`🟠 <b>Server not reachable</b><div class="mut">Check your internet and the Firebase rules (see README).</div>`;return ok}

/* ---------- accounts on the server ---------- */
let ready=Promise.resolve(),pt=null;
window.pbPush=function(now){if(!LV()||!me())return;clearTimeout(pt);pt=setTimeout(pushMe,now?0:700)};
async function pushMe(){await ready;const u=me();if(!u||!u.key)return;const r=await fx('/users/'+uid(u.key),'PUT',pub(u));if(r.ok&&!u.sync){u.sync=1;saveLocal()}}
async function meSync(){const u=me();if(!u||!LV()||!u.key)return;const r=await fx('/users/'+uid(u.key));if(!r.ok)return;const s=r.d;
  if(!s){if(u.sync){shareOff(1,1);D.me=null;sv();theme();hd();toast('This account was removed. Please sign up again.');go('home');return}return pbPush(1)}
  u.km=Math.max(+u.km||0,+s.km||0);u.rides=Math.max(u.rides||0,s.rides||0);u.role=s.role||u.role;u.name=s.name||u.name;if(s.pw)u.pw=s.pw;if(s.phone)u.phone=s.phone;if(s.ec!=null)u.ec=s.ec;
  if((s.mk||'')>(u.mk||'')){u.mk=s.mk;u.mkm=s.mkm}else if(s.mk==u.mk)u.mkm=Math.max(+u.mkm||0,+s.mkm||0);
  u.sync=1;sv();hd();loadPhoto(u);pbPush(1)}
function loadPhoto(u){if(!LV()||!u||u.photo||!u.key)return;fx('/uphotos/'+uid(u.key)).then(r=>{if(r.ok&&typeof r.d=='string'&&r.d){u.photo=r.d;saveLocal();hd()}})}

let subBusy=0;
window.sub=async function(){if(subBusy)return;subBusy=1;try{
  const g=i=>($('#'+i)||{}).value||'',idv=g('aid').trim(),pw=g('apw'),nm=g('anm').trim(),otp=g('aotp').trim(),p=am.p,e=x=>{$('#aerr').textContent=x};let key;
  if(p=='phone'){const d=idv.replace(/\D/g,'');if(d.length<10)return e('Enter a valid phone number.');key='phone:'+d.slice(-10)}else{if(!idv||(p=='email'&&!idv.includes('@')))return e('Enter a valid email.');key=p+':'+idv.toLowerCase()}
  if(am.m=='signup'){if(!nm)return e('Enter your name.');if(pw.length<6)return e('Password needs 6+ characters.');if(p=='phone'&&(!am.code||otp!=am.code))return e('Wrong or missing code. Tap Send code.')}
  if(am.m=='forgot'&&(!am.code||otp!=am.code))return e('Wrong or missing code. Tap Send code.');
  if(am.m=='forgot'&&pw.length<6)return e('Password needs 6+ characters.');
  const online=!!LV();let u=D.users.find(x=>x.key==key),down=false;
  if(online){e('Connecting…');const r=await fx('/users/'+uid(key));if(r.ok){if(r.d)u=mergeU(r.d)}else down=true;e('')}
  if(am.m=='login'){if(!u)return e(down?'Cannot reach the server. Check your internet.':'Wrong account or password.');
    const h=await hp(key,pw);if(u.pw!=h&&u.pw!=pw)return e('Wrong account or password.');if(u.pw==pw&&h!=pw)u.pw=h;return enter(u)}
  if(am.m=='signup'){if(u)return e('Account already exists.');if(down)return e('Cannot reach the server. Check your internet.');
    const n={id:uid(key),key,name:nm,pw:await hp(key,pw),role:'member',km:0,rides:0,j:Date.now(),prov:p};if(p=='phone')n.phone=idv;else n.email=idv;
    if(online){const r=await fx('/users/'+n.id,'PUT',pub(n));if(!r.ok)return e('Could not create the account on the server.');n.sync=1}
    D.users.push(n);return enter(n)}
  if(!u)return e(down?'Cannot reach the server. Check your internet.':'No account found.');
  u.pw=await hp(key,pw);sv();if(online)await fx('/users/'+uid(key),'PUT',pub(u));am.m='login';auth();toast('Password reset. Please log in.')
}finally{subBusy=0}};
const en0=window.enter;window.enter=function(u){en0(u);pbPush(1);loadPhoto(u);annLoad();poiLoad()};
window.chPw=async function(){const u=me(),o=$('#op').value,h=await hp(u.key,o);if(u.pw!=h&&u.pw!=o)return toast('Current password is wrong');const n=$('#np').value;if(n.length<6)return toast('Use 6+ characters');u.pw=await hp(u.key,n);sv();pbPush(1);toast('Password updated');go('set')};
window.saveP=function(){const u=me();u.name=$('#sn').value.trim()||u.name;u.phone=$('#sp').value.trim();const ec=$('#sec');if(ec)u.ec=ec.value.trim();sv();lbSync(u);hd();toast('Profile saved')};
window.photo=function(){pickImg(d=>{const u=me();u.photo=d;sv();if(LV()&&u.key)fx('/uphotos/'+uid(u.key),'PUT',d);hd();go(cur);toast('Photo updated')})};
window.delAcc=async function(){if(!confirm('Delete your account permanently?'))return;const u=me();shareOff(1,1);lbDel(D.me);if(LV()&&u.key){await fx('/users/'+uid(u.key),'DELETE');await fx('/uphotos/'+uid(u.key),'DELETE')}
  D.users=D.users.filter(x=>x.id!=D.me);D.recent=D.recent.filter(x=>x!=D.me);D.me=null;sv();theme();go('home')};

/* ---------- admin: members, announcements, map pins, server ---------- */
const memTable=()=>`<table><tr><th>Name</th><th>Role</th><th>km</th><th>Actions</th></tr>${D.users.map(u=>`<tr><td>${E(u.name)}</td><td>${E(u.role)}</td><td>${(+u.km||0).toFixed(0)}</td><td><button class="chip" onclick="adm('${E(u.id)}','role')">Toggle role</button> <button class="chip" onclick="adm('${E(u.id)}','km')">+50 km</button> <button class="chip" onclick="admLocate('${E(u.id)}')">📍 Locate</button> ${u.id==D.me?'':`<button class="chip" onclick="adm('${E(u.id)}','del')">Delete</button>`}</td></tr>`).join('')}</table>`;
async function admLoad(){if(!LV())return;const r=await fx('/users');if(!r.ok||cur!='admin')return;const s=Object.values(r.d||{}).filter(x=>x&&x.key),old=D.users;
  D.users=s.map(x=>{const o=old.find(l=>l.key==x.key);return o&&o.photo?{...x,photo:o.photo}:{...x}});const m=me();if(m&&!D.users.find(x=>x.id==m.id)){D.users.push(m);pbPush(1)}
  saveLocal();$('#v').innerHTML=V.admin()+FT;srvPing($('#asst'))}
window.adm=async function(id,a){const u=D.users.find(x=>x.id==id);if(!u)return;
  if(a=='role'&&id!=D.me)u.role=u.role=='admin'?'member':'admin';if(a=='km')addKm(u,50,0);
  if(a=='del'){if(!confirm('Delete '+u.name+'?'))return;D.users=D.users.filter(x=>x.id!=id);lbDel(id);if(LV()&&u.key){await fx('/users/'+uid(u.key),'DELETE');await fx('/uphotos/'+uid(u.key),'DELETE');await fx('/live/'+id,'DELETE')}}
  else{if(LV()&&u.key)await fx('/users/'+uid(u.key),'PUT',pub(u));lbSync(u)}
  sv();go('admin')};
window.admLocate=async function(id){const m=await lvGet(),r=m[id];if(!r)return toast('This rider is not sharing location right now');go('map');setTimeout(()=>{if(map)map.setView([r.la,r.lo],16)},400)};
window.exportCsv=function(){const rows=[['Name','Contact','Role','Total km','Rides']].concat(D.users.map(u=>[u.name,u.email||u.phone||'',u.role,(+u.km||0).toFixed(1),u.rides||0]));
  const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='panaybike-members.csv';a.click()};
window.clearChat=async function(){if(!confirm('Delete ALL chat messages for everyone?'))return;if(LV())await fx('/chat','DELETE');else{D.chat=[];sv()}toast('Chat cleared')};
window.srvSave=async function(){const u=($('#asu').value||'').trim().replace(/\/$/,'');if(!/^https:\/\/[\w.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(u))return toast('Enter a valid Firebase database URL');
  localStorage.setItem('pb_server',u);const ok=await srvPing($('#asst'));if(!ok)return toast('Server not reachable. Check the URL and rules.');pbPush(1);toast('Server connected and saved');go('admin')};
window.srvLink=function(){const b=LV();if(!b)return toast('Save the server URL first');const l=location.origin+location.pathname+'?server='+encodeURIComponent(b);
  navigator.share?navigator.share({title:'PanayBike',text:'Open this link once to connect to the PanayBike server:',url:l}).catch(()=>{}):(navigator.clipboard&&navigator.clipboard.writeText(l),toast('Connect link copied'))};

async function annLoad(){if(!LV())return;const r=await fx('/ann');if(!r.ok)return;D.ann=Object.entries(r.d||{}).map(([k,v])=>({...v,k})).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,20);saveLocal();
  const el=$('#anl');if(el)el.innerHTML=annHtml();const h=$('#han');if(h)h.innerHTML=annHome()}
const annHtml=()=>D.ann.map(a=>`<div class="card rv in" style="margin-bottom:8px">📢 ${E(a.t)}${adminNow()&&a.k?` <a style="cursor:pointer" onclick="annDel('${E(a.k)}')">🗑</a>`:''}<div class="mut">${E(a.d)}</div></div>`).join('')||'<div class="mut">No announcements yet.</div>';
const annHome=()=>D.ann[0]?`<div class="card rv in" style="margin-top:12px;cursor:pointer" onclick="go('club')">📢 <b>${E(D.ann[0].t)}</b><div class="mut">${E(D.ann[0].d)}</div></div>`:'';
window.annDel=async function(k){if(!confirm('Delete this announcement?'))return;await fx('/ann/'+k,'DELETE');D.ann=D.ann.filter(a=>a.k!=k);sv();annLoad()};
window.addAnn=async function(){const t=$('#an').value.trim();if(!t)return;const a={t,d:new Date().toLocaleDateString(),ts:Date.now()};
  if(LV()){const r=await fx('/ann','POST',a);if(!r.ok)return toast('Could not publish. Check your connection.');a.k=r.d&&r.d.name}D.ann.unshift(a);sv();toast('Announcement published');go('admin')};
async function pollAnn(){const u=me();if(!LV()||!u)return;const r=await fx('/ann');if(!r.ok||!r.d)return;const ks=Object.keys(r.d).sort(),last=ks[ks.length-1],seen=localStorage.getItem('pb_seen_ann');localStorage.setItem('pb_seen_ann',last);
  if(seen&&last>seen&&window.notify)notify({type:'info',title:'📢 Announcement',body:String(r.d[last].t||'').slice(0,100),go:'club',tag:last})}
setInterval(pollAnn,30000);setTimeout(pollAnn,4000);

const savePoi=p=>fx('/pois/'+p.id,'PUT',p);
async function poiLoad(){if(!LV())return;const r=await fx('/pois');if(!r.ok)return;const s=r.d||{},ids=new Set(Object.keys(s)),adm=adminNow();
  if(adm)D.pois.filter(p=>p.adm&&!ids.has(String(p.id))).forEach(savePoi);
  D.pois=D.pois.filter(p=>!p.adm||(adm&&!ids.has(String(p.id))));
  Object.values(s).forEach(p=>{if(p&&p.n&&!D.pois.find(x=>x.id==p.id))D.pois.push({...p,adm:1})});sv();if(cur=='home')setTA(tsA)}
window.addPoi=async function(){const n=$('#pn').value.trim(),la=parseFloat($('#pla').value),lo=parseFloat($('#plo').value);if(!n||isNaN(la)||isNaN(lo))return toast('Fill name, latitude and longitude');if(la<10.4||la>12||lo<121.8||lo>123.3)return toast('Location must be on Panay Island');
  const p={id:Date.now(),t:$('#pt').value,n,lng:lo,lat:la,d:$('#pd').value||'Added by admin',adm:1};D.pois.push(p);sv();if(LV())await savePoi(p);toast('Location added');go('admin')};
window.poiImg=function(id){pickImg(async d=>{const p=D.pois.find(x=>x.id==id);if(!p)return;p.img=d;sv();if(LV())await savePoi(p);go('map')})};
window.delPoi=async function(id){D.pois=D.pois.filter(x=>x.id!=id);sv();if(LV())await fx('/pois/'+id,'DELETE');go('map')};

/* ---------- GPS tracker: all riders visible ---------- */
let hb=null,MYC=null,LM={},lastLive={},WLk=null;
const lg0=window.lvGet;
window.lvGet=async function(){const b=LV();if(!b)return lg0();try{const r=await fetch(b+'/live.json');if(r.ok)lastLive=(await r.json())||{}}catch(e){}return lastLive};
function pubLive(u,fromWatch){if(!MY)return;const now=Date.now();if(fromWatch&&now-lastP<4000)return;lastP=now;const c=MYC||{};
  lvSet(u,{n:u.name,r:u.role,la:MY[0],lo:MY[1],sp:c.speed!=null&&c.speed>=0?Math.round(c.speed*3.6):null,acc:c.accuracy?Math.round(c.accuracy):null,t:LV()?{'.sv':'timestamp'}:now})}
window.shareOn=function(q){const u=me();if(!u)return auth('login');if(!navigator.geolocation)return toast('Location is not supported on this device');if(LW!=null)navigator.geolocation.clearWatch(LW);u.share=1;sv();
  LW=navigator.geolocation.watchPosition(p=>{MY=[p.coords.latitude,p.coords.longitude];MYC=p.coords;pubLive(u,true);lvPoll()},e=>{toast('Location blocked. Allow location for this site in your browser settings.');shareOff(1)},{enableHighAccuracy:true,maximumAge:5000,timeout:30000});
  clearInterval(hb);hb=setInterval(()=>{const m=me();if(m&&m.share)pubLive(m)},20000);
  if(!q)toast('Live location ON. Other riders can see you on the map.');updShare()};
const so0=window.shareOff;window.shareOff=function(q,keep){clearInterval(hb);hb=null;so0(q,keep)};
const riderPop=id=>{const o=LM[id];if(!o)return'';const r=o.r,age=Date.now()-(+r.t||0),mine=id==D.me;
  return`<div class="pp"><b>${E(r.n)}</b>${mine?' (you)':''}<div class="mut">${r.r=='admin'?'Admin':'Member'} · ${age<3e5?'🟢 live · ':'⚪ last seen '}${ageTxt(age)}</div>${r.sp!=null?`<div class="mut">🚴 ${r.sp} km/h${r.acc?' · ±'+r.acc+' m':''}</div>`:''}<div class="row" style="margin-top:6px">${mine?'':`<button class="btn" onclick="riderRoute('${E(id)}')">🧭 Directions</button>`}<a class="btn g" style="text-decoration:none;color:#0f172a" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${r.la},${r.lo}">Google Maps</a></div></div>`};
window.lvPoll=async function(){if(!map||!lvL)return;const m=await lvGet(),now=Date.now(),c=gps.pos||MY,rows=[],keep=new Set();LVD=m;if(LM._l!==lvL)LM={_l:lvL};
  Object.entries(m).forEach(([id,r])=>{if(!r||r.la==null||r.lo==null)return;const age=now-(+r.t||0);if(age>72e5)return;const live=age<3e5,mine=id==D.me;keep.add(id);rows.push([id,r,mine,live,age]);
    const html=`<div class="lv ${r.r=='admin'?'ad':''} ${mine?'mi':''}" style="${live?'':'opacity:.45;filter:grayscale(.6)'}"><span>${E((r.n||'?')[0]).toUpperCase()}</span></div><div class="lvn">${E((r.n||'').split(' ')[0])}${live?'':' · '+ageTxt(age)}</div>`;
    let o=LM[id];if(!o){const mk=L.marker([r.la,r.lo],{icon:L.divIcon({className:'',iconSize:[40,52],iconAnchor:[20,18],html}),zIndexOffset:900}).addTo(lvL);o=LM[id]={mk,r,h:html};mk.bindPopup(()=>riderPop(id),{minWidth:200})}
    else{o.r=r;o.mk.setLatLng([r.la,r.lo]);if(o.h!==html){o.h=html;o.mk.setIcon(L.divIcon({className:'',iconSize:[40,52],iconAnchor:[20,18],html}))}const pp=o.mk.getPopup();if(pp&&pp.isOpen())pp.setContent(riderPop(id))}});
  Object.keys(LM).forEach(id=>{if(id!='_l'&&!keep.has(id)){lvL.removeLayer(LM[id].mk);delete LM[id]}});
  const el=$('#lvl');if(!el)return;const live=rows.filter(x=>x[3]).length;rows.sort((a,b)=>(b[3]-a[3])||((c?dk(c,[a[1].la,a[1].lo]):0)-(c?dk(c,[b[1].la,b[1].lo]):0)));
  el.innerHTML=`<div class="row" style="flex-wrap:nowrap"><b style="flex:4">👥 Riders live now (${live})${rows.length>live?` <span class="mut">+${rows.length-live} recent</span>`:''}</b><button class="btn g" style="flex:none" onclick="fitRiders()">Show all</button></div>${LV()?'':'<div class="mut">⚠️ Not connected to the shared server: you only see riders on this device.</div>'}`+
   (rows.map(([id,r,mine,lv,age])=>`<div class="row" style="flex-wrap:nowrap;padding:6px 0;border-bottom:1px solid var(--b);cursor:pointer" onclick="map.setView([${r.la},${r.lo}],16)"><div class="lv s ${r.r=='admin'?'ad':''}" style="flex:none;margin:0;${lv?'':'opacity:.45'}"><span>${E((r.n||'?')[0]).toUpperCase()}</span></div><div style="flex:4"><b>${E(r.n)}${mine?' (you)':''}</b><div class="mut">${lv?'🟢 live':'⚪ last seen '+ageTxt(age)}${r.sp!=null&&lv?' · '+r.sp+' km/h':''}</div></div><span class="mut" style="flex:none">${c&&!mine?dk(c,[r.la,r.lo]).toFixed(1)+' km':''}</span></div>`).join('')||'<div class="mut">Nobody is sharing location right now. Turn yours on!</div>')};
window.fitRiders=function(){if(!map)return;const pts=Object.entries(LM).filter(([k,o])=>k!='_l'&&o&&o.mk).map(([k,o])=>o.mk.getLatLng());pts.length?map.fitBounds(L.latLngBounds(pts).pad(.3),{maxZoom:15}):toast('No riders to show yet')};
window.myLoc=function(){const p=gps.pos||MY;if(p){map.flyTo(p,16);return}if(!navigator.geolocation)return toast('GPS is not supported');toast('Finding your location…');
  navigator.geolocation.getCurrentPosition(q=>{MY=[q.coords.latitude,q.coords.longitude];map.flyTo(MY,16);setMe(MY)},()=>toast('Location blocked. Allow location in your browser settings.'),{enableHighAccuracy:true,timeout:15000})};
window.nearest=async function(k){if(!map)return;if(!ON[k]){ON[k]=1;map.addLayer(LG[k]);const ch=$('#chips');if(ch)ch.innerHTML=chips()}st('Looking for the nearest '+CAT[k].n.toLowerCase()+'…');await loadView();
  const c=gps.pos||[map.getCenter().lat,map.getCenter().lng],l=[...PT.values()].filter(o=>o.k==k).map(o=>[o,dk(c,[o.lat,o.lng])]).sort((a,b)=>a[1]-b[1]);
  if(!l.length)return toast('None found yet. Zoom in or tap Load whole island.');toast('Nearest: '+l[0][0].n+' ('+l[0][1].toFixed(1)+' km)');routeTo(l[0][0].id)};
window.keepOn=async function(){if(WLk){try{await WLk.release()}catch(e){}WLk=null;return toast('Screen can sleep again')}
  try{WLk=await navigator.wakeLock.request('screen');WLk.addEventListener('release',()=>{WLk=null});toast('Screen will stay awake')}catch(e){toast('Keep-awake is not supported on this browser')}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const m=me();if(m&&m.share&&MY)pubLive(m)}});
window.shareLoc=function(){const p=gps.pos||MY;if(!p){myLoc();return toast('Finding you… tap Share again in a moment')}
  const t='My location (PanayBike): https://www.google.com/maps?q='+p[0].toFixed(5)+','+p[1].toFixed(5);navigator.share?navigator.share({text:t}).catch(()=>{}):(navigator.clipboard&&navigator.clipboard.writeText(t),toast('Location link copied'))};
window.shareApp=function(){const url=location.origin+location.pathname;navigator.share?navigator.share({title:'Panay Island Community Cycling',text:'Join the Panay cycling community app:',url}).catch(()=>{}):(navigator.clipboard&&navigator.clipboard.writeText(url),toast('App link copied'))};
window.sendLoc=function(){const u=me();if(!u)return auth('login');if(!navigator.geolocation)return toast('GPS is not supported');toast('Getting your location…');
  navigator.geolocation.getCurrentPosition(async p=>{const ok=await chPost({u:u.id,n:u.name,r:u.role,x:'📍 My location: https://www.google.com/maps?q='+p.coords.latitude.toFixed(5)+','+p.coords.longitude.toFixed(5),t:Date.now()});if(!ok)return toast('Message not sent. Check your connection.');chPoll(1)},()=>toast('Location blocked. Allow location for this site.'),{enableHighAccuracy:true,timeout:12000})};
window.homeShare=function(){const u=me();if(!u)return auth('login');toggleShare();setTimeout(()=>go('home'),300)};
window.sosModal=function(ok,link){const u=me(),ec=u&&u.ec?String(u.ec).replace(/[^\d+]/g,''):'',body=encodeURIComponent('🆘 I need help! '+(link?'My location: '+link:''));
  $('#modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md" style="text-align:center"><div style="font-size:44px">🆘</div><h3>${ok?'SOS sent to the chat':'SOS could not be sent'}</h3><p class="mut" style="margin:8px 0 12px">${ok?'Riders can see your location in the Chat, but they may not read it right away.':'Check your connection and try again.'} In a real emergency, call now:</p><a class="btn r" style="display:block;text-decoration:none;margin-bottom:8px" href="tel:911">📞 Call 911 (National Emergency)</a><a class="btn" style="display:block;text-decoration:none;margin-bottom:8px" href="tel:143">📞 Philippine Red Cross 143</a>${ec?`<a class="btn" style="display:block;text-decoration:none;margin-bottom:8px" href="sms:${ec}?&body=${body}">💬 Text my emergency contact</a>`:''}${link?`<a class="btn g" style="display:block;text-decoration:none;margin-bottom:8px" href="${link}" target="_blank" rel="noopener">📍 Open my location in Google Maps</a>`:''}<button class="btn g" style="width:100%" onclick="closeM()">Close</button></div></div>`};

/* ---------- screens: new sections injected into the existing views ---------- */
const HX=()=>{const u=me();return`<div class="card rv in" id="hsrv" style="margin-top:12px"><div class="mut">Checking server…</div></div>
<div class="grid" style="margin-top:12px"><div class="card rv in"><div class="big" id="hs1">–</div><div class="mut">Riders live now</div></div><div class="card rv in"><div class="big" id="hs2">–</div><div class="mut">Members</div></div><div class="card rv in"><div class="big" id="hs3">–</div><div class="mut">Community km</div></div></div>
<div class="card rv in" id="hwx" style="margin-top:12px"><div class="mut">Loading ride weather…</div></div><div id="han">${annHome()}</div>
<div class="row" style="margin-top:12px"><button class="btn" onclick="shareApp()">📲 Share app</button><button class="btn g" onclick="homeShare()">📍 ${u&&u.share?'Stop sharing':'Share my location'}</button><button class="btn g" onclick="go('map');setTimeout(fitRiders,1200)">👥 See all riders</button></div>`};
async function homeLoad(){srvPing($('#hsrv'));annLoad();
  const[lv,ld]=await Promise.all([lvGet(),LV()?fx('/leaders'):Promise.resolve({ok:false})]),now=Date.now(),live=Object.values(lv).filter(r=>r&&now-r.t<3e5).length;
  let mem=D.users.length,km=D.users.reduce((a,u)=>a+(+u.km||0),0);if(ld.ok&&ld.d){const a=Object.values(ld.d);mem=a.length;km=a.reduce((s,r)=>s+(+r.km||0),0)}
  const set=(i,v)=>{const e=$('#'+i);if(e)e.textContent=v};set('hs1',live);set('hs2',mem);set('hs3',Math.round(km).toLocaleString());
  const la=MY?MY[0]:10.72,lo=MY?MY[1]:122.56,w=$('#hwx');
  try{const j=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,precipitation,wind_speed_10m&timezone=auto`)).json(),c=j.current,tip=c.precipitation>0.5?'🌧️ Rainy: bring a rain jacket.':c.wind_speed_10m>25?'💨 Windy: expect a harder ride.':c.temperature_2m>33?'🥵 Hot: bring extra water.':'🚴 Good conditions to ride.';
    if(w)w.innerHTML=`<b>⛅ Ride weather · ${MY?'your area':'Iloilo'}</b><div class="mut">${c.temperature_2m}°C · wind ${c.wind_speed_10m} km/h · rain ${c.precipitation} mm</div><div>${tip}</div>`}catch(e){if(w)w.innerHTML='<div class="mut">Weather unavailable right now.</div>'}}
const v0=V.home;V.home=()=>v0().replace('<h3 class="sh">Featured routes</h3>',()=>HX()+'<h3 class="sh">Featured routes</h3>');
const vm=V.map;V.map=()=>vm().replace('<div class="mut" id="hud" style="margin-top:6px"></div>',s=>s+`<div class="row" style="margin-top:8px"><button class="btn g" onclick="myLoc()">📍 My location</button><button class="btn g" onclick="fitRiders()">👥 All riders</button><button class="btn g" onclick="nearest('gas')">⛽ Nearest gas</button><button class="btn g" onclick="nearest('vulc')">🛞 Nearest vulcanizing</button><button class="btn g" onclick="nearest('bike')">🔧 Nearest bike shop</button><button class="btn g" onclick="nearest('med')">🏥 Nearest clinic</button><button class="btn g" onclick="shareLoc()">📤 Share location</button><button class="btn g" onclick="keepOn()">🔆 Keep screen on</button></div>`);
const vc=V.chat;V.chat=()=>vc().replace('<button class="btn" style="flex:none" onclick="send()">Send</button>',s=>s+'<button class="btn g" style="flex:none" onclick="sendLoc()" title="Send my location">📍</button>');
const vb=V.club;V.club=()=>vb().replace('<h2>Announcements</h2>',()=>'<h2>Announcements</h2><div id="anl">').replace('<h2>Leaderboard</h2>',()=>'</div><h2>Leaderboard</h2>').replace(/(<div id="anl">)[\s\S]*?(<\/div><h2>Leaderboard<\/h2>)/,(m,a,b)=>a+annHtml()+b);
const vs=V.set;V.set=()=>{const u=me();return vs().replace('<button class="btn" onclick="saveP()">Save</button>',()=>`<label>Emergency contact number (for SOS text)</label><input id="sec" inputmode="tel" value="${E(u.ec||'')}" placeholder="09XX…"><button class="btn" onclick="saveP()">Save</button>`).replace('<div class="card" style="margin-top:12px"><b>Live location</b>',s=>'<div class="card" style="margin-top:12px" id="sst"></div>'+s)};
const va=V.admin;V.admin=()=>va()
  .replace('<h2>Club default color</h2>',s=>`<h2>Shared server</h2><div class="card"><div id="asst" class="mut">Checking…</div><label>Firebase Realtime Database URL</label><input id="asu" value="${E(LV())}" ${typeof LIVE_URL!=='undefined'&&LIVE_URL?'disabled':''} placeholder="https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app"><div class="row"><button class="btn" onclick="srvSave()">Save &amp; test</button><button class="btn g" onclick="srvLink()">🔗 Share connect link</button></div><div class="mut" style="margin-top:6px">Best: paste the URL in config.js (LIVE_URL) once, so every device uses the same server automatically. The connect link sets it on a phone in one tap.</div></div>`+s)
  .replace(/(<h2>Members<\/h2><div class="card tb")>\s*<table>[\s\S]*?<\/table>/,(m,a)=>a+' id="mt">'+memTable())
  .replace('<h2>Post announcement</h2>',s=>`<h2>Admin tools</h2><div class="card"><div class="row"><button class="btn g" onclick="exportCsv()">⬇ Export members (CSV)</button><button class="btn r" onclick="clearChat()">🗑 Clear chat</button></div></div>`+s);

const g0=window.go;window.go=function(v){const r=g0.apply(this,arguments);
  try{if(v=='home'){homeLoad();poiLoad()}if(v=='set')srvPing($('#sst'));if(v=='admin'){admLoad();srvPing($('#asst'))}if(v=='club')annLoad();if(v=='map')poiLoad()}catch(e){}return r};

/* ---------- start ---------- */
ready=meSync();ready.then(()=>{annLoad();poiLoad()});
if(me()&&me().share)shareOn(1);
go(cur);
})();
