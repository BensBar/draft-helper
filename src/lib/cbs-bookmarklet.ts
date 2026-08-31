import { CBS_SYNC_CHANNEL, CBS_SYNC_TYPE } from "./cbs-sync";

export function companionHomeUrl(): string {
  if (typeof window === "undefined") return "https://bensbar.github.io/draft-helper/";
  const path = window.location.pathname.replace(/\/$/, "") || "";
  return `${window.location.origin}${path}/`;
}

export function companionOrigin(): string {
  if (typeof window === "undefined") return "https://bensbar.github.io";
  return window.location.origin;
}

export function relayUrl(): string {
  return `${companionHomeUrl().replace(/\/$/, "")}/sync-relay.html`;
}

/** Compact IIFE Ben drags to the bookmark bar. Click once on a CBS draft page. */
export function buildBookmarkletHref(opts?: { companionUrl?: string; origin?: string; relay?: string }): string {
  const companion = JSON.stringify(opts?.companionUrl ?? companionHomeUrl());
  const origin = JSON.stringify(opts?.origin ?? companionOrigin());
  const relay = JSON.stringify(opts?.relay ?? relayUrl());
  const body = `(()=>{var C=${JSON.stringify(CBS_SYNC_CHANNEL)},T=${JSON.stringify(CBS_SYNC_TYPE)},U=${companion},O=${origin},R=${relay};
if(window.__bensbarDraftSync){window.__bensbarDraftTick&&window.__bensbarDraftTick();return;}
window.__bensbarDraftSync=1;
function scrape(){
  var seen={},out=[],picks=[];
  function add(n,ov){n=(n||'').replace(/\\s+/g,' ').trim();if(n.length<3)return;var k=n.toLowerCase();if(seen[k])return;if(/^(round|pick|overall|empty|kept|clock|draft|search|filter|team)$/i.test(n))return;seen[k]=1;out.push(n);picks.push({name:n,overallPick:ov});}
  var nodes=document.querySelectorAll('[data-player-name],[data-fullname],.player-name,.playerName,.playername,a.playerLink,[class*="player-name"],[class*="playerName"],[class*="pickedPlayer"],[class*="draft-pick"] [class*="name"]');
  nodes.forEach(function(el){var n=el.getAttribute('data-player-name')||el.getAttribute('data-fullname')||el.textContent;var cell=el.closest('[data-pick],[data-overall-pick],[data-pick-number]');var ov=cell&&Number(cell.getAttribute('data-pick')||cell.getAttribute('data-overall-pick')||cell.getAttribute('data-pick-number'));add(n,ov>0?ov:undefined);});
  if(out.length<2){
    document.querySelectorAll('#draftBoard td,.draftBoard td,[class*="draftBoard"] td,[class*="draft-board"] td,[class*="pickCell"],[class*="draft-cell"]').forEach(function(td){
      var t=(td.textContent||'').replace(/KEPT/ig,' ').replace(/\\s+/g,' ').trim();
      var m=t.match(/([A-Z][A-Za-z\\.'\\-]+(?:\\s+[A-Z][A-Za-z\\.'\\-]+){0,3})/);
      if(m)add(m[1]);
    });
  }
  if(out.length<2){
    var hist=document.body.innerText||'';
    hist.split(/\\n/).forEach(function(line){var m=line.match(/(?:Pick\\s*)?(\\d+)[\\.:)\\-\\s]+([A-Z][A-Za-z\\.'\\-]+(?:\\s+[A-Z][A-Za-z\\.'\\-]+){1,3})/);if(m)add(m[2],Number(m[1]));});
  }
  return {names:out,picks:picks};
}
function send(){
  var s=scrape();
  var msg={type:T,version:1,source:'cbs-bookmarklet',names:s.names,picks:s.picks,href:location.href};
  try{new BroadcastChannel(C).postMessage(msg)}catch(e){}
  try{if(window.opener)window.opener.postMessage(msg,O)}catch(e){}
  try{var w=window.__bensbarCompanionWin;if(!w||w.closed){w=window.open(U,'bensbar-draft-helper');window.__bensbarCompanionWin=w;}if(w)w.postMessage(msg,O);}catch(e){}
  try{
    var f=document.getElementById('bensbar-sync-relay');
    if(!f){f=document.createElement('iframe');f.id='bensbar-sync-relay';f.src=R;f.setAttribute('style','position:fixed;width:1px;height:1px;opacity:0;border:0;right:0;bottom:0');document.body.appendChild(f);}
    if(f.contentWindow)f.contentWindow.postMessage(msg,O);
  }catch(e){}
}
window.__bensbarDraftTick=send;
send();
setInterval(send,2000);
try{new MutationObserver(function(){clearTimeout(window.__bensbarMO);window.__bensbarMO=setTimeout(send,400);}).observe(document.body,{childList:true,subtree:true})}catch(e){}
var tip=document.getElementById('bensbar-sync-tip');
if(!tip){tip=document.createElement('div');tip.id='bensbar-sync-tip';tip.textContent="Ben's draft companion syncing…";tip.setAttribute('style','position:fixed;z-index:2147483647;bottom:12px;right:12px;background:#c6ff00;color:#050508;font:700 12px/1.3 sans-serif;padding:8px 10px;letter-spacing:.04em');document.body.appendChild(tip);}
})()`;
  return `javascript:${encodeURIComponent(body)}`;
}

export const BOOKMARKLET_HOW_TO =
  "Open this companion, open the CBS live draft, click the bookmarklet once. It keeps polling. Paste names if CBS blocks it.";
