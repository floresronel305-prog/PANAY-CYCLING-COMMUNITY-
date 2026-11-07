/* install2.js – always-visible "Install" button in the header (works even after "Not now"). */
(function(){
const standalone=()=>(matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
let dip=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e});
addEventListener('appinstalled',()=>{dip=null;const b=document.getElementById('instbtn');if(b)b.remove()});
if(standalone())return;
const b=document.createElement('button');b.id='instbtn';b.innerHTML='📲 <span>Install</span>';
const h=document.querySelector('header'),a=document.getElementById('acct');h.insertBefore(b,a||null);b.style.marginLeft='auto';
b.onclick=async()=>{if(dip){dip.prompt();try{const r=await dip.userChoice;dip=null;if(r.outcome=='accepted')b.remove()}catch(e){}return}
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 document.getElementById('modal').innerHTML=`<div class="ov" onclick="if(event.target==this)closeM()"><div class="md" style="text-align:center"><div style="font-size:40px">📲</div><h3>Install PanayBike</h3><p class="mut" style="margin:8px 0 12px;text-align:left">${ios?'<b>iPhone (Safari):</b><br>1. Tap the <b>Share</b> button<br>2. Tap <b>Add to Home Screen</b><br>3. Tap <b>Add</b>':'<b>Android (Chrome):</b><br>1. Tap the <b>⋮</b> menu (top right)<br>2. Tap <b>Install app</b> or <b>Add to Home screen</b><br>3. Tap <b>Install</b><br><br>Kung wala pa ring lumabas, i-refresh ang page at subukan ulit. Dapat naka-HTTPS ang site at naka-Chrome (hindi sa loob ng Facebook/Messenger browser).'}</p><button class="btn g" style="width:100%" onclick="closeM()">OK</button></div></div>`};
})();
