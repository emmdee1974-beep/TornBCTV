import {json} from './_helpers.js';
export async function onRequestPost({request,env}){if(env.SYNC_SECRET&&request.headers.get('x-sync-secret')!==env.SYNC_SECRET)return json({error:'Unauthorized'},401);return json({ok:false,verified:0,error:'Payment verification is intentionally disabled until the exact current Torn user/log payload is mapped and tested.'},501)}
