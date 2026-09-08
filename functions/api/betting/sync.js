import {json,now,currentEvent} from './_helpers.js';
export async function onRequestPost({request,env}){
  if(env.SYNC_SECRET&&request.headers.get('x-sync-secret')!==env.SYNC_SECRET)return json({error:'Unauthorized'},401);
  try{
    const live=await currentEvent(env);const event=live?.elimination||live?.data||live;const eventId=String(event?.id||event?.event_id||'current');const teams=Array.isArray(event?.teams)?event.teams:(Array.isArray(event?.standings)?event.standings:[]);
    await env.DB.prepare('INSERT INTO events(id,name,status,starts_at,closes_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,status=excluded.status,starts_at=excluded.starts_at,closes_at=excluded.closes_at,updated_at=excluded.updated_at').bind(eventId,String(event?.name||'Elimination'),String(event?.status||'LIVE'),Number(event?.starts_at||event?.start_time||0)||null,Number(event?.closes_at||event?.end_time||0)||null,now()).run();
    let count=0;for(const t of teams){const id=String(t.id||t.team_id||t.team||'');if(!id)continue;const name=String(t.name||t.team_name||id);const eliminated=Boolean(t.eliminated||t.lives===0||t.alive===false);await env.DB.prepare('INSERT INTO teams(event_id,id,name,eliminated,pool) VALUES(?,?,?,?,0) ON CONFLICT(event_id,id) DO UPDATE SET name=excluded.name,eliminated=excluded.eliminated').bind(eventId,id,name,eliminated?1:0).run();count++;}
    return json({ok:true,eventId,teamsSynced:count});
  }catch(e){return json({error:e.message},500)}
}
