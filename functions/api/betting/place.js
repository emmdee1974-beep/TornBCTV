import {json,now,money,sessionUser} from './_helpers.js';
function code(){return 'BET-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase()+'-'+Date.now().toString(36).toUpperCase().slice(-4)}
export async function onRequestPost({request,env}){
  try{
    const user=await sessionUser(request,env); if(!user)return json({error:'Connect your Torn account first.'},401);
    const b=await request.json(); const amount=money(b.amount);
    if(!b.teamId)return json({error:'Choose a team.'},400);
    if(!Number.isSafeInteger(amount)||amount<Number(env.MIN_BET||100000))return json({error:`Minimum bet is $${Number(env.MIN_BET||100000).toLocaleString()}.`},400);
    const event=await env.DB.prepare('SELECT * FROM events WHERE status IN (\'SETUP\',\'LIVE\') ORDER BY updated_at DESC LIMIT 1').first();
    if(!event)return json({error:'Betting is not open yet.'},400);
    const team=await env.DB.prepare('SELECT * FROM teams WHERE id=? AND event_id=?').bind(String(b.teamId),event.id).first();
    if(!team||Number(team.eliminated))return json({error:'That team is not available for betting.'},400);
    const c=code();const ts=now();
    await env.DB.prepare('INSERT INTO bets(code,event_id,player_name,player_id,team_id,amount,created_at) VALUES(?,?,?,?,?,?,?)').bind(c,event.id,user.torn_name,user.torn_id,team.id,amount,ts).run();
    return json({bet:{code:c,amount,teamId:team.id,status:'AWAITING_PAYMENT'},payment:{recipientName:env.PAYMENT_RECIPIENT_NAME||'TornBCTV Betting Desk',recipientId:env.PAYMENT_RECIPIENT_ID||'SET PAYMENT ACCOUNT ID'}});
  }catch(e){return json({error:e.message},500)}
}
