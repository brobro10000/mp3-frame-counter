"""Adapt foundation validation to the installed orchestrator's direct Python contract.

Run `python3 scripts/validate_phase.py --project-root . --json` with the pinned npm
toolchain and authenticated GitHub CLI available. The script runs local repository
validation followed by the read-only current-PR audit in the selected project root.
It stops at the first unsuccessful command and emits a deterministic JSON result
after the commands return, with command diagnostics sent to stderr on failure.

This adapter serves local phase validation, not normal CI or application testing.
It inherits PATH and authentication from its caller; the installed router's stripped
environment cannot locate npm. Missing tools and timeouts produce a failed JSON
result, never successful validation evidence. Set --timeout-seconds (1-600; default
300) to bound each command without relying on one developer's machine speed.
"""

import argparse
import json
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--project-root", required=True)
parser.add_argument("--json", action="store_true")
parser.add_argument("--timeout-seconds", type=int, default=300)
args = parser.parse_args()
if not 1 <= args.timeout_seconds <= 600:
    parser.error("--timeout-seconds must be between 1 and 600")
root = Path(args.project_root).resolve(strict=True)
# Match the documented npm commands; keep GitHub administration strictly read-only.
commands = [["npm", "run", "validate"], ["npm", "run", "verify:github"]]
errors = []
for command in commands:
    try:
        result = subprocess.run(
            command, cwd=root, capture_output=True, text=True, timeout=args.timeout_seconds, check=False
        )
    except FileNotFoundError:
        errors.append("missing executable on PATH: " + command[0])
        break
    except subprocess.TimeoutExpired:
        errors.append(f"timed out after {args.timeout_seconds}s: " + " ".join(command))
        break
    if result.returncode:
        errors.append("failed: " + " ".join(command))
        print(result.stdout + result.stderr, file=sys.stderr)
        break
# Hashable result output excludes variable test timings and API responses captured from the subprocesses.
print(json.dumps({"status": "failed" if errors else "validated", "errors": errors, "commands": commands}, sort_keys=True))
sys.exit(1 if errors else 0)
