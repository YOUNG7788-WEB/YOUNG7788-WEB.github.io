import assert from 'node:assert/strict';
import {createWorker} from '../worker/runtime.mjs';
const policy="default-src 'none'; script-src 'none'; frame-ancestors 'none'";
const assets={
 '/index.html':{body:'<p>Public fixture</p>',type:'text/html; charset=utf-8',digest:'fixture-home',encoding:'utf8',policy},
 '/404.html':{body:'Not found',type:'text/html; charset=utf-8',digest:'fixture-404',encoding:'utf8',policy},
 '/posts/note.html':{body:'Note',type:'text/html; charset=utf-8',digest:'fixture-note',encoding:'utf8',policy},
 '/assets/sample.webp':{body:'AQID',type:'image/webp',digest:'fixture-image',encoding:'base64'},
};
let originCalls=0;
const origin=async(url,opts)=>{
 originCalls++;assert.equal(url,'https://young7788-web.github.io/assets/legacy.webp');
 assert.deepEqual(Object.keys(opts.headers).sort(),['accept','accept-encoding']);
 assert.equal(opts.redirect,'manual');
 return new Response(new Uint8Array([4,5,6]),{headers:{'content-type':'image/webp'}});
};
const app=createWorker(assets,['/assets/legacy.webp'],origin);
const call=(path,init={})=>app.fetch(new Request('https://fixture.example'+path,init));
let n=0;
for(const [path,status] of [['/',200],['/assets/sample.webp',200],['/404.html',200],['/content.json',404],['/.env',404],['/scripts/index.js',404],['/%2e%2e%2fcontent.json',404]]){
 const r=await call(path);assert.equal(r.status,status);assert.equal(r.headers.get('x-frame-options'),'DENY');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');n++;
}
assert.equal((await call('/')).headers.get('cache-control'),'private, no-store');n++;
const publicApp=createWorker(assets,[],origin,{privateAudience:false});assert.equal((await publicApp.fetch(new Request('https://fixture.example/'))).headers.get('cache-control'),'public, max-age=300');n++;
const redirected=await call('/article.html?id=note');assert.equal(redirected.status,302);assert.equal(redirected.headers.get('location'),'/posts/note.html');n++;
assert.equal((await call('/article.html?id=https://external.example')).status,404);n++;
const post=await call('/',{method:'POST',body:'fixture'});assert.equal(post.status,405);assert.equal(post.headers.get('allow'),'GET, HEAD');n++;
const head=await call('/',{method:'HEAD'});assert.equal(await head.text(),'');n++;
const cached=await call('/',{headers:{'if-none-match':'"fixture-home"'}});assert.equal(cached.status,304);assert.equal(await cached.text(),'');n++;
const image=await call('/assets/sample.webp');assert.deepEqual([...new Uint8Array(await image.arrayBuffer())],[1,2,3]);n++;
const old=await call('/assets/legacy.webp',{headers:{authorization:'fixture-not-a-secret',cookie:'fixture=1'}});assert.equal(old.status,200);assert.equal(originCalls,1);n++;
await call('/assets/unknown.webp');assert.equal(originCalls,1);n++;
const maliciousOrigin=createWorker(assets,['/assets/legacy.webp'],async()=>new Response(null,{status:302,headers:{location:'https://external.example'}}));assert.equal((await maliciousOrigin.fetch(new Request('https://fixture.example/assets/legacy.webp'))).status,502);n++;
console.log(JSON.stringify({server_security_regressions:n}));
