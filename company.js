/* company.js – Inbox (server chat rooms + private DMs + replies, reactions, photos, typing), demo-money send, polished Home hero.
   Loaded LAST. Chat data lives ONLY on Firebase (/chat, /rooms, /dm, /dmidx, /typing), never local storage. Money is DEMO. */
(function(){
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=n=>'₱'+(+n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const U=()=>me(),nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const J=async(p,m,b)=>{const v=LV();if(!v)return;try{const r=await fetch(v+p+'.json',{method:m||'GET',body:b===undefined?undefined:JSON.stringify(b)});return r.ok?await r.json():undefined}catch(e){}};
const ROOMS={gen:['💬','General','Everyone'],rides:['🚴','Rides','Plan group rides'],mkt:['🛒','Marketplace','Buy, sell, swap parts']};
const rp=r=>r=='gen'?'/chat':r.startsWith('dm_')?'/dm/'+r.slice(3):'/rooms/'+r;
const ago=t=>{const a=Date.now()-t;return a<6e4?'now':a<36e5?Math.round(a/6e4)+'m':a<864e5?Math.round(a/36e5)+'h':new Date(t).toLocaleDateString()};
let R=null,RT='',peer=null,sig='',tm=null,lastTy=0,reply=null,idxT=null;
const seen=()=>{try{return JSON.parse(localStorage.getItem('pb_seen')||'{}')}catch(e){return{}}},mark=k=>{const s=seen();s[k]=Date.now();try{localStorage.setItem('pb_seen',JSON.stringify(s))}catch(e){}};

/* ---------- demo wallet (same /px ledger as Wallet & Pay) ---------- */
const bal=async id=>Math.round(Object.values(await J('/px/txs/'+id)||{}).reduce((n,x)=>n+(x.a>0&&x.a<1e9?(x.y=='in'?x.a:-x.a):0),0)*100)/100;
async function move(from,to,a,note){const w=await J('/px/wallets/'+from)||{};if(w.frozen)return'Frozen ang wallet mo.';if(w.pin&&w.pin!=prompt('PIN:'))return'Maling PIN.';
 if(!(a>0&&a<=50000))return'Invalid na halaga.';const b=await bal(from);if(b<a)return'Kulang ang balance ('+P(b)+').';
 const t=Date.now();if(await J('/px/txs/'+from+'/'+nid(),'PUT',{t,y:'out',a,m:note})===undefined)return'Hindi na-save. Check ang internet.';
 w.bal=Math.round((b-a)*100)/100;await J('/px/wallets/'+from,'PUT',w);await J('/px/txs/'+to+'/'+nid(),'PUT',{t,y:'in',a,m:note});const w2=await J('/px/wallets/'+to)||{};w2.bal=await bal(to);await J('/px/wallets/'+to,'PUT',w2);return''}
async function topup(){const u=U();if(!u)return auth('login');if(await bal(u.id)>=20000)return toast('Mataas na ang demo balance.');
 const t=Date.now();await J('/px/txs/'+u.id+'/'+nid(),'PUT',{t,y:'in',a:500,m:'Demo top-up'});const w=await J('/px/wallets/'+u.id)||{};w.bal=await bal(u.id);await J('/px/wallets/'+u.id,'PUT',w);toast('+₱500 DEMO money added');fillHero()}
async function sendMoney(to,name){const u=U(),a=parseFloat(prompt('Send DEMO money to '+(name||'user')+' (₱):','100'));if(!(a>0))return;
 const e=await move(u.id,to,a,'Sent to '+(name||'user'));if(e)return toast(e);await post({x:'💸 Sent '+P(a)+' (demo)',pay:a});toast('Naipadala ang '+P(a));fillHero()}

/* ---------- messaging core ---------- */
async function post(extra){const u=U();if(!u||!R)return false;const rec={u:u.id,n:u.name,r:u.role,t:Date.now(),...extra};if(reply){rec.q={n:reply.n,x:String(reply.x||'📷').slice(0,60)};reply=null}
 const ok=await J(rp(R),'POST',rec)!==undefined;if(ok&&peer){const pv=(rec.x||'📷').slice(0,60),k=R.slice(3);await J('/dmidx/'+u.id+'/'+k,'PUT',{w:peer.id,n:peer.n,x:pv,t:rec.t,f:u.id});await J('/dmidx/'+peer.id+'/'+k,'PUT',{w:u.id,n:u.name,x:pv,t:rec.t,f:u.id})}return ok}
async function load(){const l=await J(rp(R)+'?orderBy=%22%24key%22&limitToLast=60');if(l===undefined)return null;return Object.entries(l||{}).map(([k,v])=>({...v,k})).filter(m=>m&&(m.x||m.i)).sort((a,b)=>a.t-b.t)}
const bub=m=>{const u=U(),mine=m.u==u.id,rx=m.rx||{},cnt={};Object.values(rx).forEach(e=>cnt[e]=(cnt[e]||0)+1);
 return`<div class="cm ${mine?'me':''} ${m.pay?'pay':''}"><div class="cmh"><b>${E(m.n)}</b>${m.r=='admin'?'<span class="tag">admin</span>':''}<span>${ago(m.t)}</span></div>${m.q?`<div class="cq">↩ <b>${E(m.q.n)}</b>: ${E(m.q.x)}</div>`:''}${m.i?`<img class="cimg" src="${m.i}" alt="photo">`:''}${m.x?`<div>${E(m.x)}</div>`:''}
 <div class="cact">${['👍','❤️','😂'].map(e=>`<a onclick="cRx('${m.k}','${e}')" class="${rx[u.id]==e?'on':''}">${e}${cnt[e]||''}</a>`).join('')}<a onclick="cRep('${m.k}')">↩</a>${mine||u.role=='admin'?`<a onclick="cDel('${m.k}')">🗑</a>`:''}</div></div>`};
let cache=[];
async function tick(){if(cur!='msg'||!R)return;const [l,ty]=await Promise.all([load(),J('/typing/'+R)]);const b=$('#cb2');if(!l||!b)return;cache=l;const s=JSON.stringify(l);
 if(s!=sig){sig=s;const near=b.scrollHeight-b.scrollTop-b.clientHeight<120||!b.dataset.f;b.dataset.f=1;b.innerHTML=l.map(bub).join('')||'<div class="mut" style="padding:20px;text-align:center">Wala pang messages. Mag-hi! 👋</div>';if(near)b.scrollTop=b.scrollHeight;mark(R)}
 const me_=U().id,w=Object.entries(ty||{}).filter(([k,v])=>k!=me_&&Date.now()-v.t<4500).map(([k,v])=>v.n.split(' ')[0]);const t=$('#cty');if(t)t.textContent=w.length?w.join(', ')+' is typing…':''}
window.cRx=async(k,e)=>{const u=U(),m=cache.find(x=>x.k==k);if(!m)return;const same=(m.rx||{})[u.id]==e;await J(rp(R)+'/'+k+'/rx/'+u.id,same?'DELETE':'PUT',same?undefined:e);tick()};
window.cRep=k=>{reply=cache.find(x=>x.k==k);const q=$('#crep');if(q&&reply){q.style.display='flex';q.firstChild.textContent='↩ '+reply.n+': '+String(reply.x||'📷').slice(0,50)}$('#cin').focus()};
window.cDel=async k=>{if(!confirm('Delete this message?'))return;await J(rp(R)+'/'+k,'DELETE');tick()};
window.cSend=async()=>{const i=$('#cin'),x=i.value.trim().slice(0,600);if(!x)return;i.value='';if(!await post({x})){i.value=x;return toast('Hindi naipadala. Check ang server connection.')}tick();$('#crep').style.display='none'};
window.cImg=()=>pickImg(async d=>{if(d.length>350000)return toast('Masyadong malaki ang photo.');if(!await post({i:d}))return toast('Hindi naipadala.');tick()});
window.cTyping=()=>{const u=U();if(Date.now()-lastTy<2000)return;lastTy=Date.now();J('/typing/'+R+'/'+u.id,'PUT',{n:u.name,t:Date.now()})};
window.cMoney=()=>peer&&sendMoney(peer.id,peer.n);

/* ---------- screens ---------- */
const need=()=>`<div class="card cco"><h3>🔴 Server not connected</h3><div class="mut">Real chat needs the shared Firebase server. Admin: Admin › Shared server.</div></div>`;
V.msg=()=>!U()?`<div class="card cco"><h3>Sign in to chat</h3><button class="btn" onclick="auth('login')">Log in</button></div>`:!LV()?need():'<div id="co"></div>';
window.cOpen=(r,t,pid,pn)=>{R=r;RT=t;sig='';cache=[];reply=null;peer=pid?{id:pid,n:pn}:null;const b=$('#co');
 b.innerHTML=`<div class="chd"><button class="btn g" onclick="cBack()">←</button><div><b>${E(t)}</b><div class="mut" id="cty">${peer?'Private message':'Group room'}</div></div>${peer?'<button class="btn" onclick="cMoney()">💸 Send</button>':''}</div>
 <div class="cbox" id="cb2"></div><div class="crep" id="crep" style="display:none"><span></span><a onclick="reply=null;this.parentNode.style.display='none'">✕</a></div>
 <div class="cbar"><button class="btn g" onclick="cImg()">📷</button><input id="cin" maxlength="600" placeholder="Type a message…" oninput="cTyping()" onkeydown="if(event.key=='Enter')cSend()"><button class="btn" onclick="cSend()">Send</button></div>`;mark(r);tick();clearInterval(tm);tm=setInterval(tick,2500)};
window.cBack=()=>{R=null;clearInterval(tm);inbox()};
async function inbox(){const b=$('#co');if(!b)return;const u=U(),[ix,us]=await Promise.all([J('/dmidx/'+u.id),J('/users')]),sn=seen();
 const cv=Object.entries(ix||{}).sort((a,b)=>b[1].t-a[1].t),ppl=Object.values(us||{}).filter(x=>x&&x.id&&x.id!=u.id);
 b.innerHTML=`<h2>Inbox</h2><div class="cl">${Object.entries(ROOMS).map(([k,v])=>`<div class="crow" onclick="cOpen('${k}','${v[1]}')"><span class="av">${v[0]}</span><div><b>${v[1]}</b><div class="mut">${v[2]}</div></div></div>`).join('')}</div>
 <h2>Private messages</h2><div class="cl">${cv.map(([k,v])=>`<div class="crow" onclick="cOpen('dm_${k}','${E(v.n)}','${E(v.w)}','${E(v.n)}')"><span class="av">${E((v.n||'?')[0]).toUpperCase()}</span><div style="flex:1;min-width:0"><b>${E(v.n)}</b>${v.t>(sn['dm_'+k]||0)&&v.f!=u.id?'<i class="dot"></i>':''}<div class="mut" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(v.x)}</div></div><span class="mut">${ago(v.t)}</span></div>`).join('')||'<div class="mut" style="padding:10px">Wala pang private chats. Pumili ng rider sa ibaba.</div>'}</div>
 <h2>Riders (${ppl.length})</h2><input id="cs" class="csr" placeholder="Search riders…" oninput="cFind(this.value)"><div class="cl" id="cpl">${ppl.map(x=>pr(x)).join('')}</div>`;window._ppl=ppl}
const pr=x=>`<div class="crow" data-n="${E((x.name||'').toLowerCase())}" onclick="cDm('${E(x.id)}','${E(x.name)}')"><span class="av">${E((x.name||'?')[0]).toUpperCase()}</span><div style="flex:1"><b>${E(x.name)}</b><div class="mut">${x.role=='admin'?'Admin':'Member'} · ${(+x.km||0).toFixed(0)} km</div></div><span class="btn g" style="padding:5px 10px">Message</span></div>`;
window.cFind=q=>{q=q.toLowerCase();document.querySelectorAll('#cpl .crow').forEach(r=>r.style.display=r.dataset.n.includes(q)?'':'none')};
window.cDm=(id,n)=>cOpen('dm_'+[U().id,id].sort().join('_'),n,id,n);
async function idxPoll(){const u=U();if(!u||!LV())return;const ix=await J('/dmidx/'+u.id);if(!ix)return;const sn=seen();let n=0;
 Object.entries(ix).forEach(([k,v])=>{if(v.f!=u.id&&v.t>(sn['dm_'+k]||0)){if(!(cur=='msg'&&R=='dm_'+k)){n++;const key='pb_n_'+k;if(localStorage.getItem(key)!=v.t){localStorage.setItem(key,v.t);window.notify&&notify({type:'info',title:'💬 '+v.n,body:v.x,go:'msg',tag:k+v.t})}}else mark('dm_'+k)}});
 const d=$('#cdot');if(d)d.textContent=n?n:''}

/* ---------- home hero + quick actions ---------- */
const HERO=()=>{const u=U();return u?`<div class="hero"><div><div class="mut">Magandang araw,</div><h2 style="margin:0">${E(u.name.split(' ')[0])} 👋</h2></div><div class="hb"><div class="mut">Demo wallet</div><div class="big" id="cbal">₱–</div></div></div>
<div class="qa"><button onclick="go('msg')">💬<span>Inbox</span></button><button onclick="go('pay')">💸<span>Pay</span></button><button onclick="cTop()">➕<span>Top up</span></button><button onclick="go('events')">🗓️<span>Rides</span></button><button onclick="go('map')">🗺️<span>Map</span></button><button onclick="go('club')">🎫<span>Member</span></button></div>`:''};
window.cTop=topup;
async function fillHero(){const u=U(),e=$('#cbal');if(u&&e&&LV())e.textContent=P(await bal(u.id))}
const v0=V.home;V.home=()=>HERO()+v0();
const h0=window.hd;window.hd=function(){const r=h0.apply(this,arguments);const n=$('#nav');if(n&&U()&&!n.querySelector('.cnv')){const b=document.createElement('button');b.className='cnv'+(cur=='msg'?' on':'');b.onclick=()=>go('msg');b.innerHTML='💬 Inbox <i class="dot" id="cdot"></i>';n.insertBefore(b,n.children[4]||null)}return r};
const g0=window.go;window.go=function(v){clearInterval(tm);if(v!='msg')R=null;const r=g0.apply(this,arguments);try{if(v=='msg'&&LV()&&U())inbox();if(v=='home')fillHero()}catch(e){}return r};
setInterval(idxPoll,15000);setTimeout(idxPoll,3000);hd();go(cur);
})();
