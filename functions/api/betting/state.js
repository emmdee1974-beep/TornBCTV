import {json,currentEvent} from './_helpers.js';
export async function onRequestGet({env}){try{
  const live=await currentEvent(env);const event=live?.elimination||live?.data||live;const eventId=String(event?.id||event?.event_id||'current');
  const rows=await env.DB.prepare('SELECT id,name,eliminated FROM teams WHERE event_id=? ORDER BY name').bind(eventId).all();
  const teams=rows.results||[];
  const pools=await env.DB.prepare("SELECT team_id,SUM(amount) pool FROM bets WHERE event_id=? AND status='PAID' GROUP BY team_id").bind(eventId).all();
  const poolMap=Object.fromEntries((pools.results||[]).map(r=>[String(r.team_id),Number(r.pool||0)]));
  const total=teams.reduce((a,t)=>a+(poolMap[String(t.id)]||0),0),feeBps=Number(env.FEE_BPS||500),winnerPool=Math.floor(total*(10000-feeBps)/10000);
  return json({event:{id:eventId,status:event?.status||'LIVE',name:event?.name||'Elimination',winnerTeamId:event?.winner_team_id||null},feeBps,totalPool:total,winnerPool,teams:teams.map(t=>{const pool=poolMap[String(t.id)]||0;return {...t,pool,multiplier:!Number(t.eliminated)&&pool>0?winnerPool/pool:0}})});
}catch(e){return json({error:e.message},500)}}