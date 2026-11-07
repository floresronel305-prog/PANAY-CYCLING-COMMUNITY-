/* extra.js – Wallet card + QR (receive/scan to pay, DEMO money) and Ride summary image. Same Firebase server. Loaded last. */
(function(){
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=n=>'₱'+(+n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const J=async(p,m,b)=>{const v=LV();if(!v)return;try{const r=await fetch(v+p+'.json',{method:m||'GET',body:b===undefined?undefined:JSON.stringify(b)});return r.ok?await r.json():undefined}catch(e){}};
const M=h=>$('#modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md" style="text-align:center">${h}<button class="btn g" style="width:100%;margin-top:10px" onclick="closeM();window._st&&window._st()">Close</button></div></div>`;

/* ---------- wallet card, QR, history ---------- */
async function wcard(){const u=me();if(!u||cur!='wallet'||$('#wc')||!LV())return;const[b,t]=await Promise.all([_bal(u.id),J('/px/txs/'+u.id)]);if(cur!='wallet'||$('#wc'))return;
 const l=Object.values(t||{}).sort((a,c)=>c.t-a.t).slice(0,8);
 $('#v').insertAdjacentHTML('afterbegin',`<div id="wc"><div class="wcard"><small>RON PAY · DEMO</small><div class="wb">${P(b)}</div><div class="wn"><span>${E(u.name)}</span><span>•••• ${E(String(u.id).slice(-4))}</span></div></div>
 <div class="qa"><button onclick="qrMine()">🔳<span>My QR</span></button><button onclick="qrScan()">📷<span>Scan to pay</span></button><button onclick="go('msg')">💸<span>Send in chat</span></button></div>
 <h2>Recent activity</h2><div class="cl" style="margin-bottom:14px">${l.map(x=>`<div class="crow"><span class="av" style="background:${x.y=='in'?'#16a34a':'#dc2626'}">${x.y=='in'?'⬇':'⬆'}</span><div style="flex:1"><b>${E(x.m||'Transaction')}</b><div class="mut">${new Date(x.t).toLocaleString()}</div></div><b style="color:${x.y=='in'?'#16a34a':'#dc2626'}">${x.y=='in'?'+':'-'}${P(x.a)}</b></div>`).join('')||'<div class="mut">Wala pang transaksyon.</div>'}</div></div>`)}
const lib=()=>window.QRCode?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
window.qrMine=async()=>{const u=me();M(`<h3>My payment QR</h3><div class="mut">Ipa-scan sa ibang rider para padalhan ka (DEMO)</div><div id="qrb" style="display:inline-block;background:#fff;padding:12px;border-radius:14px;margin:12px 0"></div><div><b>${E(u.name)}</b></div>`);
 try{await lib();new QRCode($('#qrb'),{text:'pbpay|'+u.id+'|'+u.name,width:220,height:220})}catch(e){$('#qrb').textContent='Hindi ma-load ang QR. Check ang internet.'}};
async function payTo(id,n){const u=me();if(id==u.id)return toast('Ikaw ito 😄');const a=parseFloat(prompt('Send DEMO money to '+n+' (₱):','100'));if(!(a>0))return;const e=await _move(u.id,id,a,'QR pay to '+n);if(e)return toast(e);toast('Naipadala ang '+P(a)+' kay '+n);go('wallet')}
const parse=t=>{const p=String(t).split('|');return p[0]=='pbpay'&&p[1]?[p[1],p[2]||'rider']:null};
let stream=null;window._st=()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}};
window.qrScan=async()=>{const u=me();if(!u)return auth('login');
 if(!('BarcodeDetector'in window)){const t=prompt('Hindi supported ang camera scan dito. I-paste ang QR text:');const r=t&&parse(t);return r?payTo(...r):t&&toast('Invalid QR');}
 M('<h3>Scan to pay</h3><video id="qv" playsinline muted style="width:100%;border-radius:14px;background:#000"></video>');
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});const v=$('#qv');v.srcObject=stream;await v.play();const d=new BarcodeDetector({formats:['qr_code']});
  const loop=async()=>{if(!stream)return;try{const c=await d.detect(v);const r=c[0]&&parse(c[0].rawValue);if(r){window._st();closeM();return payTo(...r)}}catch(e){}setTimeout(loop,350)};loop()}catch(e){closeM();toast('Payagan ang camera.')}};

/* ---------- ride summary image ---------- */
window.rideCard=km=>{const u=me();if(!u)return;const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#2563eb');g.addColorStop(1,'#7c3aed');x.fillStyle=g;x.fillRect(0,0,1080,1350);
 const im=new Image();im.onload=()=>{x.save();x.beginPath();x.arc(540,240,100,0,7);x.clip();x.drawImage(im,440,140,200,200);x.restore();x.fillStyle='#fff';x.textAlign='center';
  x.font='700 46px system-ui,sans-serif';x.fillText('PANAY CYCLING COMMUNITY',540,430);x.font='800 250px system-ui,sans-serif';x.fillText((+km).toFixed(1),540,800);x.font='700 64px system-ui,sans-serif';x.fillText('KILOMETERS',540,885);
  x.font='600 56px system-ui,sans-serif';x.fillText(u.name,540,1050);x.font='40px system-ui,sans-serif';x.fillText(new Date().toLocaleDateString()+' · Total '+Math.round(u.km||0)+' km · '+(u.rides||0)+' rides',540,1120);window._rc=c;
  M(`<h3>🎉 Ride complete!</h3><img src="${c.toDataURL('image/jpeg',.85)}" style="width:100%;border-radius:14px;margin:8px 0"><div class="row"><button class="btn" onclick="rideShare()">📤 Share</button></div>`)};im.onerror=()=>toast('Hindi ma-load ang logo.');im.src='logo.png'};
window.rideShare=()=>window._rc.toBlob(async b=>{const f=new File([b],'panaybike-ride.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]}))try{await navigator.share({files:[f],text:'My ride with Panay Cycling Community'})}catch(e){}else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;a.click()}});
const ak=window.addKm;window.addKm=function(u,k,r){const x=ak.apply(this,arguments);if(r&&k>0&&u.id==D.me){setTimeout(()=>rideCard(k),600);J('/ridelog/'+u.id+'/'+Date.now().toString(36),'PUT',{km:k,t:Date.now()})}return x};
const cv=V.chal;if(cv)V.chal=()=>cv()+`<h2>📸 Ride summary</h2><div class="card"><div class="mut">Gumawa ng shareable na larawan ng ride mo.</div><button class="btn" style="margin-top:8px" onclick="rideCard(prompt('Km ng ride:','10')||0)">Create image</button></div>`;
const g0=window.go;window.go=function(v){const r=g0.apply(this,arguments);if(v=='wallet'){setTimeout(wcard,800);setTimeout(wcard,2000)}return r};
})();
