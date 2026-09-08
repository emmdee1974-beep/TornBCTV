export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export function now(){return Math.floor(Date.now()/1000)}
export function money(v){return Math.trunc(Number(v||0))}
export async function torn(path,key,params={}){
  if(!key) throw new Error('Missing Torn API key.');
  const u=new URL(`https://api.torn.com/${path}`);u.searchParams.set('key',key);
  for(const [k,v] of Object.entries(params)) if(v!==undefined&&v!==null&&v!=='') u.searchParams.set(k,String(v));
  const r=await fetch(u.toString(),{headers:{'user-agent':'TornBCTV-Betting/2.0'}});
  if(!r.ok) throw new Error(`Torn API HTTP ${r.status}`);
  const j=await r.json(); if(j.error) throw new Error(`Torn API ${j.error.code}: ${j.error.error}`); return j;
}
export async function currentEvent(env){return torn('torn/elimination',env.TORN_API_KEY)}
export async function sha256(text){const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
export function randomToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function sessionUser(request,env){
  const raw=request.headers.get('cookie')||'';const m=raw.match(/(?:^|;\s*)tbctv_session=([^;]+)/);if(!m)return null;
  const hash=await sha256(decodeURIComponent(m[1]));
  return await env.DB.prepare('SELECT p.id,p.torn_id,p.torn_name,s.expires_at FROM sessions s JOIN players p ON p.id=s.player_id WHERE s.token_hash=? AND s.expires_at>?').bind(hash,now()).first();
}
export function sessionCookie(token,maxAge=86400){return `tbctv_session=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`}
export function clearSessionCookie(){return 'tbctv_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'}
