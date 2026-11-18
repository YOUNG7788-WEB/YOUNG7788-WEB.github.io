"""Bundle only public runtime files into one dependency-free Worker ESM."""
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
import base64,gzip,hashlib,json,mimetypes,re,shutil

ROOT=Path(__file__).resolve().parent.parent
class Resources(HTMLParser):
 def __init__(self):super().__init__();self.urls=set();self.policy=None
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='meta' and a.get('http-equiv','').lower()=='content-security-policy':self.policy=a['content']
  for key in ['src','data-image']:
   value=a.get(key,'')
   if value.startswith('/assets/'):self.urls.add(value)
  for entry in a.get('srcset','').split(','):
   value=entry.strip().split()
   if value and value[0].startswith('/assets/'):self.urls.add(value[0])

def build(output_root=ROOT):
 output_root=Path(output_root)
 public=[ROOT/'index.html',ROOT/'lite.html',ROOT/'article.html',ROOT/'404.html',*sorted((ROOT/'posts').glob('*.html')),ROOT/'en/lite.html',*sorted((ROOT/'en/posts').glob('*.html'))]
 resources=set();assets={}
 def add(p,policy=None):
  raw=p.read_bytes();name='/'+p.relative_to(ROOT).as_posix();kind=mimetypes.guess_type(name)[0] or 'application/octet-stream'
  text=p.suffix in ['.html','.js','.json','.svg','.xml']
  if p.suffix=='.js':kind='application/javascript'
  if p.name=='feed.xml':kind='application/rss+xml'
  if text and kind!='image/svg+xml':kind+='; charset=utf-8'
  item={'type':kind,'digest':hashlib.sha256(raw).hexdigest(),'encoding':'utf8' if text else 'base64','body':raw.decode() if text else base64.b64encode(raw).decode()}
  if policy:item['policy']=policy+"; frame-ancestors 'none'"
  assets[name]=item
 for p in public:
  parser=Resources();parser.feed(p.read_text())
  if not parser.policy:raise ValueError('Missing prevalidated CSP: '+str(p))
  resources.update(parser.urls);add(p,parser.policy)
 for name in ['app.js','article.js','search-index.json','favicon.svg','feed.xml']:add(ROOT/name)
 for name in sorted(resources):add(ROOT/name.lstrip('/'))
 original=[]
 for p in sorted((ROOT/'assets').rglob('*')):
  if not p.is_file():continue
  name='/'+p.relative_to(ROOT).as_posix()
  if name not in assets and p.suffix in ['.webp','.png','.jpg','.jpeg','.gif','.json']:original.append(name)
 runtime=(ROOT/'worker/runtime.mjs').read_text()
 code=runtime+'\nconst publicAssets='+json.dumps(assets,ensure_ascii=False,separators=(',',':'))+';\nconst legacyAssets='+json.dumps(original,separators=(',',':'))+';\nexport default createWorker(publicAssets,legacyAssets);\n'
 (output_root/'worker').mkdir(parents=True,exist_ok=True)
 (output_root/'worker/index.js').write_text(code,encoding='utf-8')
 # Keep static sources and artwork intact. Only replace generated deployment output.
 dist=output_root/'dist'
 if dist.exists():shutil.rmtree(dist)
 (dist/'server').mkdir(parents=True);(dist/'server/index.js').write_text(code,encoding='utf-8')
 report={'bundled_runtime_files':len(assets),'original_artwork_fallbacks':len(original),'worker_bytes':len(code.encode()),'worker_gzip_bytes':len(gzip.compress(code.encode())),'contains_authoring_json':'/content.json' in assets}
 (output_root/'worker/build-report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report))
 return report
if __name__=='__main__':build()
