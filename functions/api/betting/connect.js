import {json,now,torn,randomToken,sha256,sessionCookie} from './_helpers.js';
export async function onRequestPost({request,env}){
  try{
    const body=await request.json(); const key=String(body.apiKey||'').trim();
    if(!/^[a-zA-Z0-9]{16,100}$/.test(key)) return json({error:'Enter a valid Torn Limited API key.'},400);
    const j=await torn('v2/user/basic',key);
    const profile=j?.profile||j?.basic||j?.user||j?.data?.profile||j?.data?.user||j?.data;
    const tornId=Number(profile?.id||j?.profile?.id); const tornName=String(profile?.name||j?.profile?.name||'');
    if(!tornId||!tornName) return json({error:'The key worked, but Torn did not return a player identity.'},400);
    let p=await env.DB.prepare('SELECT * FROM players WHERE torn_id=?').bind(tornId).first();
    if(!p){const r=await env.DB.prepare('INSERT INTO players(torn_id,torn_name,created_at,last_login_at) VALUES(?,?,?,?)').bind(tornId,tornName,now(),now()).run();p={id:r.meta.last_row_id,torn_id:tornId,torn_name:tornName};}
    else await env.DB.prepare('UPDATE players SET torn_name=?,last_login_at=? WHERE id=?').bind(tornName,now(),p.id).run();
    const token=randomToken(),hash=await sha256(token),expires=now()+86400;
    await env.DB.prepare('DELETE FROM sessions WHERE player_id=? OR expires_at<=?').bind(p.id,now()).run();
    await env.DB.prepare('INSERT INTO sessions(token_hash,player_id,created_at,expires_at) VALUES(?,?,?,?)').bind(hash,p.id,now(),expires).run();
    return new Response(JSON.stringify({ok:true,player:{id:tornId,name:tornName},expiresAt:expires}),{status:200,headers:{'content-type':'application/json','cache-control':'no-store','set-cookie':sessionCookie(token)}});
  }catch(e){return json({error:e.message},400)}
}
