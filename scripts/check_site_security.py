"""Dependency-free validation of committed, generated static pages.

This is a regression guard, not a complete secret scanner or penetration test.
"""
from pathlib import Path
from html.parser import HTMLParser
import base64,hashlib,json,re,sys

SECRET_PATTERNS={
 'private_key':r'-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----',
 'github_token':r'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})',
 'openai_key':r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}',
 'aws_access_key':r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
 'google_api_key':r'\bAIza[0-9A-Za-z_-]{30,}',
 'authenticated_url':r'https?://[^/\s\"<>:@]+:[^@/\s\"<>]+@',
}

class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.policy=None;self.referrer=None;self.errors=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='meta' and a.get('http-equiv','').lower()=='content-security-policy':self.policy=a.get('content','')
  if tag=='meta' and a.get('name','').lower()=='referrer':self.referrer=a.get('content')
  if tag in ['style','script'] and not self.policy:self.errors.append('CSP must precede styles/scripts')
  if tag=='script' and a.get('src'):self.errors.append('Unexpected external script dependency')
  if any(k.lower().startswith('on') for k in a):self.errors.append('Inline event handler')
  if tag=='a':
   if a.get('href','').strip().lower().startswith(('javascript:','data:','vbscript:')):self.errors.append('Unsafe link scheme')
   if a.get('target')=='_blank' and 'noopener' not in a.get('rel','').split():self.errors.append('Missing noopener')
  if tag=='meta' and a.get('http-equiv','').lower() in ['x-frame-options','x-content-type-options','permissions-policy']:
   self.errors.append('Ineffective header-only policy in meta')

def page_errors(html):
 p=Page();p.feed(html);errors=list(p.errors)
 if not p.policy:return errors+['Missing CSP']
 directives={parts[0]:parts[1:] for part in p.policy.split(';') if (parts:=part.split())}
 hashes=[]
 for attrs,body in re.findall(r'<script\b([^>]*)>([\s\S]*?)</script\s*>',html,re.I):
  hashes.append("'sha256-"+base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()+"'")
 expected=set(hashes) if hashes else {"'none'"}
 if set(directives.get('script-src',[]))!=expected:errors.append('Script hash allowlist mismatch')
 for name in ['default-src','base-uri','object-src','form-action','frame-src','worker-src','script-src-attr']:
  if directives.get(name)!=["'none'"]:errors.append('Unsafe or absent '+name)
 if 'frame-ancestors' in directives:errors.append('frame-ancestors does not work in meta')
 if p.referrer!='no-referrer':errors.append('Missing no-referrer policy')
 return errors

def validate(root):
 root=Path(root);errors=[];pages=[*sorted(root.glob('*.html')),*sorted((root/'posts').glob('*.html')),*sorted((root/'en').rglob('*.html'))]
 for p in pages:
  if not p.is_file():errors.append(str(p)+': missing');continue
  errors.extend(str(p.relative_to(root))+': '+e for e in page_errors(p.read_text()))
 data=json.loads((root/'content.json').read_text())
 for i in data['items']:
  if i.get('status')!='published' or i.get('placeholder'):errors.append('Keep unpublished authoring content outside this public repository')
  for prefix in ('posts','en/posts'):
   if not (root/prefix/f'{i["id"]}.html').is_file():errors.append('Missing published article '+prefix+'/'+i['id'])
 if (root/'.nojekyll').exists():errors.append('.nojekyll would bypass source-file exclusions')
 config=(root/'_config.yml').read_text()
 for name in ['content.json','scripts','README.md','AGENTS.md','SECURITY.md','DESIGN.md','performance-budget.json']:
  if '  - '+name+'\n' not in config:errors.append('Missing publication exclusion: '+name)
 for p in root.rglob('*'):
  if not p.is_file() or '.git' in p.relative_to(root).parts:continue
  if p.relative_to(root).as_posix()=='worker/index.js':continue
  if any(part in ['original','staging','dist','__pycache__','site-build'] for part in p.relative_to(root).parts):continue
  if p.name=='.env' or p.name.startswith('.env.') and p.name!='.env.example':errors.append(str(p.relative_to(root))+': environment file must not be committed')
  if p.suffix.lower() not in ['.html','.js','.mjs','.json','.xml','.svg','.py','.css','.md','.yml','.yaml','.txt','.sh','.ini','.toml']:continue
  try:text=p.read_text()
  except UnicodeDecodeError:continue
  for name,pattern in SECRET_PATTERNS.items():
   if re.search(pattern,text):errors.append(str(p.relative_to(root))+': possible '+name+' (value redacted)')
 if errors:raise ValueError('\n'.join(errors))
 return {'html_pages':len(pages),'published_articles':len(data['items']),'secret_signature_matches':0,'csp_hashes':'validated','publication_exclusions':'validated'}

if __name__=='__main__':
 try:print(json.dumps(validate(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent.parent)))
 except (ValueError,OSError) as error:print(str(error),file=sys.stderr);raise SystemExit(1)
