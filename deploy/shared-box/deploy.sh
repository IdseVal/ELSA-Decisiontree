#!/usr/bin/env bash
# Put one commit of this repository live on the shared box (docs/hosting-shared-box.md).
# Installed as /srv/elsa/deploy.sh, owned by root, run as the `elsa` user:
#
#   /srv/elsa/deploy.sh <commit>      the commit to serve, as a full SHA (a branch name works too)
#
# It fetches that commit into /srv/elsa/app, builds it there, copies the standalone server
# into /srv/elsa/current, restarts the service and checks that the new server answers. The
# data directory (/srv/elsa/data) is never written: a release replaces the application
# folder only, and carries no Tree (docs/deployment.md, "Putting a new version"). Before the
# swap, snapshot.sh (installed beside this script) copies the data directory into
# /srv/elsa/backups, since the new release's first start may convert its files in place.
#
# A rollback is this script with the previous commit. The deploy workflow
# (.github/workflows/deploy.yml) runs it over SSH; it runs the same by hand.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"   # resolved before the cd below; snapshot.sh is here
ELSA_HOME=/srv/elsa
APP="$ELSA_HOME/app"           # the checkout, built in place
CURRENT="$ELSA_HOME/current"   # the standalone server the unit runs (deploy/shared-box/shared-box.conf)
DATA="$ELSA_HOME/data"         # ELSA_DATA_DIR in /etc/elsa-decisiontree.env
BACKUPS="$ELSA_HOME/backups"   # snapshot.sh's archives, the ten newest
SERVICE=elsa-decisiontree
PORT="${ELSA_PORT:-3001}"      # must match PORT in /etc/elsa-decisiontree.env

commit="${1:-}"
if [ -z "$commit" ]; then
  echo "usage: $0 <commit>" >&2
  exit 2
fi
if [ "$(id -un)" != "elsa" ]; then
  echo "run as the elsa user: sudo -u elsa -H $0 $commit" >&2
  exit 2
fi

# Node.js 22 for this service alone, when bootstrap.sh installed it because the box's own Node
# is older than package.json's "engines" (the drop-in gives the unit the same PATH).
if [ -d "$ELSA_HOME/node/bin" ]; then PATH="$ELSA_HOME/node/bin:$PATH"; fi
echo "node $(node --version)"

echo "== fetch $commit"
cd "$APP"
git fetch --quiet origin "$commit"
git checkout --quiet --detach FETCH_HEAD
git log --oneline -1

echo "== install + build"
# The build must phone nobody (docs/deployment.md, step 2). NODE_ENV is NOT set here: npm ci
# would then leave out the devDependencies the build needs; the unit sets it for the server.
export NEXT_TELEMETRY_DISABLED=1
npm ci --no-audit --no-fund
npm run build
test -f .next/standalone/server.js || { echo "standalone server.js missing after the build" >&2; exit 1; }

echo "== copy into place"
# The running server holds nothing open in $CURRENT that a copy over it would break on Linux,
# but a half-copied folder must never be what a restart finds: copy next to it, then swap.
rm -rf "$CURRENT.next"
cp -r .next/standalone "$CURRENT.next"
# The build traces the repository's Trees into the standalone folder as the seed. On this box
# the data directory is the truth, and a release carries code only (core document 9, [#247]):
# a store whose trees/ is gone starts empty, and the copy below is the way back.
rm -rf "$CURRENT.next/trees"

echo "== copy the data directory"
# Named by the time and the commit checked out above, so a branch name given to this script
# still names its commit. A failed copy stops the deploy: the running release keeps serving.
label="pre-deploy-$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short=12 HEAD)"
if ! "$here/snapshot.sh" "$DATA" "$BACKUPS" "$label"; then
  echo "the copy of $DATA failed: nothing swapped, nothing restarted, $SERVICE keeps serving" >&2
  exit 1
fi

echo "== swap"
if [ -d "$CURRENT" ]; then
  rm -rf "$CURRENT.prev"
  mv "$CURRENT" "$CURRENT.prev"
fi
mv "$CURRENT.next" "$CURRENT"
git rev-parse HEAD > "$CURRENT/COMMIT"

echo "== restart"
# The one command the elsa user may run as root (deploy/shared-box/sudoers).
sudo systemctl restart "$SERVICE"

echo "== check"
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || true)"
  if [ "$code" = "200" ]; then
    echo "serving $(cat "$CURRENT/COMMIT") on 127.0.0.1:$PORT (200)"
    rm -rf "$CURRENT.prev"
    exit 0
  fi
done
echo "the server does not answer 200 on 127.0.0.1:$PORT (last: ${code:-none}); its log:" >&2
journalctl -u "$SERVICE" -n 30 --no-pager >&2 || true
exit 1
