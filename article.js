(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const inline = (s) => esc(s)
    .replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  const labels = {personal:"个人心记",study_feelings:"学习感受",study_review:"学习复盘",ai:"AI 玩法",creative:"创意工作坊",travel:"生活碎片",contact:"联系我"};
  function renderMarkdown(source) {
    const lines = String(source ?? "").split(/\r?\n/), out = [], headings = [];
    let paragraph = [], list = null, code = null;
    const flush = () => {if(paragraph.length){out.push('<p>'+inline(paragraph.join(' '))+'</p>');paragraph=[]} if(list){out.push('</'+list+'>');list=null}};
    for(const line of lines){
      const t=line.trim();
      if(t.startsWith('```')){flush();if(code!==null){out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');code=null}else code=[];continue}
      if(code!==null){code.push(line);continue}
      if(!t){flush();continue}
      const h=t.match(/^\*\*(.+?)\*\*\s*(.*)$/);
      if(h){flush();const id='section-'+headings.length;headings.push({id,title:h[1]});out.push('<h2 id="'+id+'">'+inline(h[1])+'</h2>');if(h[2])out.push('<p>'+inline(h[2])+'</p>');continue}
      const numbered=t.match(/^\d+\.\s+(.+)$/), bullet=t.match(/^-\s+(.+)$/);
      if(numbered||bullet){const tag=numbered?'ol':'ul';if(list!==tag){flush();out.push('<'+tag+'>');list=tag}out.push('<li>'+inline((numbered||bullet)[1])+'</li>');continue}
      if(list){out.push('</'+list+'>');list=null}
      paragraph.push(t);
    }
    flush();if(code!==null)out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');
    return {html:out.join(''),headings};
  }
  async function init(){
    try{
      const id=new URLSearchParams(location.search).get('id');
      if(!id || !/^[a-z0-9-]+$/.test(id))throw Error('这篇文章的地址不完整。');
      const response=await fetch('content.json',{cache:'no-store'});if(!response.ok)throw Error('内容暂时没加载出来。');
      const data=await response.json(), item=data.items.find(x=>x.id===id&&!x.placeholder);
      if(!item)throw Error('这篇文章暂时找不到。');
      const title=item.title.zh, image=item.image||data.categoryImages[item.category];
      const rawPreview=item.preview||(data.categoryPreviews&&data.categoryPreviews[item.category]);
      const preview=typeof rawPreview==="string"&&rawPreview.startsWith("data:image/jpeg;base64,")&&new RegExp("^[A-Za-z0-9+/=]+$").test(rawPreview.slice(23))?rawPreview:"";
      document.title=title+' · Young 的数字花园';
      $('category').textContent=labels[item.category]??'文章';$('title').textContent=title;
      $('summary').textContent=item.summary.zh;
      $('article-meta').textContent=item.date+' · 约 '+Math.max(1,Math.ceil(item.body.zh.length/450))+' 分钟';
      $('cover').style.backgroundImage='linear-gradient(90deg,rgba(6,12,10,.94),rgba(6,12,10,.46)),url("'+encodeURI(image)+'")'+(preview?',url("'+preview+'")':'');
      $('cover').dataset.category=item.category;
      const rendered=renderMarkdown(item.body.zh);$('body').innerHTML=rendered.html;
      $('outline').innerHTML=rendered.headings.length?rendered.headings.map(h=>'<a href="#'+h.id+'">'+esc(h.title)+'</a>').join(''):'<a href="#body">从头读起</a>';
    }catch(error){$('title').textContent='这篇文章暂时没打开';$('summary').textContent=error.message;$('body').innerHTML='<p>可以先返回首页，再点一次文章。</p>'}
  }
  init();
})();
