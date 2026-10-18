(() => {
"use strict";
const $ = (id) => document.getElementById(id);
let categories = [
  {id:"personal", zh:"个人心记", en:"Personal Notes", icon:"✎", pos:"0%"},
  {id:"ai", zh:"AI玩法分享", en:"AI Playbook", icon:"✦", pos:"16.667%"},
  {id:"contact", zh:"联系方式", en:"Contact", icon:"✉", pos:"33.333%"},
  {id:"creative", zh:"创意工作坊", en:"Creative Studio", icon:"◇", pos:"50%"},
  {id:"study_feelings", zh:"学习感受", en:"Study Reflections", icon:"☼", pos:"66.667%"},
  {id:"study_review", zh:"学习复盘", en:"Study Review", icon:"▣", pos:"83.333%"},
  {id:"travel", zh:"生活游记碎片分享", en:"Travel & Life", icon:"⌖", pos:"100%"}
];
const copy = {
  zh:{navHome:"首页",navNotes:"内容",navProjects:"AI玩法",navLife:"创意工坊",navAbout:"联系",explore:"探索我的花园",aboutMe:"关于我",profileRole:"电气工程 · 探索中",growing:"● 持续生长中",statNotes:"内容",statProjects:"作品",statIdeas:"想法",updates:"最新动态",viewAll:"查看全部 →",labTitle:"互动实验室",ohmTab:"欧姆定律",moreSoon:"更多实验陆续生长",voltage:"电压 U",resistance:"电阻 R",current:"电流 I = U / R",labNote:"拖动滑块，观察电压和电阻怎样影响电流。",featured:"创意工作坊",gardenIndex:"GARDEN INDEX",browse:"逛逛花园",browseDesc:"七个栏目，记录想法、学习、创作与生活。",edit:"编辑内容与排版",aboutTitle:"关于这座数字花园",contact:"联系方式待补充",footer:"在工程与好奇心之间，持续生长。",backTop:"返回顶部 ↑",labShort:"实验",editorTitle:"编辑花园",editorHint:"修改后先保存预览，再导出 JSON 用于公开发布。",editorGeneral:"首页与排版",editorItems:"内容条目",editorTransfer:"导入导出",all:"全部",empty:"没有找到匹配内容。试试其他关键词或分类。",read:"阅读全文 →",sample:"示例",pending:"待补充",noUpdates:"还没有发布内容，先逛逛下面的七个栏目。"},
  en:{navHome:"Home",navNotes:"Content",navProjects:"AI Play",navLife:"Creative",navAbout:"Contact",explore:"Explore the garden",aboutMe:"About me",profileRole:"Electrical Engineering",growing:"● Always growing",statNotes:"Posts",statProjects:"Works",statIdeas:"Ideas",updates:"Latest Updates",viewAll:"View all →",labTitle:"Interactive Lab",ohmTab:"Ohm's Law",moreSoon:"More experiments soon",voltage:"Voltage U",resistance:"Resistance R",current:"Current I = U / R",labNote:"Move the sliders to see how voltage and resistance affect current.",featured:"Creative Studio",gardenIndex:"GARDEN INDEX",browse:"Explore the Garden",browseDesc:"Seven paths through ideas, learning, making and life.",edit:"Edit content & layout",aboutTitle:"About this digital garden",contact:"Contact details coming soon",footer:"Growing between engineering and curiosity.",backTop:"Back to top ↑",labShort:"Lab",editorTitle:"Edit the garden",editorHint:"Save a local preview, then export JSON for publication.",editorGeneral:"Home & layout",editorItems:"Entries",editorTransfer:"Import & export",all:"All",empty:"No matches. Try another word or category.",read:"Read more →",sample:"Sample",pending:"Coming soon",noUpdates:"No posts yet. Explore the seven sections below."}
};
let data = null;
let lang = safeStorageGet("ydg-lang") === "en" ? "en" : "zh";
let filter = "all";
let query = "";
let activeId = null;
function safeStorageGet(key){ try{return localStorage.getItem(key)}catch{return null} }
function safeStorageSet(key,value){ try{localStorage.setItem(key,value);return true}catch{status("Browser storage is unavailable. Please export your JSON.");return false} }
function status(message){$("editor-status").textContent=message}
function esc(value){return String(value == null ? "" : value).replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function label(value){return typeof value==="object" && value ? (value[lang] || value.zh || value.en || "") : ""}
function cat(id){return categories.find((c)=>c.id===id) || categories[0]}
/* YDG_FULL_V2 */
function safeImage(value){
 if(typeof value!=="string")return "";
 if(/^https:\/\/[^"'<> ]+$/i.test(value))return value;
 if(/^assets\/[a-zA-Z0-9_./-]+\.(?:png|jpg|jpeg|webp|avif)$/i.test(value) && !value.includes(".."))return value;
 return "";
}
function valid(value){return !!value && value.version===1 && value.site && value.site.lead && value.site.description && value.site.about && value.layout && Array.isArray(value.items) && value.items.every((item)=>item && typeof item.id==="string" && categories.some((c)=>c.id===item.category) && item.title && item.summary && item.body)}
function saveLocal(){safeStorageSet("ydg-content-v1",JSON.stringify(data))}
function applyTranslation(){
 document.documentElement.lang=lang==="zh"?"zh-CN":"en";
 document.querySelectorAll("[data-i18n]").forEach((el)=>{const key=el.dataset.i18n;if(copy[lang][key])el.textContent=copy[lang][key]});
 $("lang-zh").classList.toggle("selected",lang==="zh"); $("lang-en").classList.toggle("selected",lang==="en");
 $("lang-zh").setAttribute("aria-pressed",lang==="zh"); $("lang-en").setAttribute("aria-pressed",lang==="en");
 $("top-search").placeholder=lang==="zh"?"搜索笔记、项目或关键词…":"Search notes, projects or keywords…";
 $("collection-search").placeholder=lang==="zh"?"搜索标题或正文…":"Search titles or text…";
}
function cardImageStyle(item){
 const image=safeImage(item.image)||safeImage(data.categoryImages&&data.categoryImages[item.category]);
 return image?'background-image:url(&quot;'+esc(image)+'&quot;);background-size:cover;background-position:center':'';
}
function renderCategories(){
 $("explore").innerHTML=categories.map((c)=>'<a class="category-card" style="--pos:'+c.pos+';background-image:linear-gradient(180deg,rgba(8,27,40,.6),rgba(8,27,40,.05) 55%,rgba(8,27,40,.44)),url(&quot;'+esc(safeImage(data.categoryImages&&data.categoryImages[c.id]))+'&quot;);background-size:cover;background-position:center" href="#collection" data-category="'+c.id+'"><span class="category-content"><span class="category-icon">'+c.icon+'</span><span><strong>'+esc(c[lang])+'</strong><small>'+esc(c.en)+'</small></span><span class="category-arrow">→</span></span></a>').join("");
 $("filter-buttons").innerHTML='<button type="button" data-filter="all" class="'+(filter==="all"?"selected":"")+'">'+copy[lang].all+'</button>'+categories.map((c)=>'<button type="button" data-filter="'+c.id+'" class="'+(filter===c.id?"selected":"")+'">'+esc(c[lang])+'</button>').join("");
 document.querySelectorAll("[data-category]").forEach((el)=>el.addEventListener("click",()=>setFilter(el.dataset.category)));
 document.querySelectorAll("[data-filter]").forEach((el)=>el.addEventListener("click",()=>setFilter(el.dataset.filter)));
}
function renderLatest(){
 const recent=data.items.filter((item)=>!item.placeholder).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,3);
 $("latest-list").innerHTML=recent.length?recent.map((item)=>'<button class="update-row" type="button" data-open="'+esc(item.id)+'"><span class="thumb" style="'+cardImageStyle(item)+'"></span><span class="update-info"><strong>'+esc(label(item.title))+'</strong><small>'+esc(item.date||"")+'</small></span><span class="tag">'+esc(cat(item.category)[lang])+'</span></button>').join(""):'<p class="panel-empty">'+copy[lang].noUpdates+'</p>';
 $("stat-notes").textContent=data.items.filter((item)=>!item.placeholder).length;
 $("stat-projects").textContent=data.items.filter((item)=>item.featured&&!item.placeholder).length;
}
function renderFeatured(){
 const item=data.items.find((entry)=>entry.featured&&!entry.placeholder) || data.items.find((entry)=>entry.category==="creative");
 $("featured-card").innerHTML=item?'<div class="featured-image" style="'+cardImageStyle(item)+'"></div><div><p class="featured-title">'+esc(label(item.title))+'</p><p class="featured-summary">'+esc(label(item.summary))+'</p><button class="text-link link-button" type="button" data-open="'+esc(item.id)+'">'+(item.placeholder?copy[lang].pending:copy[lang].read)+'</button></div>':"";
}
function renderGrid(){
 const matched=data.items.filter((item)=>{
  if(filter!=="all" && item.category!==filter)return false;
  const text=[item.title.zh,item.title.en,item.summary.zh,item.summary.en,item.body.zh,item.body.en].join(" ").toLocaleLowerCase();
  return text.includes(query.toLocaleLowerCase());
 });
 $("content-grid").style.setProperty("--columns",String([1,2,3].includes(Number(data.layout.columns))?data.layout.columns:3));
 $("content-grid").innerHTML=matched.map((item)=>'<button class="entry-card" type="button" data-open="'+esc(item.id)+'"><div class="entry-image" style="'+cardImageStyle(item)+'"></div><div class="entry-details"><div class="entry-meta"><span>'+esc(cat(item.category)[lang])+'</span><span>'+esc(item.date||"")+'</span></div><h3>'+esc(label(item.title))+'</h3><p>'+esc(label(item.summary))+'</p><span class="entry-more">'+(item.placeholder?copy[lang].pending:copy[lang].read)+'</span></div></button>').join("");
 $("empty-state").hidden=matched.length>0;
 $("empty-state").textContent=copy[lang].empty;
}

function syncCategories(){
 if(!Array.isArray(data.categories))return;
 const defaults=Object.fromEntries(categories.map(c=>[c.id,c]));
 const updated=data.categories.filter(c=>c&&defaults[c.id]).sort((a,b)=>(a.order??0)-(b.order??0)).map(c=>({...defaults[c.id],zh:String(c.zh||defaults[c.id].zh),en:String(c.en||defaults[c.id].en),icon:defaults[c.id].icon}));
 if(updated.length===7)categories=updated;
}
function render(){
 syncCategories();
 applyTranslation();
 $("hero-lead").textContent=label(data.site.lead);
 $("hero-description").textContent=label(data.site.description);
 $("about-text").textContent=label(data.site.about);
 renderCategories(); renderLatest(); renderFeatured(); renderGrid();
}
function setFilter(value){filter=categories.some((c)=>c.id===value)?value:"all";renderCategories();renderGrid()}

function gardenMarkdown(source){
 const out=[];let list=false,code=false;
 const inline=(s)=>esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,caption,url)=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+caption+'</a>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\x60([^\x60]+)\x60/g,'<code>$1</code>');
 for(const raw of String(source||'').split(/\r?\n/)){
  if(raw.trim().startsWith('\x60\x60\x60')){if(list){out.push('</ul>');list=false}code=!code;out.push(code?'<pre><code>':'</code></pre>');continue}
  if(code){out.push(esc(raw)+'\n');continue}
  if(/^\s*[-*] /.test(raw)){if(!list){out.push('<ul>');list=true}out.push('<li>'+inline(raw.replace(/^\s*[-*] /,''))+'</li>');continue}
  if(list){out.push('</ul>');list=false}
  if(/^### /.test(raw))out.push('<h3>'+inline(raw.slice(4))+'</h3>');
  else if(/^##? /.test(raw))out.push('<h2>'+inline(raw.replace(/^##? /,''))+'</h2>');
  else if(/^> /.test(raw))out.push('<blockquote>'+inline(raw.slice(2))+'</blockquote>');
  else if(raw.trim())out.push('<p>'+inline(raw)+'</p>');
 }
 if(list)out.push('</ul>');if(code)out.push('</code></pre>');return out.join('');
}
function openArticle(id){
 const item=data.items.find((entry)=>entry.id===id); if(!item)return;
 $("article-content").innerHTML='<div class="article-cover" style="'+cardImageStyle(item)+'"></div><p class="kicker">'+esc(cat(item.category)[lang])+' · '+esc(item.date||"")+'</p><h2>'+esc(label(item.title))+'</h2><div class="article-body">'+gardenMarkdown(label(item.body))+'</div>';
 $("article-dialog").showModal();
}
function updateOhm(){
 const u=Number($("voltage").value),r=Number($("resistance").value),i=u/r;
 $("voltage-output").textContent=u+" V";$("resistance-output").textContent=r+" Ω";
 $("current-output").textContent=i.toFixed(2)+" A";$("power-output").textContent="P = "+(u*i).toFixed(2)+" W";
}
function setTheme(dark){
 document.body.classList.toggle("dark",dark);
 $("theme-toggle").textContent=dark?"☾":"☼";
 safeStorageSet("ydg-theme",dark?"dark":"light");
}
function populateGeneral(){
 $("edit-lead-zh").value=data.site.lead.zh||"";$("edit-lead-en").value=data.site.lead.en||"";
 $("edit-desc-zh").value=data.site.description.zh||"";$("edit-desc-en").value=data.site.description.en||"";
 $("edit-about-zh").value=data.site.about.zh||"";$("edit-about-en").value=data.site.about.en||"";
 $("edit-columns").value=String(data.layout.columns||3);
}
function showEditorPanel(id){
 document.querySelectorAll(".editor-tabs button").forEach((button)=>button.classList.toggle("selected",button.dataset.panel===id));
 document.querySelectorAll(".editor-panel").forEach((panel)=>panel.hidden=panel.id!==id);
}
function itemList(){
 $("editor-item-list").innerHTML=data.items.map((item,i)=>'<div class="editor-item-row"><button type="button" data-select="'+esc(item.id)+'">'+esc(item.title.zh||item.id)+'</button><button type="button" data-move="'+esc(item.id)+'" data-step="-1" aria-label="上移">↑</button><button type="button" data-move="'+esc(item.id)+'" data-step="1" aria-label="下移">↓</button></div>').join("");
}
function clearItemForm(){
 activeId=null;$("item-id").value="";
 ["item-title-zh","item-title-en","item-summary-zh","item-summary-en","item-body-zh","item-body-en","item-image"].forEach((id)=>$(id).value="");
 $("item-category").value="personal";$("item-date").value=new Date().toISOString().slice(0,10);$("item-featured").checked=false;
}
function selectItem(id){
 const item=data.items.find((entry)=>entry.id===id);if(!item)return;
 activeId=id;$("item-id").value=id;$("item-category").value=item.category;$("item-date").value=item.date||"";
 $("item-title-zh").value=item.title.zh||"";$("item-title-en").value=item.title.en||"";
 $("item-summary-zh").value=item.summary.zh||"";$("item-summary-en").value=item.summary.en||"";
 $("item-body-zh").value=item.body.zh||"";$("item-body-en").value=item.body.en||"";
 $("item-image").value=item.image||"";$("item-featured").checked=!!item.featured;
}
function bind(){
 document.addEventListener("click",(event)=>{
  const opener=event.target.closest("[data-open]"); if(opener){openArticle(opener.dataset.open);return}
  const selector=event.target.closest("[data-select]");if(selector){selectItem(selector.dataset.select);return}
  const mover=event.target.closest("[data-move]");if(mover){
   const from=data.items.findIndex((item)=>item.id===mover.dataset.move),to=from+Number(mover.dataset.step);
   if(from>=0 && to>=0 && to<data.items.length){const moved=data.items.splice(from,1)[0];data.items.splice(to,0,moved);saveLocal();render();itemList();status("顺序已保存到本机。")}return
  }
 });
 $("lang-zh").addEventListener("click",()=>{lang="zh";safeStorageSet("ydg-lang",lang);render()});
 $("lang-en").addEventListener("click",()=>{lang="en";safeStorageSet("ydg-lang",lang);render()});
 $("theme-toggle").addEventListener("click",()=>setTheme(!document.body.classList.contains("dark")));
 $("menu-toggle").addEventListener("click",()=>{const open=$("menu-toggle").getAttribute("aria-expanded")!=="true";$("menu-toggle").setAttribute("aria-expanded",String(open));document.querySelector(".main-nav").classList.toggle("open",open)});
 document.querySelectorAll(".main-nav a").forEach((a)=>a.addEventListener("click",()=>{document.querySelector(".main-nav").classList.remove("open");$("menu-toggle").setAttribute("aria-expanded","false")}));
 document.querySelectorAll("[data-nav-filter]").forEach((el)=>el.addEventListener("click",()=>setFilter(el.dataset.navFilter)));
 ["top-search","collection-search"].forEach((id)=>$(id).addEventListener("input",(event)=>{query=event.target.value;const other=id==="top-search"?"collection-search":"top-search";$(other).value=query;renderGrid()}));
 $("top-search").addEventListener("keydown",(event)=>{if(event.key==="Enter")$("collection").scrollIntoView()});
 ["voltage","resistance"].forEach((id)=>$(id).addEventListener("input",updateOhm));
 $("article-close").addEventListener("click",()=>$("article-dialog").close());
 $("edit-open").addEventListener("click",()=>{populateGeneral();itemList();clearItemForm();showEditorPanel("editor-general");status(safeStorageGet("ydg-legacy-content-v1")?"旧版浏览器内容已保留备份，可到导入导出下载。":"");$("editor-dialog").showModal()});
 $("editor-close").addEventListener("click",()=>$("editor-dialog").close());
 document.querySelectorAll(".editor-tabs button").forEach((button)=>button.addEventListener("click",()=>showEditorPanel(button.dataset.panel)));
 $("save-general").addEventListener("click",()=>{
  data.site.lead={zh:$("edit-lead-zh").value.trim(),en:$("edit-lead-en").value.trim()};
  data.site.description={zh:$("edit-desc-zh").value.trim(),en:$("edit-desc-en").value.trim()};
  data.site.about={zh:$("edit-about-zh").value.trim(),en:$("edit-about-en").value.trim()};
  data.layout.columns=Number($("edit-columns").value);saveLocal();render();status("已保存到当前浏览器。导出 JSON 后可公开发布。");
 });
 $("item-category").innerHTML=categories.map((c)=>'<option value="'+c.id+'">'+c.zh+' / '+c.en+'</option>').join("");
 $("add-item").addEventListener("click",()=>{clearItemForm();status("填写新条目后保存。")});
 $("save-item").addEventListener("click",()=>{
  const zh=$("item-title-zh").value.trim(),en=$("item-title-en").value.trim();
  if(!zh||!en){status("请填写中英文标题。");return}
  const image=$("item-image").value.trim();
  if(image&&!safeImage(image)){status("图片地址需要以 https:// 开头。");return}
  const item={id:activeId||("entry-"+Date.now()),category:$("item-category").value,date:$("item-date").value,featured:$("item-featured").checked,placeholder:false,image,title:{zh,en},summary:{zh:$("item-summary-zh").value.trim(),en:$("item-summary-en").value.trim()},body:{zh:$("item-body-zh").value.trim(),en:$("item-body-en").value.trim()}};
  const index=data.items.findIndex((entry)=>entry.id===item.id);
  if(index>=0)data.items[index]=item;else data.items.unshift(item);
  activeId=item.id;saveLocal();render();itemList();status("条目已保存到当前浏览器。");
 });
 $("delete-item").addEventListener("click",()=>{if(!activeId)return;if(!confirm("确定删除此条目？"))return;data.items=data.items.filter((item)=>item.id!==activeId);clearItemForm();saveLocal();render();itemList();status("条目已从本机预览删除。")});
 $("export-json").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="content.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status("已导出 content.json。");
 });
 $("export-legacy").addEventListener("click",()=>{const old=safeStorageGet("ydg-legacy-content-v1");if(!old)return;const url=URL.createObjectURL(new Blob([old],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="youngs-garden-previous-browser-content.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status("旧版浏览器内容已下载。")});
 $("import-json").addEventListener("change",async(event)=>{
  const file=event.target.files[0];if(!file)return;
  try{const imported=JSON.parse(await file.text());if(!valid(imported))throw new Error("文件结构不正确");data=imported;saveLocal();populateGeneral();itemList();clearItemForm();render();status("导入成功，当前浏览器已更新。")}catch(error){status("导入失败："+error.message)}finally{event.target.value=""}
 });
 $("reset-local").addEventListener("click",()=>{if(!confirm("清除本机预览并恢复公开版本？"))return;try{localStorage.removeItem("ydg-content-v1")}catch{};location.reload()});
}
async function init(){
 try{
  const response=await fetch("content.json",{cache:"no-store"});if(!response.ok)throw new Error("HTTP "+response.status);
  const source=await response.json();if(!valid(source))throw new Error("content.json 结构不正确");
  data=source;
  const local=null;
  if(local){try{const saved=JSON.parse(local);if(valid(saved))data=saved;else if(!safeStorageGet("ydg-legacy-content-v1"))safeStorageSet("ydg-legacy-content-v1",local)}catch{if(!safeStorageGet("ydg-legacy-content-v1"))safeStorageSet("ydg-legacy-content-v1",local)}}
  $("export-legacy").hidden=!safeStorageGet("ydg-legacy-content-v1");
  bind();setTheme(safeStorageGet("ydg-theme")==="dark");updateOhm();render();
 }catch(error){
  document.body.innerHTML='<main style="font:16px/1.7 system-ui;max-width:650px;margin:12vh auto;padding:24px"><h1>网站未能加载</h1><p>'+esc(error.message)+'</p><p>请通过项目 README 中的 PowerShell 命令启动本地服务；不要直接双击 index.html。</p></main>';
 }
}
init();
})();
