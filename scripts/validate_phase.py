"""Adapt real foundation checks to the installed orchestrator's direct Python contract."""

import argparse
import json
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--project-root", required=True)
parser.add_argument("--json", action="store_true")
args = parser.parse_args()
root = Path(args.project_root).resolve(strict=True)
commands = [["npm", "run", "validate"], ["npm", "run", "verify:github"]]
errors = []
for command in commands:
    result = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=50, check=False)
    if result.returncode:
        errors.append("failed: " + " ".join(command))
        print(result.stdout + result.stderr, file=sys.stderr)
        break
print(json.dumps({"status": "failed" if errors else "validated", "errors": errors, "commands": commands}, sort_keys=True))
sys.exit(1 if errors else 0)
