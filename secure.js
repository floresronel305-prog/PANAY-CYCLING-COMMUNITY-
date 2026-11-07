/* secure.js – Admin security (Firebase Authentication) + editable tourist-spot descriptions.
   Load LAST in index.html (after spots.js). Needs FIREBASE_API_KEY in config.js and the new firebase-rules.json published. */
(function(){
'use strict';
const API=typeof FIREBASE_API_KEY!=='undefined'?FIREBASE_API_KEY:'';
const DB=()=>typeof LV==='function'?LV():'';
const IDLE=15*60*1000,MAXFAIL=5,LOCK=15*60*1000,MAXLEN=600;
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=s=>document.querySelector(s);
const key=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'spot';
let sess=null,verified=false,idleT=null,OV={},edits=[];
try{OV=JSON.parse(localStorage.getItem('sx_ov')||'{}')||{}}catch(e){}
const saveS=()=>{try{sessionStorage.setItem('sx_s',JSON.stringify({uid:sess.uid,email:sess.email,refresh:sess.refresh}))}catch(e){}};
const jf=async(u,o)=>{try{const r=await fetch(u,o);let j=null;try{j=await r.json()}catch(e){}return{ok:r.ok,status:r.status,j}}catch(e){return{ok:false,status:0,j:null}}};
const fails=()=>{try{return JSON.parse(localStorage.getItem('sx_f')||'{"n":0,"u":0}')}catch(e){return{n:0,u:0}}};
const setFails=f=>{try{localStorage.setItem('sx_f',JSON.stringify(f))}catch(e){}};

/* ---------- Firebase Auth (REST) ---------- */
async function refresh(){
  const r=await jf('https://securetoken.googleapis.com/v1/token?key='+API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(sess.refresh)});
  if(!r.ok||!r.j)return false;
  sess.idToken=r.j.id_token;sess.refresh=r.j.refresh_token;sess.uid=r.j.user_id;sess.exp=Date.now()+(+r.j.expires_in)*1000;saveS();return true;
}
async function tok(){
  if(!sess)return null;
  if(!sess.idToken||sess.exp-Date.now()<300000){if(!(await refresh())){logout(true);return null}}
  return sess.idToken;
}
async function checkAdmin(){
  const t=await tok();if(!t)return false;
  const r=await jf(DB()+'/admins/'+encodeURIComponent(sess.uid)+'.json?auth='+encodeURIComponent(t));
  return r.ok&&r.j===true;
}
async function signIn(email,pw){
  const f=fails(),now=Date.now();
  if(f.u>now)return{err:'Too many attempts. Try again in '+Math.ceil((f.u-now)/60000)+' min.'};
  if(!API||API.indexOf('PASTE')==0)return{err:'Setup needed: put your Firebase Web API key in config.js (FIREBASE_API_KEY).'};
  if(!DB())return{err:'Shared server is not connected.'};
  const r=await jf('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw,returnSecureToken:true})});
  if(!r.ok||!r.j||!r.j.idToken){
    f.n=(f.n||0)+1;if(f.n>=MAXFAIL){f.u=now+LOCK;f.n=0}setFails(f);
    return{err:f.u>now?'Too many attempts. Locked for 15 minutes.':'Wrong email or password.'};
  }
  sess={uid:r.j.localId,email:r.j.email,idToken:r.j.idToken,refresh:r.j.refreshToken,exp:now+(+r.j.expiresIn)*1000};saveS();
  if(!(await checkAdmin())){sess=null;try{sessionStorage.removeItem('sx_s')}catch(e){}return{err:'This account is not an admin.'}}
  setFails({n:0,u:0});return{ok:1};
}

/* ---------- local role handling ---------- */
function demoteLocal(){try{let c=0;D.users.forEach(u=>{if(u.role==='admin'){u.role='member';c++}if(u.pw==='admin123'){u.pw=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}});if(c)sv()}catch(e){}}
function promote(){
  let u=me();
  if(!u){const k='email:'+sess.email.toLowerCase();u=D.users.find(x=>x.key===k);
    if(!u){u={id:Date.now(),key:k,name:'Admin',email:sess.email,pw:Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2),role:'member',km:0,rides:0,j:Date.now(),prov:'email'};D.users.push(u)}
    D.me=u.id}
  u.role='admin';verified=true;sv();
}
function logout(quiet){
  verified=false;sess=null;clearTimeout(idleT);try{sessionStorage.removeItem('sx_s')}catch(e){}
  demoteLocal();pill();
  if(!quiet)toast('Admin signed out');
  try{hd();if(cur==='admin')go('home')}catch(e){}
}
function idle(){clearTimeout(idleT);if(verified)idleT=setTimeout(()=>{toast('Admin session expired (inactivity)');logout(true)},IDLE)}
['click','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{if(verified)idle()},{passive:true}));

/* ---------- audit log ---------- */
async function log(action,detail){
  const t=await tok();if(!t||!DB())return;
  jf(DB()+'/adminlog.json?auth='+encodeURIComponent(t),{method:'POST',body:JSON.stringify({a:action,d:String(detail||'').slice(0,200),by:sess.email,t:Date.now()})});
}

/* ---------- login modal ---------- */
function openLogin(){
  const f=fails(),locked=f.u>Date.now();
  q('#modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md sx-md"><div class="sx-ic">🔐</div><h3 style="text-align:center">Admin sign-in</h3><p class="mut" style="text-align:center;margin:4px 0 12px">Secured with Firebase Authentication. Only approved admin accounts can enter.</p>
  <label>Admin email</label><input id="sx-e" type="email" autocomplete="username" ${locked?'disabled':''}>
  <label>Password</label><input id="sx-p" type="password" autocomplete="current-password" ${locked?'disabled':''} onkeydown="if(event.key==='Enter')sxLogin()">
  <div class="err" id="sx-err">${locked?'Locked for '+Math.ceil((f.u-Date.now())/60000)+' min.':''}</div>
  <button class="btn" id="sx-go" onclick="sxLogin()" ${locked?'disabled':''}>Sign in</button>
  <button class="btn g" style="margin-top:8px" onclick="closeM()">Cancel</button></div></div>`;
  setTimeout(()=>{const e=q('#sx-e');if(e&&!locked)e.focus()},50);
}
window.sxLogin=async function(){
  const e=q('#sx-e').value.trim(),p=q('#sx-p').value,er=q('#sx-err'),b=q('#sx-go');
  if(!e||!p){er.textContent='Enter email and password.';return}
  b.disabled=true;b.textContent='Checking…';er.textContent='';
  const r=await signIn(e,p);
  if(r.err){er.textContent=r.err;b.disabled=false;b.textContent='Sign in';q('#sx-p').value='';return}
  promote();closeM();pill();idle();log('login','');toast('Welcome, admin 🛡️');try{hd()}catch(x){}go('admin');
};

/* ---------- header pill + hidden entry (tap logo 5x, or #admin) ---------- */
function pill(){
  let p=q('#sx-pill');
  if(!verified){if(p)p.remove();return}
  if(!p){p=document.createElement('button');p.id='sx-pill';p.onclick=()=>go('admin');const h=q('header');if(h)h.appendChild(p)}
  p.textContent='🛡️ Admin';
}
let taps=0,tt;
document.addEventListener('click',e=>{const l=e.target.closest&&e.target.closest('#lg,.lg');if(!l)return;taps++;clearTimeout(tt);tt=setTimeout(()=>taps=0,1500);if(taps>=5){taps=0;verified?go('admin'):openLogin()}});
addEventListener('hashchange',()=>{if(location.hash==='#admin'){history.replaceState(null,'',location.pathname+location.search);verified?go('admin'):openLogin()}});

/* ---------- editable tourist spot descriptions ---------- */
function applyOV(){
  try{
    D.pois.forEach(p=>{
      if(p.t!=='tour')return;const o=OV[key(p.n)];
      if(o&&o.d){if(p._d0===undefined)p._d0=p.d;p.d=o.d}
      else if(p._d0!==undefined){p.d=p._d0;delete p._d0}
    });
    if(q('#tsg'))setTA(tsA);
  }catch(e){}
}
async function loadOV(){
  if(!DB())return;
  const r=await jf(DB()+'/spots.json');
  if(r.ok){OV=r.j||{};try{localStorage.setItem('sx_ov',JSON.stringify(OV))}catch(e){}}
  applyOV();
}
function spotByName(n){return D.pois.find(p=>p.t==='tour'&&p.n===n)}
window.sxEdit=function(i){
  if(!verified)return openLogin();
  const n=typeof i==='number'?edits[i]:i,p=spotByName(n),k=key(n),o=OV[k];
  const cur=o?o.d:(p?(p._d0!==undefined?p._d0:p.d):(window._sxCur||''))||'';
  q('#modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md sx-md"><div class="sx-ic">✏️</div><h3 style="text-align:center">${E(n)}</h3><p class="mut" style="text-align:center;margin:4px 0 10px">Edit the description visitors will see.</p>
  <textarea id="sx-d" maxlength="${MAXLEN}" rows="7" oninput="document.getElementById('sx-c').textContent=this.value.length+'/${MAXLEN}'">${E(o?o.d:cur)}</textarea><div class="mut" id="sx-c" style="text-align:right">${(o?o.d:cur).length}/${MAXLEN}</div>
  <div class="err" id="sx-err"></div>
  <button class="btn" id="sx-sv" onclick="sxSave(${JSON.stringify(n).replace(/"/g,'&quot;')})">Save description</button>
  ${o?`<button class="btn r" style="margin-top:8px" onclick="sxReset(${JSON.stringify(n).replace(/"/g,'&quot;')})">Reset to original</button>`:''}
  <button class="btn g" style="margin-top:8px" onclick="closeM()">Cancel</button></div></div>`;
};
window.sxSave=async function(n){
  const d=q('#sx-d').value.trim(),er=q('#sx-err'),b=q('#sx-sv');
  if(d.length<10){er.textContent='Write at least 10 characters.';return}
  b.disabled=true;b.textContent='Saving…';
  const t=await tok();if(!t){closeM();return openLogin()}
  const r=await jf(DB()+'/spots/'+key(n)+'.json?auth='+encodeURIComponent(t),{method:'PUT',body:JSON.stringify({n,d:d.slice(0,MAXLEN),by:sess.email,t:Date.now()})});
  if(!r.ok){er.textContent=r.status===401||r.status===403?'Server refused (publish the new firebase-rules.json and add your admin UID).':'Could not save (error '+r.status+').';b.disabled=false;b.textContent='Save description';return}
  OV[key(n)]={n,d:d.slice(0,MAXLEN)};try{localStorage.setItem('sx_ov',JSON.stringify(OV))}catch(e){}
  log('edit-spot',n);applyOV();closeM();toast('Description updated for everyone ✅');if(cur==='admin')go('admin');
};
window.sxReset=async function(n){
  if(!confirm('Restore the original description?'))return;
  const t=await tok();if(!t)return openLogin();
  const r=await jf(DB()+'/spots/'+key(n)+'.json?auth='+encodeURIComponent(t),{method:'DELETE'});
  if(!r.ok)return toast('Could not reset (error '+r.status+')');
  delete OV[key(n)];try{localStorage.setItem('sx_ov',JSON.stringify(OV))}catch(e){}
  log('reset-spot',n);applyOV();closeM();toast('Original description restored');if(cur==='admin')go('admin');
};

/* edit buttons: Home spot cards + map popups (admins only) */
function decorate(){
  if(!verified)return;
  document.querySelectorAll('#tsg .rc:not([data-sx])').forEach(c=>{
    c.dataset.sx=1;const b=c.querySelector('b');if(!b)return;
    const i=edits.push(b.textContent)-1,x=document.createElement('button');
    x.className='sx-edit';x.textContent='✏️ Edit';x.onclick=ev=>{ev.stopPropagation();sxEdit(i)};c.appendChild(x);
  });
  document.querySelectorAll('.pp:not([data-sx])').forEach(pp=>{
    pp.dataset.sx=1;const b=pp.querySelector('b'),pw=pp.querySelector('[id^="pw"]'),isT=pp.querySelector('.pimg');
    if(!b||!isT)return;const n=b.textContent;
    if(OV[key(n)]&&pw)pw.textContent=OV[key(n)].d;
    window._sxCur=pw?pw.textContent:'';
    const row=pp.querySelector('.row'),x=document.createElement('button');
    x.className='btn g sx-edit-pop';x.textContent='✏️ Edit text';x.onclick=()=>{window._sxCur=pw?pw.textContent:'';sxEdit(n)};if(row)row.appendChild(x);
  });
}
new MutationObserver(()=>{decorate();if(!verified)popOV()}).observe(document.body,{childList:true,subtree:true});
function popOV(){document.querySelectorAll('.pp:not([data-sv])').forEach(pp=>{pp.dataset.sv=1;const b=pp.querySelector('b'),pw=pp.querySelector('[id^="pw"]');if(b&&pw&&pp.querySelector('.pimg')&&OV[key(b.textContent)])pw.textContent=OV[key(b.textContent)].d})}

/* ---------- admin panel additions ---------- */
async function adminExtras(){
  const w=q('#v .w');if(!w||q('#sx-card'))return;
  const spots=D.pois.filter(p=>p.t==='tour');
  const box=document.createElement('div');box.id='sx-card';
  box.innerHTML=`<div class="card sx-sec"><div class="row" style="flex-wrap:nowrap;align-items:center"><div style="flex:1"><b>🛡️ Secure session</b><div class="mut">${E(sess.email)} · auto sign-out after 15 min idle</div></div><button class="chip" onclick="sxOut()">Sign out</button></div></div>
  <h2>✏️ Tourist spot descriptions</h2><div class="card"><input id="sx-q" placeholder="Search a tourist spot…" oninput="sxFilter(this.value)"><div id="sx-list" class="sx-list">${spots.map(p=>{const i=edits.push(p.n)-1;return`<div class="sx-it" data-n="${E(p.n.toLowerCase())}"><div style="flex:1;min-width:0"><b>${E(p.i||'📍')} ${E(p.n)}</b>${OV[key(p.n)]?' <span class="tag">edited</span>':''}<div class="mut sx-clip">${E(p.d||'')}</div></div><button class="chip" onclick="sxEdit(${i})">Edit</button></div>`}).join('')}</div></div>
  <h2>🧾 Admin activity log</h2><div class="card" id="sx-log"><div class="mut">Loading…</div></div>`;
  w.insertBefore(box,w.children[1]||null);
  const t=await tok();if(!t)return;
  const r=await jf(DB()+'/adminlog.json?auth='+encodeURIComponent(t)+'&orderBy=%22%24key%22&limitToLast=15');
  const el=q('#sx-log');if(!el)return;
  const l=r.ok&&r.j?Object.values(r.j).sort((a,b)=>b.t-a.t):[];
  el.innerHTML=l.length?l.map(x=>`<div class="sx-lg"><b>${E(x.a)}</b> ${E(x.d||'')}<div class="mut">${E(x.by)} · ${new Date(x.t).toLocaleString()}</div></div>`).join(''):'<div class="mut">No activity yet.</div>';
}
window.sxFilter=v=>{v=v.toLowerCase();document.querySelectorAll('#sx-list .sx-it').forEach(e=>e.style.display=e.dataset.n.includes(v)?'':'none')};
window.sxOut=()=>logout();

/* ---------- gate the admin screen ---------- */
const g0=window.go;
window.go=function(v){
  if(v==='admin'&&!verified){openLogin();return}
  const r=g0.apply(this,arguments);
  if(v==='admin')adminExtras();
  if(verified)idle();
  return r;
};

/* ---------- boot ---------- */
demoteLocal();
(async function(){
  try{
    const s=JSON.parse(sessionStorage.getItem('sx_s')||'null');
    if(s&&s.refresh&&API){sess={uid:s.uid,email:s.email,refresh:s.refresh,idToken:null,exp:0};
      if(await checkAdmin()){promote();pill();idle();try{hd()}catch(e){}}else logout(true)}
  }catch(e){}
  loadOV();
  if(location.hash==='#admin'){history.replaceState(null,'',location.pathname+location.search);verified?go('admin'):openLogin()}
})();
setInterval(loadOV,5*60*1000);
})();
