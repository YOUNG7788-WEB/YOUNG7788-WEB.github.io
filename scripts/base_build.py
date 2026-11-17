"""Generate notebook articles, text index, legacy links, and cover assets.

The homepage has one renderer: editorial_home.render in build_site.py.
"""
from pathlib import Path
from html import escape
from io import BytesIO
import argparse, base64, hashlib, json, re
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--data', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--source-root', default='.')
parser.add_argument('--manifest')
parser.add_argument('--css', default=str(Path(__file__).with_name('site.css')))
parser.add_argument('--js', default=str(Path(__file__).with_name('site.js')))
parser.add_argument('--baseline', type=int, default=0)
args=parser.parse_args()
data=json.loads(Path(args.data).read_text(encoding='utf-8'))
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
source=Path(args.source_root)
manifest=json.loads(Path(args.manifest).read_text(encoding='utf-8')) if args.manifest else {}
css=re.sub(r'/\*.*?\*/','',Path(args.css).read_text(encoding='utf-8'),flags=re.S)
css=re.sub(r'\s+',' ',css).strip()
js=Path(args.js).read_text(encoding='utf-8').strip()
items=[i for i in data['items'] if not i.get('placeholder') and i.get('status')=='published']
cats=sorted(data['categories'],key=lambda c:c.get('order',0))
assert all(re.fullmatch(r'[a-z0-9-]+',i['id']) for i in items)
assert all(re.fullmatch(r'[a-z0-9_]+',c['id']) for c in cats)
labels={c['id']:c['zh'] for c in cats}
root='https://young7788-web.github.io/'
email='1809039935@qq.com'
files=[];covers={}

def write(path,text):
    dest=out/path;dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(text,encoding='utf-8');files.append(path)

def cover(scope,ident,original):
    group='categories' if scope=='category' else 'articles'
    path=Path(manifest.get(group,{}).get(ident,source/original))
    image=Image.open(path).convert('RGB')
    thumb=image.copy();thumb.thumbnail((480,320),Image.Resampling.LANCZOS)
    stream=BytesIO();thumb.save(stream,'WEBP',quality=77,method=6)
    raw=stream.getvalue();digest=hashlib.sha256(raw).hexdigest()[:10]
    name=f'assets/thumbs/{scope}-{ident}-{digest}.webp'
    dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);files.append(name)
    tiny=image.copy();tiny.thumbnail((64,43),Image.Resampling.LANCZOS)
    stream=BytesIO();tiny.save(stream,'JPEG',quality=24,optimize=True)
    placeholder='data:image/jpeg;base64,'+base64.b64encode(stream.getvalue()).decode()
    result={'thumb':'/'+name,'tiny':placeholder,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    covers[scope+'-'+ident]=result
    return result

for c in cats: cover('category',c['id'],data['categoryImages'][c['id']])
for i in items: cover('article',i['id'],i['image'])
assert len(covers)==len({c['sha256'] for c in covers.values()})==len(cats)+len(items)

def inline(text):
    value=escape(text,quote=True)
    value=re.sub(r'\[([^\]]+)\]\((https://[^\s)]+)\)',r'<a href="\2" target="_blank" rel="noopener noreferrer">\1 ↗</a>',value)
    value=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',value)
    return re.sub(r'`([^`]+)`',r'<code>\1</code>',value)

def markdown(text):
    html=[];headings=[];paragraph=[];listing=None;code=None;language=''
    def flush():
        nonlocal listing
        if paragraph: html.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
        if listing: html.append('</'+listing+'>');listing=None
    for raw in text.splitlines():
        line=raw.strip()
        if line.startswith('```'):
            flush()
            if code is None: code=[];language=line[3:]
            else:
                html.append('<pre><code class="language-'+escape(language)+'">'+escape('\n'.join(code))+'</code><button class="copy-code" type="button">复制</button></pre>');code=None
            continue
        if code is not None: code.append(raw);continue
        if not line: flush();continue
        heading=re.match(r'^\*\*(.+?)\*\*\s*(.*)$',line)
        if heading:
            flush();ident='section-'+str(len(headings));headings.append((ident,heading[1]));html.append('<h2 id="'+ident+'">'+inline(heading[1])+'</h2>')
            if heading[2]:html.append('<p>'+inline(heading[2])+'</p>')
            continue
        match=re.match(r'^(?:(\d+)\.\s+|-\s+)(.+)$',line)
        if match:
            tag='ol' if match[1] else 'ul'
            if listing!=tag: flush();listing=tag;html.append('<'+tag+'>')
            html.append('<li>'+inline(match[2])+'</li>');continue
        if listing:html.append('</'+listing+'>');listing=None
        paragraph.append(line)
    flush()
    if code is not None:html.append('<pre><code>'+escape('\n'.join(code))+'</code></pre>')
    return ''.join(html),headings

def head(title,description,path,image=''):
    meta=f'<meta property="og:image" content="{root.rstrip("/")+image}">' if image else ''
    return f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6f4ed"><meta name="description" content="{escape(description)}"><title>{escape(title)}</title><link rel="canonical" href="{root+path}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="Young 的手记" href="https://young7788-web.github.io/feed.xml"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}">{meta}<style>{css}</style></head>'

def header():
    nav='<a href="/index.html#writing">所有手记</a><a href="/lite.html">省流阅读</a><a href="mailto:'+email+'">联系我 ↗</a>'
    return '<header class="topbar article-header"><a class="brand" href="/index.html"><b>✳</b> Young 的手记</a><nav class="main-nav" aria-label="主导航">'+nav+'</nav></header>'

def ending():
    return '<div class="shell"><footer><span>✳ Young 的手记</span><a href="mailto:'+email+'">'+email+'</a><a href="#main">返回顶部 ↑</a></footer></div><div class="progress" aria-hidden="true"></div><button class="back-top" type="button" aria-label="回到顶部" hidden>↑</button><script>'+js+'</script></body></html>'

article_sizes={}
for i in items:
    body,toc=markdown(i['body']['zh']);art=covers['article-'+i['id']]
    links=''.join('<a href="#'+ident+'">'+escape(title)+'</a>' for ident,title in toc) or '<a href="#body">从头读起</a>'
    title=i['title']['zh'];path='posts/'+i['id']+'.html'
    html=head(title+' · Young 的手记',i['summary']['zh'],path,art['thumb'])+'<body class="article-page"><a class="skip" href="#body">跳到正文</a><div class="shell">'+header()+'</div><main id="main"><section class="article-cover" style="--preview:url('+art['tiny']+')"><img class="article-art" src="/'+escape(i['image'])+'" width="1200" height="800" alt="" decoding="async" fetchpriority="low"><div class="shell"><div class="article-cover-inner"><a class="back" href="/index.html#writing">← 回到手记</a><p class="article-category">'+escape(labels[i['category']])+'</p><h1>'+escape(title)+'</h1><p class="article-meta">'+escape(i.get('date',''))+' · 约 '+str(max(1,(len(i['body']['zh'])+449)//450))+' 分钟</p><p class="article-deck">'+escape(i['summary']['zh'])+'</p></div></div></section><div class="shell reading-layout"><details class="toc" open><summary>这篇写了什么 ＋</summary><nav aria-label="文章目录">'+links+'</nav></details><article class="story" id="body">'+body+'</article></div><div class="shell article-end"><span>写到这里，先去做点别的。</span><a href="/index.html#writing">继续读手记 →</a></div></main>'+ending()
    write(path,html);article_sizes[i['id']]=len(html.encode())

ids=[i['id'] for i in items]
legacy='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>正在打开文章 · Young 的手记</title><style>body{background:#f6f4ed;color:#29352e;font:16px/1.8 system-ui;max-width:700px;margin:10vh auto;padding:24px}a{color:#3f6c52}</style></head><body><p>正在打开文章…</p><p><a href="/index.html#writing">返回文章目录</a></p><script>const id=new URLSearchParams(location.search).get("id");if('+json.dumps(ids)+'.includes(id))location.replace("/posts/"+id+".html");</script></body></html>'
write('article.html',legacy)
lite_sections=[]
for c in cats:
    links=[]
    for i in items:
        if i['category']!=c['id']:continue
        links.append('<article><h3><a href="/posts/'+i['id']+'.html#body">'+escape(i['title']['zh'])+'</a></h3><p>'+escape(i['summary']['zh'])+'</p><small>'+escape(i.get('date',''))+'</small></article>')
    lite_sections.append('<section id="'+c['id']+'"><h2>'+escape(c['zh'])+'</h2>'+''.join(links)+'</section>')
lite_css=':root{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#29352e;background:#f6f4ed}*{box-sizing:border-box}body{width:min(850px,calc(100% - 38px));margin:35px auto;font-size:16px;line-height:1.8}a{color:#3f6c52;text-underline-offset:4px}header{border-bottom:1px solid #dcded2;padding-bottom:22px}header>a{font-size:13px}h1{font-size:30px;line-height:1.3}header p{color:#6c756c;font-size:14px}nav{display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13px;margin:22px 0}section{padding-top:24px}h2{color:#3f6c52;font-size:23px;border-bottom:1px solid #dcded2;padding-bottom:12px}article{margin:28px 0}h3{font-size:18px;line-height:1.5;margin-bottom:8px}article p{font-size:14px;color:#6c756c;margin:0 0 7px}small{font-size:11px;color:#6c756c}footer{margin:50px 0;padding-top:20px;border-top:1px solid #dcded2;font-size:13px}'
lite='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6f4ed"><title>省流阅读 · Young 的手记</title><meta name="description" content="Young 手记的纯文字文章目录。"><link rel="canonical" href="'+root+'lite.html"><style>'+lite_css+'</style></head><body><header><a href="/index.html">✳ Young 的手记 · 手记首页 ↗</a><h1>省流阅读</h1><p>'+escape(data['site']['lead']['zh'])+'</p><p>这里直接列出全部文章。点开标题就能读正文。</p></header><nav aria-label="栏目">'+''.join('<a href="#'+c['id']+'">'+escape(c['zh'])+'</a>' for c in cats)+'</nav><main>'+''.join(lite_sections)+'</main><footer><a href="mailto:'+email+'">'+email+'</a> · <a href="/index.html">手记首页 ↗</a></footer></body></html>'
write('lite.html',lite)
write('search-index.json',json.dumps([{'id':i['id'],'text':i['title']['zh']+' '+i['summary']['zh']+' '+i['body']['zh']} for i in items],ensure_ascii=False,separators=(',',':')))
budget={'design':'Young field notebook','content_latest_date':max(i.get('date','') for i in items),'articles':len(items),'unique_covers':len(covers),'lite_index_html_bytes':len(lite.encode()),'homepage_blocking_external_files':0,'previous_required_files_uncompressed_bytes':args.baseline,'article_html_bytes':article_sizes,'thumbnail_bytes':{key:value['bytes'] for key,value in covers.items()},'notes':'Byte counts are not a mainland speed measurement. All article text is present in HTML; search index is fetched only on search intent. Full-size art is used on article pages.'}
write('performance-budget.json',json.dumps(budget,ensure_ascii=False,indent=2)+'\n')
for path in files:
    if path.endswith(('.html','.json')):
        text=(out/path).read_text(encoding='utf-8')
        assert not re.search(r'[\u4e00-\u9fff]{2,}(?:大学|学院)',text),path
(out/'publish-manifest.json').write_text(json.dumps(files,ensure_ascii=False),encoding='utf-8')
print(json.dumps({key:budget[key] for key in ['articles','unique_covers','homepage_blocking_external_files','previous_required_files_uncompressed_bytes']}))

