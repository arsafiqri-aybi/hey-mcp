import test from 'node:test';
import assert from 'node:assert/strict';
import {HeyStore} from '../src/worker.js';
import worker from '../src/worker.js';
import {hash,token,to64,canonical,validateCommand,publicUrl,seal,unseal,passwordHash} from '../src/core.js';

class Storage {
  data=new Map();
  async get(k){return structuredClone(this.data.get(k));}
  async put(k,v){this.data.set(k,structuredClone(v));}
  async delete(k){return this.data.delete(k);}
  async list({prefix,startAfter,limit=1000}){return new Map([...this.data].filter(([k])=>k.startsWith(prefix)&&(!startAfter||k>startAfter)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]));}
  async setAlarm(at){this.alarm=at;}
}
async function harness(){const storage=new Storage(),control=token(),setup=token(),env={STATE_KEY:to64(crypto.getRandomValues(new Uint8Array(32))),CONTROL_HASH:await hash(control),SETUP_HASH:await hash(setup),SETUP_EXPIRES:String(Date.now()+100000)};const store=new HeyStore({storage},env);return {store,storage,env,control,setup};}
async function request(h,path,b,access=h.control,method='POST',origin){const headers={};if(access)headers.Authorization='Bearer '+access;if(origin)headers.Origin=origin;if(b)headers['Content-Type']='application/json';return h.store.fetch(new Request('https://hey.test'+path,{method,headers,body:b?JSON.stringify(b):undefined}));}
async function pair(h){const r=await h.store.createPair('My phone','https://hey.test'),code=new URL(r.pairingLink).searchParams.get('code');const response=await request(h,'/api/enroll',{code},null);return response.json();}
async function poll(h,d,more={}){const r=await request(h,'/api/device/poll',{session:'session-1',health:{browser:'READY'},...more},d.deviceToken);return {status:r.status,data:await r.json()};}
const action=()=>crypto.randomUUID();

test('canonical action digests are stable and command schema rejects unknown fields',()=>{
  assert.equal(canonical({b:2,a:[1,3]}),canonical({a:[1,3],b:2}));
  assert.throws(()=>validateCommand({method:'action',payload:{action:'fill',ref:'r1',text:'password'}}),/STATE_VERSION/);
  assert.throws(()=>validateCommand({method:'navigate',payload:{url:'https://example.com',shell:'rm'}}),/UNKNOWN_PAYLOAD/);
  for(const url of ['http://example.com','https://localhost','https://127.0.0.1','https://[::1]','https://example.com:8080','https://u:p@example.com'])assert.throws(()=>publicUrl(url));
});
test('sensitive commands are encrypted, authenticated, and cannot be tampered with',async()=>{
  const key=to64(crypto.getRandomValues(new Uint8Array(32))),s=await seal({password:'sensitive-value'},key);assert.ok(!JSON.stringify(s).includes('sensitive-value'));assert.deepEqual(await unseal(s,key),{password:'sensitive-value'});s.data=(s.data[0]==='A'?'B':'A')+s.data.slice(1);await assert.rejects(()=>unseal(s,key));
});
test('anonymous MCP denied, health discloses no device or credentials',async()=>{
  const h=await harness();assert.equal((await request(h,'/mcp',{jsonrpc:'2.0',id:1,method:'tools/list'},null)).status,401);
  const health=await worker.fetch(new Request('https://hey.test/health'),{});assert.equal((await health.json()).deviceVerified,false);
});
test('owner forms preserve same-origin POST metadata and reject null or foreign origins',async()=>{
  const h=await harness(),path='/setup/'+h.setup;
  const page=await request(h,path,null,null,'GET');assert.equal(page.status,200);assert.equal(page.headers.get('Referrer-Policy'),'same-origin');assert.ok(page.headers.get('Content-Security-Policy').includes("form-action 'self';"));
  const post=origin=>h.store.fetch(new Request('https://hey.test'+path,{method:'POST',headers:{Origin:origin},body:new URLSearchParams({password:'test-owner-password-123'})}));
  assert.equal((await post('null')).status,403);assert.equal((await post('https://foreign.test')).status,403);assert.equal(await h.store.get('owner'),undefined);
  assert.equal((await post('https://hey.test')).status,200);assert.ok(await h.store.get('owner'));assert.equal((await post('https://hey.test')).status,409);
});
test('MCP discovery advertises schemas without starting any browser',async()=>{
  const h=await harness();const r=await request(h,'/mcp',{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18'}});assert.equal((await r.json()).result.serverInfo.name,'Hey by Ars');
  const list=await (await request(h,'/mcp',{jsonrpc:'2.0',id:2,method:'tools/list'})).json();assert.equal(list.result.tools.length,10);assert.equal(h.storage.data.size,0);
});
test('pairing is single-use even for concurrent requests',async()=>{
  const h=await harness(),p=await h.store.createPair('Phone','https://hey.test'),code=new URL(p.pairingLink).searchParams.get('code');const rs=await Promise.all([request(h,'/api/enroll',{code},null),request(h,'/api/enroll',{code},null)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,403]);assert.equal((await h.store.list('device:')).size,1);
});
test('offline command is retained and explicitly reports missing push configuration',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'navigate',payload:{url:'https://example.com'}},'https://hey.test');assert.equal(t.status,'WAITING_DEVICE');assert.equal(t.reason,'PUSH_CONFIGURATION_REQUIRED');
  const received=await poll(h,d);assert.equal(received.data.command.taskId,t.taskId);assert.equal(received.data.command.payload.url,'https://example.com/');
});
test('action retry returns original receipt and conflicting payload never dispatches',async()=>{
  const h=await harness(),d=await pair(h);await poll(h,d);const a=action(),first=await h.store.enqueue(d.deviceId,a,{method:'navigate',payload:{url:'https://example.com'}},'https://hey.test');const second=await h.store.enqueue(d.deviceId,a,{method:'navigate',payload:{url:'https://example.com'}},'https://hey.test');assert.equal(second.taskId,first.taskId);await assert.rejects(()=>h.store.enqueue(d.deviceId,a,{method:'navigate',payload:{url:'https://different.example'}},'https://hey.test'),/ACTION_CONFLICT/);
  const dispatched=await poll(h,d);assert.ok(dispatched.data.command);const again=await poll(h,d,{activeTaskId:first.taskId});assert.equal(again.data.command,null);
});
test('process replacement marks in-flight action unknown and does not replay',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'action',payload:{action:'back'}},'https://hey.test');await poll(h,d);const r=await poll(h,d,{session:'replacement'});assert.equal(r.data.command,null);assert.equal((await h.store.get('task:'+t.taskId)).status,'UNKNOWN');
});
test('expired execution lease is reconciled by alarm',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test');await poll(h,d);const saved=await h.store.get('task:'+t.taskId);saved.leaseUntil=Date.now()-1;await h.store.put('task:'+t.taskId,saved);await h.store.alarm();assert.equal((await h.store.get('task:'+t.taskId)).status,'UNKNOWN');
});
test('a different device and stale generation cannot submit results',async()=>{
  const h=await harness(),d=await pair(h),other=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test'),p=(await poll(h,d)).data.command;
  const b={taskId:t.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{}};assert.equal((await request(h,'/api/device/result',b,other.deviceToken)).status,404);assert.equal((await request(h,'/api/device/result',{...b,generation:999},d.deviceToken)).status,409);
});
test('chunked evidence is encrypted, ordered, and returned as actual MCP media blocks',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test'),p=(await poll(h,d)).data.command;
  const observation={observedAt:Date.now(),text:'observed page',image:{mimeType:'image/jpeg',data:'A'.repeat(140000)}};
  const envelope={taskId:t.taskId,generation:p.generation,digest:p.digest,sequence:0,observation};assert.equal((await request(h,'/api/device/evidence',envelope,d.deviceToken)).status,200);assert.equal((await request(h,'/api/device/evidence',envelope,d.deviceToken)).status,200);
  assert.equal((await request(h,'/api/device/evidence',{...envelope,sequence:2},d.deviceToken)).status,409);const result=await h.store.taskRead(t.taskId,0);assert.equal(result.content[1].type,'image');assert.equal(result.content[1].data.length,140000);assert.ok(!JSON.stringify([...h.storage.data]).includes('observed page'));
});
test('watch cannot claim audiovisual completion with missing evidence/audio coverage',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'watch',payload:{maxSeconds:60,audioRequired:true}},'https://hey.test'),p=(await poll(h,d)).data.command;
  const b={taskId:t.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{playbackEnded:true,coverageComplete:true,audioCoverageComplete:false}};assert.equal((await request(h,'/api/device/result',b,d.deviceToken)).status,400);
});
test('completed result receipt can be retried after a lost acknowledgement, but cannot change',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test'),p=(await poll(h,d)).data.command;
  const result={taskId:t.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{observed:true},reason:null};
  assert.equal((await request(h,'/api/device/result',result,d.deviceToken)).status,200);
  assert.equal((await (await request(h,'/api/device/result',result,d.deviceToken)).json()).duplicate,true);
  assert.equal((await request(h,'/api/device/result',{...result,verified:false},d.deviceToken)).status,409);
  assert.equal((await poll(h,d)).data.command,null);
});
async function watchEvidence(h,d,p,seq,time,ended,at,withAudio=true){
  const observation={observedAt:at,media:[{currentTime:time,ended}],image:{mimeType:'image/jpeg',data:'AAAA'}};
  if(withAudio){observation.audio={mimeType:'audio/wav',data:'AAAA'};observation.audioMetadata={signal:'PRESENT',gap:false};}
  return request(h,'/api/device/evidence',{taskId:p.taskId,generation:p.generation,digest:p.digest,sequence:seq,observation},d.deviceToken);
}
test('watch coverage requires ordered frames and actual audio for the entire sampled interval',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'watch',payload:{maxSeconds:60,audioRequired:true}},'https://hey.test'),p=(await poll(h,d)).data.command,at=Date.now();
  assert.equal((await watchEvidence(h,d,p,0,0,false,at)).status,200);
  assert.equal((await watchEvidence(h,d,p,1,1,true,at+1000)).status,200);
  const b={taskId:t.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{playbackEnded:true,coverageComplete:true,audioCoverageComplete:true,understandingVerified:false}};
  assert.equal((await request(h,'/api/device/result',b,d.deviceToken)).status,200);
  assert.equal((await h.store.get('task:'+t.taskId)).result.understandingVerified,false);
});
test('a seek jump prevents coverage verification despite a device success flag',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'watch',payload:{maxSeconds:60,audioRequired:false}},'https://hey.test'),p=(await poll(h,d)).data.command,at=Date.now();
  await watchEvidence(h,d,p,0,0,false,at,false);await watchEvidence(h,d,p,1,30,true,at+1000,false);
  const b={taskId:t.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{playbackEnded:true,coverageComplete:true}};
  assert.equal((await request(h,'/api/device/result',b,d.deviceToken)).status,400);
});
test('queued cancellation never dispatches',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'navigate',payload:{url:'https://example.com'}},'https://hey.test');assert.equal((await h.store.cancel(t.taskId)).status,'CANCELLED');assert.equal((await poll(h,d)).data.command,null);
});
test('revocation blocks device and wrong-origin MCP is denied',async()=>{
  const h=await harness(),d=await pair(h);assert.equal((await request(h,'/api/device/revoke',{deviceId:d.deviceId})).status,200);assert.equal((await poll(h,d)).status,401);assert.equal((await request(h,'/mcp',{jsonrpc:'2.0',id:1,method:'tools/list'},h.control,'POST','https://evil.test')).status,403);
});
test('OAuth enforces owner login, origin, resource, PKCE, code replay, and refresh rotation',async()=>{
  const h=await harness(),salt=to64(crypto.getRandomValues(new Uint8Array(16)));await h.store.put('owner',{salt,hash:await passwordHash('owner-password-123',salt)});
  const registration=await (await request(h,'/oauth/register',{redirect_uris:['https://client.test/callback']},null)).json();const verifier=token(),challenge=to64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const params=new URLSearchParams({client_id:registration.client_id,redirect_uri:'https://client.test/callback',response_type:'code',code_challenge_method:'S256',code_challenge:challenge,resource:'https://hey.test/mcp',state:'state'});
  const login=await request(h,'/oauth/authorize?'+params,null,null,'GET');assert.equal(login.status,200);assert.ok(login.headers.get('Content-Security-Policy').includes("form-action 'self' https://client.test;"));assert.equal(login.headers.get('Referrer-Policy'),'same-origin');
  const wrongRedirect=new URLSearchParams(params);wrongRedirect.set('redirect_uri','https://foreign.test/callback');assert.equal((await request(h,'/oauth/authorize?'+wrongRedirect,null,null,'GET')).status,400);
  const text=await login.text(),pending=text.match(/name="pending" value="([^"]+)"/)[1],csrf=text.match(/name="csrf" value="([^"]+)"/)[1];
  const form=new URLSearchParams({pending,csrf,password:'owner-password-123'});const granted=await h.store.fetch(new Request('https://hey.test/oauth/authorize',{method:'POST',headers:{Origin:'https://hey.test'},body:form}));assert.equal(granted.status,302);const code=new URL(granted.headers.get('Location')).searchParams.get('code');
  const exchange=v=>h.store.fetch(new Request('https://hey.test/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',client_id:registration.client_id,redirect_uri:'https://client.test/callback',code,code_verifier:v,resource:'https://hey.test/mcp'})}));
  assert.equal((await exchange('x'.repeat(43))).status,400);const tokens=await (await exchange(verifier)).json();assert.ok(tokens.access_token);assert.equal((await exchange(verifier)).status,400);
  const refresh=()=>h.store.fetch(new Request('https://hey.test/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',client_id:registration.client_id,refresh_token:tokens.refresh_token,resource:'https://hey.test/mcp'})}));assert.equal((await refresh()).status,200);assert.equal((await refresh()).status,400);
});


test('owner pause rejects intake, closes queued work, and resumes only on explicit intent',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'navigate',payload:{url:'https://example.com'}},'https://hey.test');
  assert.equal((await request(h,'/api/device/intent',{ownerIntent:'PAUSED'},d.deviceToken)).status,200);
  assert.equal((await h.store.get('task:'+t.taskId)).reason,'OWNER_PAUSED');
  await assert.rejects(()=>h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test'),/OWNER_PAUSED/);
  assert.equal((await poll(h,d)).data.command,null);
  assert.equal((await request(h,'/api/device/intent',{ownerIntent:'ACTIVE'},d.deviceToken)).status,200);
  const fresh=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test');assert.equal((await poll(h,d)).data.command.taskId,fresh.taskId);
});
test('pause terminal receipt can reconcile UNKNOWN only as owner cancellation',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'watch',payload:{maxSeconds:8,audioRequired:false}},'https://hey.test'),p=(await poll(h,d)).data.command;
  const saved=await h.store.get('task:'+t.taskId);saved.leaseUntil=Date.now()-1;await h.store.put('task:'+t.taskId,saved);await h.store.alarm();
  const receipt={taskId:t.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{},reason:null};assert.equal((await request(h,'/api/device/result',receipt,d.deviceToken)).status,409);
  await request(h,'/api/device/intent',{ownerIntent:'PAUSED'},d.deviceToken);
  assert.equal((await request(h,'/api/device/result',{...receipt,status:'CANCELLED',verified:false,reason:'OWNER_PAUSED'},d.deviceToken)).status,200);
  assert.equal((await h.store.get('task:'+t.taskId)).status,'CANCELLED');
});
test('offline health is explicitly stale and never advertises an active old browser',async()=>{
  const h=await harness(),d=await pair(h);await poll(h,d,{health:{connection:'ONLINE',browser:'READY',audio:'CAPTURING',taskId:'old',progress:{frames:22}}});
  const saved=await h.store.get('device:'+d.deviceId);saved.lastSeen=Date.now()-21000;await h.store.put('device:'+d.deviceId,saved);
  const state=(await h.store.devices())[0];assert.equal(state.online,false);assert.equal(state.health.stale,true);assert.equal(state.health.browser,'UNKNOWN');assert.equal(state.health.taskId,'');assert.deepEqual(state.health.progress,{});
});
test('unrelated task progress is discarded unless ID and generation both match',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test'),p=(await poll(h,d)).data.command;
  await poll(h,d,{activeTaskId:t.taskId,progressTaskId:'other',progressGeneration:p.generation,progress:{frames:99}});assert.equal((await h.store.get('task:'+t.taskId)).progress,null);
  await poll(h,d,{activeTaskId:t.taskId,progressTaskId:t.taskId,progressGeneration:p.generation,progress:{phase:'observe'}});assert.deepEqual((await h.store.get('task:'+t.taskId)).progress,{phase:'observe'});
});
test('renewal is retry-safe, bounded, and old token is revoked after replacement heartbeat',async()=>{
  const h=await harness(),d=await pair(h),first=await (await request(h,'/api/device/renew',{},d.deviceToken)).json(),retry=await (await request(h,'/api/device/renew',{},d.deviceToken)).json();assert.equal(first.deviceToken,retry.deviceToken);
  assert.ok((await h.store.get('credential:'+await hash(d.deviceToken))).expiresAt<=Date.now()+120000);
  assert.equal((await poll(h,{...d,deviceToken:first.deviceToken})).status,200);assert.equal((await poll(h,d)).status,401);
});
test('action receipts beyond 10000 remain usable without a lifetime dispatch ceiling',async()=>{
  const h=await harness(),d=await pair(h);for(let i=0;i<10010;i++)await h.store.put('action:'+d.deviceId+':history-'+i,{digest:'old',taskId:'old'});
  const a=action(),t=await h.store.enqueue(d.deviceId,a,{method:'observe',payload:{}},'https://hey.test');assert.ok(t.taskId);
  assert.equal((await h.store.enqueue(d.deviceId,a,{method:'observe',payload:{}},'https://hey.test')).taskId,t.taskId);
  assert.equal((await h.store.list('action:')).size,10011);
});
test('cancel overwrites queued push error and remains idempotent while running',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test');assert.equal((await h.store.cancel(t.taskId)).reason,'OWNER_CANCELLED');
  const fresh=await h.store.enqueue(d.deviceId,action(),{method:'observe',payload:{}},'https://hey.test');await poll(h,d);await h.store.cancel(fresh.taskId);assert.equal((await h.store.cancel(fresh.taskId)).status,'CANCEL_REQUESTED');
});
test('canonical host rules and scroll direction contract are consistent',()=>{
  for(const url of ['https://localhost./','https://a.localhost./','https://a.internal./','https://127.1/','https://2130706433/'])assert.throws(()=>publicUrl(url));
  assert.equal(publicUrl('https://example.com./'),'https://example.com/');
  assert.deepEqual(validateCommand({method:'action',payload:{action:'scroll',value:'down'}}).payload,{action:'scroll',x:0,y:600});
  assert.throws(()=>validateCommand({method:'action',payload:{action:'scroll',value:'down',y:99}}),/AMBIGUOUS_SCROLL/);
});
test('canvas fallback cannot certify actual video coverage',async()=>{
  const h=await harness(),d=await pair(h),t=await h.store.enqueue(d.deviceId,action(),{method:'watch',payload:{maxSeconds:8,audioRequired:false}},'https://hey.test'),p=(await poll(h,d)).data.command;
  for(let i=0;i<2;i++)assert.equal((await request(h,'/api/device/evidence',{taskId:p.taskId,generation:p.generation,digest:p.digest,sequence:i,observation:{observedAt:Date.now()+i*1000,media:[{currentTime:i,ended:i===1}],image:{mimeType:'image/jpeg',data:'AAAA'},visualMediaVerified:false,captureMode:'DOCUMENT_CANVAS'}},d.deviceToken)).status,200);
  assert.equal((await request(h,'/api/device/result',{taskId:p.taskId,generation:p.generation,digest:p.digest,status:'DONE',verified:true,result:{coverageComplete:true,playbackEnded:true}},d.deviceToken)).status,400);
});

test('P1 locate allows constrained semantic targets and rejects unsafe or ambiguous schemas',()=>{
  const valid=[
    {by:'role',query:'button',name:'Continue',exact:true},
    {by:'text',query:'Read more'},
    {by:'label',query:'Email'},
    {by:'placeholder',query:'Search'},
    {by:'testId',query:'submit'},
    {by:'css',query:'button.primary'}
  ];
  for(const payload of valid)assert.equal(validateCommand({method:'locate',payload}).method,'locate');
  for(const payload of [
    {by:'xpath',query:'//*'},
    {by:'role',query:''},
    {by:'text',query:'x'.repeat(241)},
    {by:'css',query:'button',name:'Save'},
    {by:'text',query:'Save',exact:'true'},
    {by:'role',query:'button',secret:'stolen'}
  ])assert.throws(()=>validateCommand({method:'locate',payload}));
});
test('P1 semantic lookup uses the same immutable receipt and dispatch isolation as every command',async()=>{
  const h=await harness(),d=await pair(h);await poll(h,d);
  const id=action(),payload={by:'role',query:'button',name:'Submit'};
  const first=await h.store.enqueue(d.deviceId,id,{method:'locate',payload},'https://hey.test');
  const same=await h.store.enqueue(d.deviceId,id,{method:'locate',payload},'https://hey.test');
  assert.equal(first.taskId,same.taskId);
  await assert.rejects(()=>h.store.enqueue(d.deviceId,id,{method:'locate',payload:{...payload,name:'Delete'}},'https://hey.test'),/ACTION_CONFLICT/);
  const dispatch=(await poll(h,d)).data.command;
  assert.equal(dispatch.method,'locate');assert.deepEqual(dispatch.payload,payload);
});
