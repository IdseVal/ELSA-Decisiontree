#!/usr/bin/env bash
#
# Everything the container needs that the image cannot bake in: project dependencies, which
# change with the lockfiles. (Skills are committed in .claude/skills/ and arrive with the
# checkout -- the v0.1.1 install step is gone on purpose.)
#
# The dependency installs are guarded on the directories existing: this project has no code
# yet (the core document interview comes first), so the container must open cleanly on an
# empty repository. When the project gains its backend/frontend layout, adapt these blocks.
#
# Deliberately NOT `set -e` around the whole file. A failed optional step must not leave a
# developer with no container at all; a failed dependency install must.
set -uo pipefail

cd /workspace

echo "==> Python dependencies"
if [ -d backend ]; then
  set -e
  python -m pip install --quiet --upgrade pip
  python -m pip install --quiet -e "backend[dev]" -c backend/constraints.txt
  set +e
else
  echo "    (no backend/ yet; skipping)"
fi

echo "==> Node dependencies"
if [ -f frontend/package-lock.json ]; then
  (cd frontend && npm ci --no-audit --no-fund) || {
    echo "!! npm ci failed. The container is usable; run it by hand." >&2
  }
else
  echo "    (no frontend/package-lock.json yet; skipping)"
fi
