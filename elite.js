/* elite.js – bottom tab bar, floating SOS, splash, Challenges & badges, ride chat rooms, online presence, admin stats. Server = same Firebase. Loaded after company.js. */
(function(){
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=async(p)=>{const v=LV();if(!v)return;try{const r=await fetch(v+p+'.json');return r.ok?await r.json():undefined}catch(e){}};
const TB=[['home','🏠','Home'],['map','🗺️','Map'],['events','🗓️','Rides'],['msg','💬','Inbox'],['more','☰','More']];
function bar(){let b=$('#tabbar');if(!b){b=document.createElement('div');b.id='tabbar';document.body.appendChild(b)}
 b.innerHTML=TB.map(([k,i,n])=>`<button class="${cur==k?'on':''}" onclick="${k=='more'?'moreM()':`go('${k}')`}">${i}<span>${n}</span></button>`).join('');
 let f=$('#sosfab');if(!f){f=document.createElement('button');f.id='sosfab';f.textContent='🆘';f.title='SOS';f.onclick=()=>me()?sos():auth('login');document.body.appendChild(f)}}
window.moreM=()=>{const u=me(),L=[['club','🎫','Member'],['chal','🏆','Challenges'],['pay','💸','Pay'],['wallet','👛','Wallet'],['shop','🛍️','Shop'],['jobs','💼','Jobs'],['ultra','🕶️','Ultra AR'],['tools','🧰','Tools'],['polls','🗳️','Polls'],['calc','🧮','Ride calculator'],['help','❓','Help'],['feedback','📝','Feedback'],['photos','📷','Photos'],['about','ℹ️','About'],['set','⚙️','Settings']];if(u&&u.role=='admin')L.push(['admin','🛡️','Admin']);
 $('#modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md"><h3>Menu</h3><div class="mg">${L.filter(x=>V[x[0]]).map(x=>`<button onclick="closeM();go('${x[0]}')">${x[1]}<span>${x[2]}</span></button>`).join('')}<button onclick="closeM();eDesk()">${dOn()?'📱':'🖥️'}<span>${dOn()?'Mobile view':'Desktop view'}</span></button><button onclick="closeM();window.tools?tools():toast('Refresh the app to load App options')">⚙️<span>App options</span></button></div></div></div>`};

/* ---------- desktop / mobile view (also in the More menu) ---------- */
const vpm=document.querySelector('meta[name=viewport]'),VB=vpm.content,dOn=()=>{try{return localStorage.getItem('pb_desk')=='1'}catch(e){return false}};window.dOn=dOn;
const dApply=()=>{vpm.content=dOn()?'width=1100, initial-scale=0.35, user-scalable=yes':VB};dApply();
window.eDesk=()=>{try{localStorage.setItem('pb_desk',dOn()?'0':'1')}catch(e){}dApply();toast(dOn()?'Desktop view ON':'Mobile view ON')};
/* ---------- challenges & badges ---------- */
const BD=[[10,'🚲','First 10 km'],[50,'🥉','50 km'],[100,'🥈','100 km'],[500,'🥇','500 km'],[1000,'🏆','1000 km']],GOAL=100;
V.chal=()=>{const u=me();if(!u)return'<div class="card cco"><h3>Sign in to join challenges</h3><button class="btn" onclick="auth(\'login\')">Log in</button></div>';
 const km=+u.km||0,m=new Date().toISOString().slice(0,7),mk=u.mk==m?+u.mkm||0:0,p=Math.min(100,mk/GOAL*100);
 return`<h2>🏆 Monthly challenge</h2><div class="card"><b>Ride ${GOAL} km this month</b><div class="mut">${mk.toFixed(1)} / ${GOAL} km${p>=100?' · ✅ Complete!':''}</div><div class="pbar"><i style="width:${p}%"></i></div></div>
 <h2>Badges</h2><div class="bgs">${BD.map(([n,i,t])=>`<div class="bg ${km>=n?'got':''}"><span>${i}</span><small>${t}</small></div>`).join('')}</div>
 <h2>Top riders</h2><div class="cl" id="cht"><div class="mut">Loading…</div></div>`};
async function chalLoad(){const d=await J('/leaders'),el=$('#cht');if(!el)return;if(!d)return el.innerHTML='<div class="mut">Connect the server to see the leaderboard.</div>';
 const a=Object.values(d).filter(r=>r&&(r.n||r.name)).sort((x,y)=>(+y.km||0)-(+x.km||0)).slice(0,10);
 el.innerHTML=a.map((r,i)=>`<div class="crow"><span class="av">${['🥇','🥈','🥉'][i]||i+1}</span><b style="flex:1">${E(r.n||r.name)}</b><span class="mut">${(+r.km||0).toFixed(0)} km</span></div>`).join('')||'<div class="mut">No riders yet.</div>'}

/* ---------- ride chat rooms (Events page) ---------- */
window.evChat=i=>{const e=window._evs[i];window._pend=['ev_'+e.k,e.t];go('msg')};
async function evChats(){const d=await J('/events');if(!d||cur!='events')return;const l=Object.entries(d).map(([k,v])=>({...v,k})).sort((a,b)=>b.ts-a.ts).slice(0,12);window._evs=l;
 $('#v').insertAdjacentHTML('afterbegin',`<h2>💬 Ride chats</h2><div class="cl" style="margin-bottom:12px">${l.map((e,i)=>`<div class="crow" onclick="evChat(${i})"><span class="av">🚴</span><div style="flex:1"><b>${E(e.t)}</b><div class="mut">${new Date(e.ts).toLocaleString()}</div></div><span class="btn g" style="padding:5px 10px">Chat</span></div>`).join('')||'<div class="mut">No rides yet.</div>'}</div>`)}

/* ---------- admin stats ---------- */
const va=V.admin;V.admin=()=>'<div class="grid" id="ast"><div class="card"><div class="big">–</div><div class="mut">Members</div></div><div class="card"><div class="big">–</div><div class="mut">Community km</div></div><div class="card"><div class="big">–</div><div class="mut">Live riders</div></div></div>'+va();
async function admStats(){const[u,l]=await Promise.all([J('/users'),J('/live')]),el=$('#ast');if(!el||!u)return;const a=Object.values(u).filter(x=>x&&x.key),now=Date.now();
 const n=[a.length,Math.round(a.reduce((s,x)=>s+(+x.km||0),0)).toLocaleString(),Object.values(l||{}).filter(r=>r&&now-r.t<3e5).length];el.querySelectorAll('.big').forEach((e,i)=>e.textContent=n[i])}

/* ---------- presence, splash, hooks ---------- */
const beat=()=>{const u=me(),b=LV();if(u&&b&&!document.hidden)fetch(b+'/presence/'+u.id+'.json',{method:'PUT',body:JSON.stringify({n:u.name,t:Date.now()})}).catch(()=>{})};setInterval(beat,40000);setTimeout(beat,2500);
const h0=window.hd;window.hd=function(){const r=h0.apply(this,arguments);bar();return r};
const g0=window.go;window.go=function(v){const r=g0.apply(this,arguments);bar();try{if(v=='chal')chalLoad();if(v=='events')evChats();if(v=='admin')admStats();if(v=='home')beat()}catch(e){}return r};
const sp=document.createElement('div');sp.id='splash';sp.innerHTML='<img src="logo.png" alt=""><b>PANAY CYCLING</b>';document.body.appendChild(sp);setTimeout(()=>sp.classList.add('out'),700);setTimeout(()=>sp.remove(),1300);
hd();go(cur);
})();
