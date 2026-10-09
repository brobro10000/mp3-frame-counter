"""Adapt foundation validation to the installed orchestrator's direct Python contract.

Run `python3 scripts/validate_phase.py --project-root . --json` with the pinned npm
toolchain and authenticated GitHub CLI available. The script runs local repository
validation followed by the read-only current-PR audit in the selected project root.
It stops at the first unsuccessful command and emits a deterministic JSON result
after the commands return, with command diagnostics sent to stderr on failure.

This adapter serves local phase validation, not normal CI or application testing.
It inherits PATH and authentication from its caller; the installed router's stripped
environment cannot locate npm. Missing tools and subprocess timeouts propagate as
execution failures rather than being converted into successful validation evidence.
"""

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
# Match the documented npm commands; keep GitHub administration strictly read-only.
commands = [["npm", "run", "validate"], ["npm", "run", "verify:github"]]
errors = []
for command in commands:
    result = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=50, check=False)
    if result.returncode:
        errors.append("failed: " + " ".join(command))
        print(result.stdout + result.stderr, file=sys.stderr)
        break
# Hashable result output excludes variable test timings and API responses captured from the subprocesses.
print(json.dumps({"status": "failed" if errors else "validated", "errors": errors, "commands": commands}, sort_keys=True))
sys.exit(1 if errors else 0)
