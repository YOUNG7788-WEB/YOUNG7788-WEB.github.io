from pathlib import Path
import subprocess,sys,json,gzip
from editorial_home import render
from optimize_delivery import optimize
from security_hardening import harden
root=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable,str(root/'scripts/base_build.py'),*sys.argv[1:]],check=True)
args=sys.argv[1:];out=Path(args[args.index('--output')+1]);data=json.loads(Path(args[args.index('--data')+1]).read_text())
render(data,root,out)
budget=json.loads((out/'performance-budget.json').read_text());raw=(out/'index.html').read_bytes();budget['homepage_required_html_bytes']=len(raw);budget['homepage_gzip_bytes_for_comparison']=len(gzip.compress(raw));budget['design']='Young field notebook';(out/'performance-budget.json').write_text(json.dumps(budget,ensure_ascii=False,indent=2))
manifest=json.loads((out/'publish-manifest.json').read_text());manifest.extend(['favicon.svg','feed.xml']);(out/'publish-manifest.json').write_text(json.dumps(manifest))
optimize(data,out)
harden(out)
print('Editorial home generated:',len(raw),'bytes')
