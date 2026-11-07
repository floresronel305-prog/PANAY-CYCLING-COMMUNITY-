/* spots.js – Admins can change or reset tourist spot photos. Photos are saved on Firebase (/spotimg) so every user sees them. */
(function(){
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=async(p,m,b)=>{const v=LV();if(!v)return;try{const r=await fetch(v+p+'.json',{method:m||'GET',body:b===undefined?undefined:JSON.stringify(b)});return r.ok?await r.json():undefined}catch(e){}};
const slug=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const isAdmin=()=>{const u=me();return !!u&&u.role=='admin'};
let ov={};
async function load(){const d=await J('/spotimg');if(d===undefined)return;ov=d||{};apply();refresh()}
function apply(){D.pois.forEach(p=>{if(p.t!='tour')return;const o=ov[slug(p.n)];if(o)p.img=o;else if(p._so){delete p.img}p._so=o?1:0})}
function refresh(){if(cur=='home'&&window.setTA)setTA(tsA);if(cur=='admin'){const e=$('#spl');if(e)e.innerHTML=list()}}
window.spotPhoto=id=>{if(!isAdmin())return toast('Admins only');const p=D.pois.find(x=>x.id==id);if(!p)return;
 if(!LV())return toast('Connect the shared server first');
 pickImg(async d=>{if(d.length>450000)return toast('Photo is too large. Try a smaller photo.');if(await J('/spotimg/'+slug(p.n),'PUT',d)===undefined)return toast('Could not save the photo. Check your connection.');
  ov[slug(p.n)]=d;apply();toast('Photo updated for '+p.n);refresh()},640,.72)};
window.spotReset=async id=>{if(!isAdmin())return;const p=D.pois.find(x=>x.id==id);if(!p)return;if(!confirm('Remove the custom photo for '+p.n+'?'))return;
 await J('/spotimg/'+slug(p.n),'DELETE');delete ov[slug(p.n)];delete p.img;p._so=0;toast('Photo reset');refresh()};
const list=()=>D.pois.filter(p=>p.t=='tour').map(p=>`<div class="crow"><div style="width:52px;height:52px;border-radius:12px;flex:none;display:grid;place-items:center;font-size:24px;background:${p.img?`url('${p.img}')`:'var(--b)'} center/cover">${p.img?'':(p.i||'📍')}</div><div style="flex:1;min-width:0"><b>${E(p.n)}</b><div class="mut">${ov[slug(p.n)]?'Custom photo':'Default photo'}</div></div><button class="btn" onclick="spotPhoto(${p.id})">📷 Change</button>${ov[slug(p.n)]?`<button class="btn g" onclick="spotReset(${p.id})">Reset</button>`:''}</div>`).join('')||'<div class="mut">No tourist spots yet.</div>';
const va=V.admin;V.admin=()=>va()+'<h2>Tourist spot photos</h2><div class="mut" style="margin-bottom:8px">Change the photo shown for each tourist spot. Everyone sees the new photo.</div><div id="spl" class="cl">'+list()+'</div>';
/* quick 📷 button on the Home tourist cards (admins only) */
function decorate(){if(!isAdmin())return;document.querySelectorAll('#tsg .rc').forEach(c=>{if(c.querySelector('.spic'))return;const m=(c.getAttribute('onclick')||'').match(/goPoi\((\d+)\)/);const t=c.querySelector('.mini');if(!m||!t)return;t.style.position='relative';
 const b=document.createElement('button');b.className='spic';b.textContent='📷';b.title='Change photo';b.onclick=e=>{e.stopPropagation();spotPhoto(m[1])};t.appendChild(b)})}
let dt=null;new MutationObserver(()=>{clearTimeout(dt);dt=setTimeout(decorate,150)}).observe($('#v'),{childList:true,subtree:true});
const g0=window.go;window.go=function(v){const r=g0.apply(this,arguments);if(v=='home'||v=='map'||v=='admin'){apply();load()}return r};
load();
})();
