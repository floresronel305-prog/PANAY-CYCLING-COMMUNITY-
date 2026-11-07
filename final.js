/* final.js – Polls, Ride calculator, Help/FAQ, Feedback (+ admin inbox), About-the-developer card. Data on the same Firebase server. */
(function(){
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const J=async(p,m,b)=>{const v=LV();if(!v)return;try{const r=await fetch(v+p+'.json',{method:m||'GET',body:b===undefined?undefined:JSON.stringify(b)});return r.ok?await r.json():undefined}catch(e){}};
const need='<div class="card cco"><h3>Server not connected</h3><div class="mut">Ask the admin to connect the shared server.</div></div>';
const login='<div class="card cco"><h3>Please log in first</h3><button class="btn" onclick="auth(\'login\')">Log in</button></div>';

/* ---------- Polls ---------- */
V.polls=()=>!me()?login:!LV()?need:`<h2>🗳️ Community polls</h2>${me().role=='admin'?'<button class="btn" onclick="pollNew()">+ New poll</button>':''}<div id="pl" style="margin-top:10px"><div class="mut">Loading…</div></div>`;
async function pollLoad(){const d=await J('/polls'),el=$('#pl');if(!el)return;if(d===undefined)return el.innerHTML='<div class="mut">Could not load polls.</div>';
 const u=me(),l=Object.entries(d||{}).map(([k,v])=>({...v,k})).sort((a,b)=>b.t-a.t);
 el.innerHTML=l.map(p=>{const v=p.votes||{},n=Object.keys(v).length,mine=v[u.id];return`<div class="card" style="margin-bottom:10px"><b>${E(p.q)}</b><div class="mut">by ${E(p.by)} · ${n} vote${n==1?'':'s'}</div>${(p.o||[]).map((o,i)=>{const c=Object.values(v).filter(x=>x==i).length,pc=n?Math.round(c/n*100):0;return`<div class="crow" style="margin-top:6px;position:relative;overflow:hidden" onclick="pollVote('${p.k}',${i})"><div style="position:absolute;left:0;top:0;bottom:0;width:${pc}%;background:color-mix(in srgb,var(--a),transparent 80%)"></div><span style="position:relative;flex:1">${mine==i?'✅ ':''}${E(o)}</span><b style="position:relative">${pc}%</b></div>`}).join('')}${u.role=='admin'?`<a class="mut" style="cursor:pointer;display:block;margin-top:8px" onclick="pollDel('${p.k}')">🗑 Delete poll</a>`:''}</div>`}).join('')||'<div class="mut">No polls yet.</div>'}
window.pollVote=async(k,i)=>{await J('/polls/'+k+'/votes/'+me().id,'PUT',i);pollLoad()};
window.pollDel=async k=>{if(!confirm('Delete this poll?'))return;await J('/polls/'+k,'DELETE');pollLoad()};
window.pollNew=async()=>{const q=(prompt('Poll question:')||'').trim();if(!q)return;const o=(prompt('Options, separated by commas (2 to 6):','Yes,No')||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,6);if(o.length<2)return toast('Enter at least 2 options');
 if(await J('/polls','POST',{q,o,by:me().name,t:Date.now()})===undefined)return toast('Could not create the poll.');toast('Poll created');pollLoad()};

/* ---------- Ride calculator ---------- */
V.calc=()=>`<h2>🧮 Ride calculator</h2><div class="card"><label>Distance (km)</label><input id="cd" type="number" inputmode="decimal" value="30"><label>Average speed (km/h)</label><input id="cs2" type="number" inputmode="decimal" value="20"><label>Your weight (kg)</label><input id="cw" type="number" inputmode="decimal" value="65"><button class="btn" style="margin-top:10px;width:100%" onclick="calcGo()">Calculate</button><div id="cr" style="margin-top:12px"></div></div>`;
window.calcGo=()=>{const d=+$('#cd').value,s=+$('#cs2').value,w=+$('#cw').value;if(!(d>0&&s>0&&w>0))return toast('Enter valid numbers');const h=d/s,met=s<16?6:s<20?8:s<25?10:12,m=Math.round(h*60);
 $('#cr').innerHTML=`<div class="grid"><div class="card"><div class="big">${Math.floor(m/60)}h ${m%60}m</div><div class="mut">Ride time</div></div><div class="card"><div class="big">${Math.round(met*w*h)}</div><div class="mut">Calories (estimate)</div></div><div class="card"><div class="big">${Math.round(d*.9*10)/10}</div><div class="mut">Water (liters, est.)</div></div></div>`};

/* ---------- Help / FAQ ---------- */
const FAQ=[['How do I chat with another rider?','Open Inbox, pick a rider, and send a message. Messages are stored on the shared server, so both of you see them.'],['How do I share my live location?','Open Map or Home and turn on Live location. Other riders will see you on the map.'],['Is the money real?','No. All money in this app is DEMO money. There is no real GCash, bank or payment.'],['How do I send demo money?','Open a private chat and tap Send, or use Wallet › Scan to pay with a rider\'s QR code.'],['How do I install the app?','Tap the Install button in the header, or use your browser menu and choose Add to Home screen.'],['Something is not updating','Tap the ⋯ button in the header, then Refresh app.'],['How do I use desktop view?','Tap ⋯ in the header, then Desktop view. Tap it again to return to Mobile view.']];
V.help=()=>`<h2>❓ Help & FAQ</h2>${FAQ.map(f=>`<details class="card" style="margin-bottom:8px"><summary style="cursor:pointer;font-weight:700">${E(f[0])}</summary><div class="mut" style="margin-top:6px">${E(f[1])}</div></details>`).join('')}<div class="row" style="margin-top:10px"><button class="btn" onclick="go('feedback')">📝 Send feedback</button></div>`;

/* ---------- Feedback ---------- */
V.feedback=()=>!me()?login:!LV()?need:`<h2>📝 Feedback</h2><div class="card"><div class="mut">The developer is a beginner and your feedback helps a lot. Thank you!</div><label>Type</label><select id="ft"><option>Idea</option><option>Bug</option><option>Other</option></select><label>Message</label><textarea id="fx" rows="5" maxlength="800" style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--b);background:var(--c);color:var(--t)" placeholder="Tell us what to fix or add…"></textarea><button class="btn" style="margin-top:10px;width:100%" onclick="fbSend()">Send feedback</button></div>`;
window.fbSend=async()=>{const x=$('#fx').value.trim();if(!x)return toast('Please write a message');const u=me();
 if(await J('/feedback','POST',{u:u.id,n:u.name,ty:$('#ft').value,x,t:Date.now()})===undefined)return toast('Could not send. Check your connection.');toast('Thank you! Feedback sent.');go('home')};
const va=V.admin;V.admin=()=>va()+'<h2>Feedback inbox</h2><div id="fbl" class="cl"><div class="mut">Loading…</div></div>';
async function fbLoad(){const d=await J('/feedback'),el=$('#fbl');if(!el)return;const l=Object.entries(d||{}).map(([k,v])=>({...v,k})).sort((a,b)=>b.t-a.t).slice(0,30);
 el.innerHTML=l.map(f=>`<div class="card"><b>${E(f.ty)}</b> · ${E(f.n)} <span class="mut">${new Date(f.t).toLocaleString()}</span><div>${E(f.x)}</div><a class="mut" style="cursor:pointer" onclick="fbDel('${f.k}')">🗑 Delete</a></div>`).join('')||'<div class="mut">No feedback yet.</div>'}
window.fbDel=async k=>{await J('/feedback/'+k,'DELETE');fbLoad()};

/* ---------- About the developer ---------- */
const vab=V.about;V.about=()=>vab()+`<div class="card" style="margin-top:12px"><h3>👨‍💻 About the developer</h3><p class="mut" style="margin-top:6px">This app was built by Ronel S. Flores, a beginner developer who is still learning. Thank you for your patience and support. If you find a bug or have an idea, please send feedback.</p><div class="row" style="margin-top:8px"><button class="btn" onclick="go('feedback')">📝 Send feedback</button><button class="btn g" onclick="go('help')">❓ Help</button></div></div>`;

const g0=window.go;window.go=function(v){const r=g0.apply(this,arguments);try{if(v=='polls')pollLoad();if(v=='admin')fbLoad()}catch(e){}return r};
})();
