/* plus.js – Panay Wallet, Shop, Jobs (Employer/Employee) and LGU. Loaded AFTER app.js; nothing in app.js is removed.
   Uses the same Firebase (LIVE_URL) under /px, or this device's localStorage if LIVE_URL is empty. */
(function(){
const P=n=>'₱'+(+n||0).toFixed(2),U=()=>me(),nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const L=()=>{try{return JSON.parse(localStorage.getItem('pbx'))||{}}catch(e){return{}}};
const G=async c=>{const b=LV();if(b)try{return await(await fetch(`${b}/px/${c}.json`)).json()||{}}catch(e){return{}}return L()[c]||{}};
const S=async(c,k,v)=>{const b=LV();if(b){try{const r=await fetch(`${b}/px/${c}/${k}.json`,{method:v==null?'DELETE':'PUT',body:JSON.stringify(v)});if(!r.ok){window.PXERR=r.status+' '+(await r.text()).slice(0,90);return false}return true}catch(e){window.PXERR=String(e.message||e);return false}}const o=L();o[c]=o[c]||{};v==null?delete o[c][k]:o[c][k]=v;try{localStorage.setItem('pbx',JSON.stringify(o));return true}catch(e){return false}};
const gate=n=>`<h2>${n}</h2><div class="card"><p>Please log in to use ${n}.</p><br><button class="btn" onclick="auth('login')">Log in</button></div>`;
const out=(h,f)=>{setTimeout(f,0);return`<div id="px">${h}</div>`};
const ask=async()=>{const w=await G('wallets/'+U().id);return w.pin?prompt('Enter your Wallet PIN')||'\0':''};
const sv=async(...a)=>{const ok=await S(...a);if(!ok)toast('Not saved: '+(window.PXERR||'storage error'));return ok};
const R=h=>{$('#px').innerHTML=h};

/* ---------- WALLET ---------- */
async function move(from,to,amt,note,pin,skip){if(from==to)return'Cannot pay yourself';const a=await G('wallets/'+from),b=await G('wallets/'+to);
 if(a.frozen)return'Wallet is frozen';if(a.pin&&!skip&&a.pin!=pin)return'Wrong PIN';if(!(amt>0)||(a.bal||0)<amt)return'Insufficient Wallet balance';
 a.bal-=amt;a.pts=(a.pts||0)+Math.floor(amt/100);b.bal=(b.bal||0)+amt;await S('wallets',from,a);await S('wallets',to,b);
 const t=Date.now();await S('txs/'+from,nid(),{t,y:'out',a:amt,m:note});await S('txs/'+to,nid(),{t,y:'in',a:amt,m:note})}
V.wallet=()=>U()?out('Loading…',rw):gate('Wallet');
async function rw(){const u=U(),w=await G('wallets/'+u.id),al=Object.values(await G('txs/'+u.id)),t=al.slice().sort((a,b)=>b.t-a.t).slice(0,30);
 const led=Math.round(al.reduce((n,x)=>n+(x.a>0&&x.a<1e11?(x.y=='in'?x.a:-x.a):0),0)*100)/100;if(Math.abs(led-(+w.bal||0))>.005){w.bal=led;await S('wallets',u.id,w)}
 await S('wdir',u.id,{n:u.name,e:(u.email||u.phone||'').toLowerCase()});
 R(`<h2>💳 Panay Wallet</h2><div class="card"><div class="mut">Demo balance${w.frozen?' · ❄️ FROZEN':''}</div><div class="big">${P(led)}</div><div class="mut">⭐ ${w.pts||0} points · Wallet ID ${u.id}</div><div class="mut" style="margin-top:8px">🧪 DEMO wallet: hindi totoong pera at walang totoong GCash o bangko.</div></div>
 <div class="row" style="margin:10px 0"><button class="btn" onclick="wAdd()">+ Add demo money</button><button class="btn" onclick="wSend()">Send</button></div>
 <div class="row"><button class="btn g" onclick="wPin()">${w.pin?'Change':'Set'} PIN</button><button class="btn g" onclick="wFrz()">${w.frozen?'Unfreeze':'Freeze'}</button><button class="btn g" onclick="wOut()">Withdraw (demo)</button></div>
 <h3 class="sh">Transactions</h3>${t.map(x=>`<div class="card" style="margin-bottom:6px"><b>${x.y=='in'?'+':'−'}${P(x.a)}</b> <span class="mut">${E(x.m)} · ${new Date(x.t).toLocaleString()}</span></div>`).join('')||'<p class="mut">No transactions yet.</p>'}`)}
async function credit(a,m,y){const u=U(),w=await G('wallets/'+u.id);let b=Number.isFinite(+w.bal)&&Math.abs(w.bal)<1e11?+w.bal:0;w.bal=Math.round((b+(y=='in'?a:-a))*100)/100;if(!(await S('wallets',u.id,w)))return false;await S('txs/'+u.id,nid(),{t:Date.now(),y,a,m});return true}
async function wAdd(){const a=parseFloat(prompt('Amount to add (GCash / bank – DEMO top-up, no real payment yet)'));if(!(a>0))return;if(a>5e10)return toast('Demo top-up max is ₱50,000,000,000');const ok=await credit(Math.round(a*100)/100,'Top-up (demo)','in');if(!ok)toast('Top-up failed: '+(window.PXERR||'not saved'));go('wallet')}
async function wSend(){const q=(prompt('Send to: email, phone or Wallet ID')||'').trim().toLowerCase();if(!q)return;const d=await G('wdir'),k=Object.keys(d).find(i=>i==q||d[i].e==q);if(!k)return toast('Recipient not found (they must open their Wallet once)');
 const a=parseFloat(prompt('Send how much to '+d[k].n+'?'));if(!(a>0))return;const e=await move(U().id,k,a,'Sent to '+d[k].n,await ask());toast(e||'Sent '+P(a));go('wallet')}
async function wPin(){const p=prompt('New 4-digit PIN');if(!/^\d{4}$/.test(p||''))return toast('PIN must be 4 digits');const w=await G('wallets/'+U().id);w.pin=p;await S('wallets',U().id,w);toast('PIN saved')}
async function wFrz(){const w=await G('wallets/'+U().id);w.frozen=!w.frozen;await S('wallets',U().id,w);go('wallet')}
async function wOut(){const a=parseFloat(prompt('Withdraw how much to your bank/GCash? (request only)'));const w=await G('wallets/'+U().id);if(w.frozen||!(a>0)||a>(w.bal||0))return toast('Cannot withdraw that amount');if(w.pin&&prompt('PIN')!=w.pin)return toast('Wrong PIN');await credit(a,'Withdraw request (pending)','out');go('wallet')}

/* ---------- SHOP (each shop sees only its own orders/products) ---------- */
let CT=[],SQ='',PM={};
V.shop=()=>U()?out('Loading…',rs):gate('Shop');
async function rs(){const u=U(),sh=await G('shops'),pr=await G('products'),me_=sh[u.id],all=[];PM={};
 Object.entries(pr).forEach(([s,o])=>Object.values(o).forEach(p=>{p.s=s;PM[p.id]=p;all.push(p)}));const q=SQ.toLowerCase(),l=all.filter(p=>!q||(p.n+' '+p.c).toLowerCase().includes(q));
 const ct=CT.map(i=>PM[i]).filter(Boolean),tot=ct.reduce((a,p)=>a+p.p,0),mo=Object.values(await G('ordersBy/'+u.id)).sort((a,b)=>b.t-a.t);
 let h=`<h2>🛍️ Shop</h2><input placeholder="Search products or category" value="${E(SQ)}" onchange="SQ=this.value;go('shop')"><div class="g2">${l.map(p=>`<div class="card"><b>${E(p.n)}</b><div class="mut">${E(p.c)} · ${E((sh[p.s]||{}).n||'')}</div><div class="big" style="font-size:18px">${P(p.p)}</div><button class="btn" onclick="CT.push('${p.id}');toast('Added');go('shop')">Add to cart</button></div>`).join('')||'<p class="mut">No products yet.</p>'}</div>`;
 if(ct.length)h+=`<h3 class="sh">🛒 Cart</h3><div class="card">${ct.map((p,i)=>`<div class="row"><span>${E(p.n)}</span><b>${P(p.p)}</b><button class="btn g" onclick="CT.splice(${i},1);go('shop')">✕</button></div>`).join('')}<br><button class="btn" onclick="shCo()">Pay ${P(tot)} with Wallet</button></div>`;
 if(mo.length)h+=`<h3 class="sh">My orders</h3>${mo.slice(0,10).map(o=>`<div class="card" style="margin-bottom:6px"><b>${E(o.sn)}</b> · ${P(o.tot)} · <span class="chip on">${o.st}</span><div class="mut">${o.it.map(i=>E(i.n)).join(', ')}</div></div>`).join('')}`;
 h+=`<h3 class="sh">My shop</h3>`;
 if(!me_)h+=`<div class="card"><p class="mut">Sell your products to Panay riders.</p><br><button class="btn" onclick="shReg()">Register my shop</button></div>`;
 else{const od=Object.values(await G('orders/'+u.id)).sort((a,b)=>b.t-a.t),sales=od.filter(o=>o.st!='rejected').reduce((a,o)=>a+o.tot,0),mp=Object.values(pr[u.id]||{});
  h+=`<div class="card"><b>${E(me_.n)}</b><div class="mut">${E(me_.a)}</div><div class="row" style="margin:8px 0"><div><div class="big">${od.length}</div><span class="mut">orders</span></div><div><div class="big">${P(sales)}</div><span class="mut">sales</span></div></div><button class="btn" onclick="shAdd()">+ Add product</button></div>
  ${mp.map(p=>`<div class="card" style="margin-top:6px"><div class="row"><span>${E(p.n)} · ${P(p.p)}</span><button class="btn g" onclick="shEdit('${p.id}')">Edit</button><button class="btn r" onclick="shDel('${p.id}')">Delete</button></div></div>`).join('')}
  <h3 class="sh">Orders to handle</h3>${od.map(o=>`<div class="card" style="margin-bottom:6px"><b>${E(o.bn)}</b> · ${P(o.tot)} · <span class="chip on">${o.st}</span><div class="mut">${o.it.map(i=>E(i.n)).join(', ')}</div>${o.st=='pending'?`<div class="row"><button class="btn" onclick="shSt('${o.id}','accepted')">Accept</button><button class="btn r" onclick="shSt('${o.id}','rejected')">Reject</button></div>`:o.st=='accepted'?`<button class="btn" onclick="shSt('${o.id}','delivered')">Mark delivered</button>`:''}</div>`).join('')||'<p class="mut">No orders yet.</p>'}`}
 R(h)}
async function shReg(){const n=(prompt('Shop name')||'').trim(),a=(prompt('Shop address')||'').trim();if(!n)return;await sv('shops',U().id,{id:U().id,n,a});go('shop')}
async function shAdd(){const n=(prompt('Product name')||'').trim(),c=(prompt('Category (e.g. Bikes, Parts, Apparel)')||'General').trim(),p=parseFloat(prompt('Price (₱)'));if(!n||!(p>=0))return;const i=nid();if(await sv('products/'+U().id,i,{id:i,n,c,p}))toast('Product added');go('shop')}
async function shEdit(i){const o=(await G('products/'+U().id))[i];if(!o)return;o.n=prompt('Name',o.n)||o.n;o.p=parseFloat(prompt('Price',o.p))||o.p;await sv('products/'+U().id,i,o);go('shop')}
async function shDel(i){if(!confirm('Delete product?'))return;await S('products/'+U().id,i,null);go('shop')}
async function shCo(){const u=U(),g={};CT.map(i=>PM[i]).filter(Boolean).forEach(p=>(g[p.s]=g[p.s]||[]).push(p));const pin=await ask(),sh=await G('shops');
 for(const s in g){const tot=g[s].reduce((a,p)=>a+p.p,0),e=await move(u.id,s,tot,'Order from '+(sh[s]||{}).n,pin);if(e)return toast(e);
  const o={id:nid(),s,sn:(sh[s]||{}).n||'',b:u.id,bn:u.name,it:g[s].map(p=>({n:p.n,p:p.p})),tot,st:'pending',t:Date.now()};await S('orders/'+s,o.id,o);await S('ordersBy/'+u.id,o.id,o)}
 CT=[];toast('Order placed – paid with Wallet');go('shop')}
async function shSt(i,st){const u=U(),o=(await G('orders/'+u.id))[i];if(!o)return;o.st=st;await S('orders/'+u.id,i,o);await S('ordersBy/'+o.b,i,o);if(st=='rejected')await move(u.id,o.b,o.tot,'Refund: '+o.sn,'',1);go('shop')}

/* ---------- JOBS: Employer & Employee ---------- */
let JQ='';
V.jobs=()=>U()?out('Loading…',rj):gate('Jobs');
async function rj(){const u=U(),jb=Object.values(await G('jobs')).sort((a,b)=>b.t-a.t),q=JQ.toLowerCase(),mine=jb.filter(j=>j.o==u.id),ap=await G('apps'),my=jb.filter(j=>ap[j.id]&&ap[j.id][u.id]);
 let h=`<h2>💼 Jobs</h2><input placeholder="Search jobs" value="${E(JQ)}" onchange="JQ=this.value;go('jobs')">${jb.filter(j=>j.o!=u.id&&(!q||(j.ti+j.pl).toLowerCase().includes(q))).map(j=>`<div class="card" style="margin-bottom:6px"><b>${E(j.ti)}</b><div class="mut">${E(j.on)} · ${E(j.pl)} · ${P(j.s)}/month</div>${ap[j.id]&&ap[j.id][u.id]?`<span class="chip on">${ap[j.id][u.id].st}</span>`:`<button class="btn" onclick="jbApply('${j.id}')">1-click apply</button>`}</div>`).join('')||'<p class="mut">No jobs posted yet.</p>'}`;
 h+=`<h3 class="sh">Employer dashboard</h3><button class="btn" onclick="jbPost()">+ Post a job</button>`;
 h+=mine.map(j=>{const a=Object.values(ap[j.id]||{});return`<div class="card" style="margin-top:8px"><b>${E(j.ti)}</b> · ${P(j.s)} · ${a.length} applicant(s)<button class="btn r" style="float:right" onclick="jbDel('${j.id}')">✕</button>${a.map(x=>`<div class="row" style="margin-top:6px"><span>${E(x.n)} <span class="chip on">${x.st}</span></span>${x.st=='pending'?`<button class="btn" onclick="jbSt('${j.id}','${x.u}','hired')">Accept</button><button class="btn r" onclick="jbSt('${j.id}','${x.u}','rejected')">Reject</button>`:x.st=='hired'?`<button class="btn" onclick="jbPay('${j.id}','${x.u}')">Pay salary</button>`:''}</div>`).join('')}</div>`}).join('');
 if(my.length)h+=`<h3 class="sh">My applications / my salary</h3>${my.map(j=>`<div class="card" style="margin-bottom:6px">${E(j.ti)} @ ${E(j.on)} · <span class="chip on">${ap[j.id][u.id].st}</span></div>`).join('')}`;R(h)}
async function jbPost(){const ti=(prompt('Job title')||'').trim(),s=parseFloat(prompt('Monthly salary (₱)')),pl=(prompt('Location')||'Panay').trim();if(!ti||!(s>=0))return;const i=nid();await S('jobs',i,{id:i,o:U().id,on:U().name,ti,s,pl,t:Date.now()});go('jobs')}
async function jbDel(i){if(!confirm('Delete this job?'))return;await S('jobs',i,null);go('jobs')}
async function jbApply(i){await S('apps/'+i,U().id,{u:U().id,n:U().name,st:'pending',t:Date.now()});toast('Applied!');go('jobs')}
async function jbSt(j,uid,st){const a=(await G('apps/'+j))[uid];a.st=st;await S('apps/'+j,uid,a);go('jobs')}
async function jbPay(j,uid){const jb=(await G('jobs'))[j],a=parseFloat(prompt('Salary to pay',jb.s));if(!(a>0))return;const e=await move(U().id,uid,a,'Salary: '+jb.ti,await ask());toast(e||'Salary paid via Wallet');go('jobs')}

/* ---------- LGU ---------- */
const HOT=[['Emergency','911'],['Philippine Red Cross','143'],['NDRRMC','(02) 8911-1406'],['Iloilo City CDRRMO','(033) 337-1200']];
V.lgu=()=>U()?out('Loading…',rl):gate('LGU');
async function rl(){const u=U(),ad=u.role=='admin',an=Object.values(await G('lguann')).sort((a,b)=>b.t-a.t),rp=Object.values(await G('reports')).filter(r=>ad||r.u==u.id).sort((a,b)=>b.t-a.t);
 R(`<h2>🏛️ LGU Services</h2>${ad?`<button class="btn" onclick="lgAnn()">+ Announcement / disaster alert</button>`:''}${an.map(a=>`<div class="card" style="margin-top:6px">${a.al?'🚨 ':'📢 '}${E(a.x)}<div class="mut">${new Date(a.t).toLocaleDateString()}</div></div>`).join('')}
 <h3 class="sh">Report a road problem</h3><button class="btn" onclick="lgRep()">📷 Report with photo + GPS</button>${rp.map(r=>`<div class="card" style="margin-top:6px">${E(r.x)} <span class="chip on">${r.st}</span>${r.ph?`<img src="${r.ph}" style="width:100%;border-radius:10px;margin-top:6px">`:''}<div class="mut">${r.la?`<a href="https://www.openstreetmap.org/?mlat=${r.la}&mlon=${r.lo}" target="_blank" style="color:var(--a)">View on map</a> · `:''}${E(r.n)}</div>${ad&&r.st!='fixed'?`<button class="btn" onclick="lgFix('${r.id}')">Mark fixed</button>`:''}</div>`).join('')}
 <h3 class="sh">Permit application (₱100 fee via Wallet)</h3><button class="btn" onclick="lgPermit()">Apply for event / business permit</button>
 <h3 class="sh">Emergency hotlines</h3>${HOT.map(h=>`<div class="card" style="margin-bottom:6px"><a href="tel:${h[1].replace(/[^\d]/g,'')}" style="color:var(--a)">📞 ${h[0]} – ${h[1]}</a></div>`).join('')}`)}
async function lgAnn(){const x=(prompt('Announcement text')||'').trim();if(!x)return;const i=nid();await S('lguann',i,{x,al:confirm('Mark as DISASTER ALERT?'),t:Date.now()});go('lgu')}
async function lgRep(){const x=(prompt('Describe the road problem')||'').trim();if(!x)return;const pos=navigator.geolocation?await new Promise(r=>navigator.geolocation.getCurrentPosition(p=>r(p.coords),()=>r(null),{timeout:8000})):null;
 pickImg(async ph=>{const i=nid();await S('reports',i,{id:i,u:U().id,n:U().name,x,ph,la:pos&&pos.latitude,lo:pos&&pos.longitude,st:'open',t:Date.now()});go('lgu')},640,.6)}
async function lgFix(i){const r=(await G('reports'))[i];r.st='fixed';await S('reports',i,r);go('lgu')}
async function lgPermit(){const t=(prompt('Permit type (Event / Business / Group ride)')||'').trim();if(!t)return;const e=await move(U().id,1,100,'LGU permit fee: '+t,await ask());if(e)return toast(e);const i=nid();await S('permits',i,{id:i,u:U().id,t,st:'paid',ts:Date.now()});toast('Permit submitted & paid');go('lgu')}

Object.assign(window,{CT:CT,SQ:'',wAdd,wSend,wPin,wFrz,wOut,shReg,shAdd,shEdit,shDel,shCo,shSt,jbPost,jbDel,jbApply,jbSt,jbPay,lgAnn,lgRep,lgFix,lgPermit});
Object.defineProperty(window,'CT',{get:()=>CT,set:v=>CT=v});Object.defineProperty(window,'SQ',{get:()=>SQ,set:v=>SQ=v});Object.defineProperty(window,'JQ',{get:()=>JQ,set:v=>JQ=v});
const h0=hd;hd=function(){h0();const n=$('#nav');if(n)n.insertAdjacentHTML('beforeend',[['wallet','💳','Wallet'],['shop','🛍️','Shop'],['jobs','💼','Jobs'],['lgu','🏛️','LGU']].map(x=>`<button class="${cur==x[0]?'on':''}" onclick="go('${x[0]}')"><span>${x[1]}</span>${x[2]}</button>`).join(''))};hd();
})();
/* Tip bar when the phone browser is stuck in "Desktop site" mode */
addEventListener('load',()=>{if(screen.width<=600&&innerWidth>=800&&!navigator.standalone){const d=document.createElement('div');d.style.cssText='position:fixed;top:env(safe-area-inset-top,0px);left:0;right:0;z-index:99;background:#f59e0b;color:#000;font:700 22px system-ui;padding:14px;text-align:center';d.innerHTML='⚠️ Naka-Desktop site ang browser. Tap ⋮ menu → alisin ang check sa "Desktop site". <u onclick="this.parentNode.remove()">OK</u>';document.body.appendChild(d)}});
