import {json,sessionUser} from './_helpers.js';
export async function onRequestGet({request,env}){const u=await sessionUser(request,env);return json({authenticated:!!u,player:u?{id:u.torn_id,name:u.torn_name}:null})}
