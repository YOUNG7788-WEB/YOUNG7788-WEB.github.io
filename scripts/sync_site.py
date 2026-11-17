"""Refresh every generated page and Worker, or check source/output consistency."""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import sys
import tempfile

from build_secure_worker import build as build_worker

ROOT = Path(__file__).resolve().parent.parent


def sync(check=False):
    # A clean output directory prevents old hashed covers from entering new HTML.
    with tempfile.TemporaryDirectory(prefix='young-notebook-') as directory:
        generated = Path(directory) / 'pages'
        subprocess.run([
            sys.executable, str(ROOT / 'scripts/build_site.py'),
            '--data', str(ROOT / 'content.json'),
            '--source-root', str(ROOT), '--output', str(generated),
        ], check=True, cwd=ROOT)
        manifest = json.loads((generated / 'publish-manifest.json').read_text())
        mismatched = []
        for name in manifest:
            source = (generated / name).resolve()
            target = (ROOT / name).resolve()
            if not source.is_relative_to(generated.resolve()) or not target.is_relative_to(ROOT):
                raise ValueError('Invalid generated path: ' + name)
            if check:
                if not target.is_file() or target.read_bytes() != source.read_bytes():
                    mismatched.append(name)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
        if mismatched:
            raise ValueError('Generated files need refreshing:\n' + '\n'.join(mismatched))
        subprocess.run([sys.executable, str(ROOT / 'scripts/check_site_security.py'), str(ROOT)], check=True)
        if check:
            output = Path(directory) / 'worker-check'
            build_worker(output)
            for name in ['worker/build-report.json', 'dist/server/index.js']:
                # Public GitHub Pages source deliberately omits Sites-only dist/.
                committed = ROOT / name
                if name.startswith('dist/') and not committed.exists():
                    continue
                if not committed.is_file() or committed.read_bytes() != (output / name).read_bytes():
                    raise ValueError('Worker output needs refreshing: ' + name)
        else:
            build_worker()
        print(('Verified' if check else 'Synchronized') + f' {len(manifest)} generated files and the notebook Worker.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify without changing published files')
    options = parser.parse_args()
    sync(check=options.check)
