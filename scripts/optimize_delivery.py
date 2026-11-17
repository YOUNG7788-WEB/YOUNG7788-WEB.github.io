"""Generate responsive covers and measure portable static delivery budgets."""
from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO
import gzip,hashlib,json,re
from html import escape

def optimize(data,out,source_root=None):
 root=Path(source_root) if source_root is not None else Path(__file__).resolve().parent.parent
 budget=json.loads((out/'performance-budget.json').read_text())
 manifest=json.loads((out/'publish-manifest.json').read_text())
 reports={}
 for i in data['items']:
  if i.get('placeholder') or i.get('status')!='published':continue
  source=root/i['image'];image=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
  image.thumbnail((960,640),Image.Resampling.LANCZOS)
  for quality in [72,67,62,57,52]:
   buf=BytesIO();image.save(buf,'WEBP',quality=quality,method=6)
   raw=buf.getvalue()
   if len(raw)<=80*1024:break
  if len(raw)>80*1024:
   image.thumbnail((800,533),Image.Resampling.LANCZOS)
   for quality in [62,56,50,44]:
    buf=BytesIO();image.save(buf,'WEBP',quality=quality,method=6);raw=buf.getvalue()
    if len(raw)<=80*1024:break
  while len(raw)>80*1024 and image.width>480:
   image.thumbnail((int(image.width*.9),int(image.height*.9)),Image.Resampling.LANCZOS)
   buf=BytesIO();image.save(buf,'WEBP',quality=62,method=6);raw=buf.getvalue()
  name=f'assets/optimized/{i["id"]}-960-{hashlib.sha256(raw).hexdigest()[:10]}.webp'
  dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);manifest.append(name)
  thumb=next((out/'assets/thumbs').glob('article-'+i['id']+'-*.webp'))
  path=out/'posts'/f'{i["id"]}.html';text=path.read_text()
  tag=f'<img class="article-art" src="/{thumb.relative_to(out)}" srcset="/{thumb.relative_to(out)} 480w, /{name} {image.width}w" sizes="100vw" width="{image.width}" height="{image.height}" alt="" decoding="async" fetchpriority="low">'
  text=re.sub(r'<img class="article-art"[^>]*>',lambda _:tag,text)
  related=[j for j in data['items'] if j.get('status')=='published' and not j.get('placeholder') and j['id']!=i['id'] and j['category']==i['category']][:2]
  if not related:related=[j for j in data['items'] if j.get('status')=='published' and not j.get('placeholder') and j['id']!=i['id'] and j['category']!='contact'][:2]
  cards=''.join('<a href="/posts/'+j['id']+'.html"><small>继续沿着这条小路</small><h3>'+escape(j['title']['zh'])+'</h3><span>读下一篇 ↗</span></a>' for j in related)
  section='<section class="shell related-notes" aria-label="继续阅读"><p>KEEP READING / 再翻两页</p><div class="related-grid">'+cards+'</div></section>'
  text=text.replace('<div class="shell article-end">',section+'<div class="shell article-end">')
  path.write_text(text)
  reports[i['id']]={'original_bytes':source.stat().st_size,'responsive_960_bytes':len(raw),'responsive_width':image.width,'mobile_480_bytes':thumb.stat().st_size}
  budget['article_html_bytes'][i['id']]=len(text.encode())
 html=(out/'index.html').read_text()
 budget.update(homepage_required_html_bytes=len(html.encode()),homepage_gzip_bytes_for_comparison=len(gzip.compress(html.encode())),responsive_covers=reports,external_runtime_dependencies=0,homepage_eager_images=0,delivery_notes=['HTML contains all article titles and summaries; article bodies are static HTML.','System fonts; no Google Fonts, external script CDN, analytics or third-party API.','Work artwork lazy-loaded; archive artwork lazy-loaded and hidden in list mode.','Article covers use 480w/960w same-origin WebP; original art files are preserved.','No mainland availability assertion without actual mainland-node evidence.'])
 (out/'performance-budget.json').write_text(json.dumps(budget,ensure_ascii=False,indent=2)+'\n')
 (out/'publish-manifest.json').write_text(json.dumps(list(dict.fromkeys(manifest)),ensure_ascii=False))
 return budget
