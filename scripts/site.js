(() => {
'use strict';
try{if(localStorage.getItem('young-theme')==='dark')document.body.classList.add('dark')}catch{}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
document.documentElement.classList.add('js');
const progress=$('.progress'),back=$('.back-top');let queued=false;
function track(){const range=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.transform='scaleX('+Math.max(0,Math.min(1,range>0?scrollY/range:0))+')';if(back)back.hidden=scrollY<650;queued=false;}
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(track);}},{passive:true});addEventListener('resize',track,{passive:true});track();
back?.addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
function imageState(img){if(img.complete&&img.currentSrc&&img.naturalWidth===0)img.hidden=true;}
document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement)e.target.hidden=true;},true);$$('img').forEach(imageState);
const cards=$$('.entry-card[data-category]'),searches=$$('input[data-search]');let filter='all',query='',extended=null,indexPromise=null;
function apply(){let count=0;cards.forEach(card=>{const text=(card.dataset.search||'')+' '+(extended?.[card.dataset.id]||'');const show=(filter==='all'||card.dataset.category===filter)&&text.toLocaleLowerCase().includes(query);card.hidden=!show;if(show)count++;});$$('button[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));const empty=$('#empty-state');if(empty)empty.hidden=count>0;}
function loadSearch(){if(!cards.length)return Promise.resolve();if(!indexPromise)indexPromise=fetch('search-index.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{extended=Object.fromEntries(data.map(i=>[i.id,i.text.toLocaleLowerCase()]));apply();}).catch(()=>{});return indexPromise;}
searches.forEach(input=>{input.addEventListener('focus',loadSearch,{once:true});input.addEventListener('input',()=>{query=input.value.trim().toLocaleLowerCase();searches.forEach(other=>{if(other!==input)other.value=input.value;});apply();if(query)loadSearch();});input.addEventListener('keydown',e=>{if(e.key==='Enter')$('#collection')?.scrollIntoView();});});
$$('[data-filter]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.filter;apply();}));
const toc=$('.toc');if(toc&&matchMedia('(max-width:850px)').matches)toc.open=false;
toc?.addEventListener('click',e=>{if(e.target.closest('a')&&matchMedia('(max-width:850px)').matches)toc.open=false;});
$$('.copy-code').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent);button.textContent='已复制';}catch{button.textContent='请长按代码复制';}setTimeout(()=>button.textContent='复制',1800);}));
if(toc&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;$$('.toc a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{rootMargin:'-5% 0px -65% 0px'});$$('.story h2').forEach(h=>observer.observe(h));}
})();

