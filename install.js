/* "Install this app" banner for PanayBike.
   Android/Chrome: shows an Install button that opens the real install prompt.
   iPhone/Safari: shows the "Share > Add to Home Screen" steps.
   Not shown if the app is already installed or if the person tapped "Not now" in the last 3 days. */
(function(){
  var KEY='pb_install_dismissed',WAIT=3*24*3600*1000,deferred=null,box=null;
  function standalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
  function recentlyDismissed(){try{var t=+localStorage.getItem(KEY);return t&&Date.now()-t<WAIT}catch(e){return false}}
  function dismiss(){try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}hide()}
  function hide(){if(box){box.remove();box=null}}
  function show(html,withInstall){
    if(box||standalone()||recentlyDismissed())return;
    box=document.createElement('div');
    box.setAttribute('role','dialog');box.setAttribute('aria-label','Install this app');
    box.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:440px;margin:0 auto;z-index:60;background:var(--c,#12284a);color:var(--t,#eaf1ff);border:1px solid var(--a,#2563eb);border-radius:16px;padding:12px;box-shadow:0 10px 30px #0008;display:flex;gap:10px;align-items:center;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif';
    var img='<img src="icon-192.png" alt="" style="width:44px;height:44px;border-radius:10px;flex:none">';
    var txt='<div style="flex:1;min-width:0"><b>Install PanayBike</b><div style="font-size:12px;opacity:.8">'+html+'</div></div>';
    var btns='<div style="display:flex;flex-direction:column;gap:6px;flex:none">'+(withInstall?'<button id="pbi-go" style="border:0;border-radius:10px;padding:8px 14px;background:var(--a,#2563eb);color:#fff;font-weight:700;font-size:14px;cursor:pointer">Install</button>':'')+'<button id="pbi-no" style="border:0;background:transparent;color:inherit;opacity:.75;font-size:12px;cursor:pointer;padding:2px">Not now</button></div>';
    box.innerHTML=img+txt+btns;
    document.body.appendChild(box);
    var no=document.getElementById('pbi-no');if(no)no.onclick=dismiss;
    var go=document.getElementById('pbi-go');
    if(go)go.onclick=function(){
      if(!deferred){hide();return}
      deferred.prompt();
      deferred.userChoice.then(function(r){deferred=null;if(r&&r.outcome==='accepted')hide();else dismiss()}).catch(hide);
    };
  }
  addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();deferred=e;
    setTimeout(function(){show('Add this app to your home screen for quick access.',true)},2500);
  });
  addEventListener('appinstalled',function(){deferred=null;hide()});
  /* iPhone/iPad Safari has no install event, so show the manual steps */
  var ua=navigator.userAgent||'',ios=/iphone|ipad|ipod/i.test(ua)&&!window.MSStream;
  if(ios&&!standalone()){
    addEventListener('load',function(){setTimeout(function(){show('Tap <b>Share</b> then <b>Add to Home Screen</b>.',false)},3000)});
  }
})();
