import assert from 'node:assert/strict';
import app from '../dist/server/index.js';
import {createWorker} from '../worker/runtime.mjs';
let count=0;
const call=(path,options={})=>app.fetch(new Request('https://young.example'+path,options));
function protectedResponse(response){
 assert.equal(response.headers.get('x-frame-options'),'DENY');
 assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 assert.equal(response.headers.get('referrer-policy'),'no-referrer');count++;
}
for(const path of ['/','/index.html','/lite.html','/posts/garden-origin.html','/favicon.svg','/search-index.json','/feed.xml']){
 const response=await call(path);assert.equal(response.status,200);protectedResponse(response);
}
for(const path of ['/content.json','/scripts/check_site_security.py','/.env','/.git/config','/assets/../content.json','/%2fcontent.json']){
 const response=await call(path);assert.equal(response.status,404);protectedResponse(response);
}
const home=await call('/');assert.equal(home.headers.get('cache-control'),'private, no-store');const etag=home.headers.get('etag');
const cached=await call('/',{headers:{'if-none-match':etag}});assert.equal(cached.status,304);assert.equal(await cached.text(),'');protectedResponse(cached);
const head=await call('/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');protectedResponse(head);
const post=await call('/',{method:'POST',body:'test'});assert.equal(post.status,405);protectedResponse(post);
const redirect=await call('/article.html?id=garden-origin');assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),'/posts/garden-origin.html');protectedResponse(redirect);
for(const id of ['https://evil.example/','//evil.example/','../content.json']){
 const response=await call('/article.html?id='+encodeURIComponent(id));assert.equal(response.status,200);assert.equal(response.headers.get('location'),null);protectedResponse(response);
}
let requests=0;
const probe=createWorker({},['/assets/old.webp'],async(url,options)=>{
 requests++;assert.equal(url,'https://young7788-web.github.io/assets/old.webp');
 assert.equal(options.redirect,'manual');assert.equal(options.headers.authorization,undefined);assert.equal(options.headers.cookie,undefined);assert.equal(options.headers['accept-encoding'],'identity');
 return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/webp'}});
});
const legacy=await probe.fetch(new Request('https://young.example/assets/old.webp',{headers:{authorization:'test-not-a-real-secret',cookie:'test=public-check'}}));assert.equal(legacy.status,200);assert.deepEqual([...new Uint8Array(await legacy.arrayBuffer())],[1,2,3]);protectedResponse(legacy);
const unknown=await probe.fetch(new Request('https://young.example/assets/unlisted.webp'));assert.equal(unknown.status,404);assert.equal(requests,1);protectedResponse(unknown);
const failed=createWorker({},['/assets/old.webp'],async()=>new Response(null,{status:302,headers:{location:'https://evil.example/'}}));const blocked=await failed.fetch(new Request('https://young.example/assets/old.webp'));assert.equal(blocked.status,502);assert.equal(blocked.headers.get('location'),null);protectedResponse(blocked);
console.log(JSON.stringify({header_and_routing_checks:count,authoring_files_exposed:false,open_proxy:false,credentials_forwarded:false}));
