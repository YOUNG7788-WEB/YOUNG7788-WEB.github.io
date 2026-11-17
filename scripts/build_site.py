"""Generate the notebook homepage and all supporting public pages."""
from pathlib import Path
import argparse, subprocess, sys, json
from editorial_home import render
from optimize_delivery import optimize
from security_hardening import harden
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--data',required=True)
parser.add_argument('--output',required=True)
parser.add_argument('--source-root',default=str(root))
args,remaining=parser.parse_known_args()
out=Path(args.output)
data=json.loads(Path(args.data).read_text(encoding='utf-8'))
subprocess.run([sys.executable,str(root/'scripts/base_build.py'),'--data',args.data,'--output',args.output,'--source-root',args.source_root,*remaining],check=True)
render(data,root,out)
manifest=json.loads((out/'publish-manifest.json').read_text());manifest.extend(['index.html','favicon.svg','feed.xml']);(out/'publish-manifest.json').write_text(json.dumps(manifest))
optimize(data,out,Path(args.source_root))
harden(out)
print('Notebook home generated:',(out/'index.html').stat().st_size,'bytes')
