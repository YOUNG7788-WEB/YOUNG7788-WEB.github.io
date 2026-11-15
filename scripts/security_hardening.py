"""Add an automatically hashed CSP to each generated HTML page."""
from pathlib import Path
import base64,gzip,hashlib,json,re
from html import escape

SCRIPT=re.compile(r'<script\b([^>]*)>([\s\S]*?)</script\s*>',re.I)

def policy_for(html):
    hashes=[]
    for attributes,code in SCRIPT.findall(html):
        if re.search(r'\bsrc\s*=',attributes,re.I):
            raise ValueError('Generated pages must not depend on external script files')
        value="'sha256-"+base64.b64encode(hashlib.sha256(code.encode('utf-8')).digest()).decode()+"'"
        if value not in hashes:hashes.append(value)
    scripts=' '.join(hashes) if hashes else "'none'"
    return "; ".join([
        "default-src 'none'",'script-src '+scripts,"script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline'","img-src 'self' data:",
        "font-src 'self'","connect-src 'self'","object-src 'none'",
        "base-uri 'none'","form-action 'none'","frame-src 'none'",
        "worker-src 'none'","manifest-src 'self'",'upgrade-insecure-requests'
    ])

def harden_page(html):
    html=re.sub(r'<meta\b[^>]*(?:http-equiv=[\"\']Content-Security-Policy[\"\']|name=[\"\']referrer[\"\'])[^>]*>','',html,flags=re.I)
    policy=policy_for(html)
    tags='<meta http-equiv="Content-Security-Policy" content="'+escape(policy,quote=True)+'"><meta name="referrer" content="no-referrer">'
    html,n=re.subn(r'(<meta\s+charset=[\"\']?utf-8[\"\']?\s*>)',lambda m:m[1]+tags,html,count=1,flags=re.I)
    if n!=1:raise ValueError('Missing charset declaration')
    return html

def harden(out):
    out=Path(out);manifest=json.loads((out/'publish-manifest.json').read_text())
    missing='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>页面未找到 · Young 的数字花园</title><style>body{font:16px/1.8 system-ui,sans-serif;background:#fafaf7;color:#141612;max-width:650px;margin:15vh auto;padding:24px}h1{font-size:64px;line-height:1}a{color:inherit;text-underline-offset:5px}</style></head><body><main><h1>404</h1><p>这条小路还没有种下内容。</p><p><a href="/index.html">回到数字花园 →</a> · <a href="/lite.html">省流阅读</a></p></main></body></html>'''
    (out/'404.html').write_text(missing,encoding='utf-8')
    if '404.html' not in manifest:manifest.append('404.html')
    (out/'publish-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False))
    count=0
    for name in manifest:
        if name.endswith('.html'):
            p=out/name;p.write_text(harden_page(p.read_text()),encoding='utf-8');count+=1
    budget=json.loads((out/'performance-budget.json').read_text());raw=(out/'index.html').read_bytes()
    budget.update(homepage_required_html_bytes=len(raw),homepage_gzip_bytes_for_comparison=len(gzip.compress(raw)),csp_protected_pages=count)
    for ident in budget['article_html_bytes']:
        budget['article_html_bytes'][ident]=(out/'posts'/f'{ident}.html').stat().st_size
    (out/'performance-budget.json').write_text(json.dumps(budget,ensure_ascii=False,indent=2)+'\n')
    return count
