#!/usr/bin/env bash
# Set this application up on the shared box, once (docs/hosting-shared-box.md, "Order of work").
# Run by the operator, with sudo, from a checkout of this repository on the box:
#
#   git clone https://github.com/IdseVal/ELSA-Decisiontree.git /tmp/elsa-src
#   sudo ELSA_DOMAIN=<the domain> ELSA_ADMIN_EMAIL=<address> ELSA_ADMIN_PASSWORD=<12+ chars> \
#        bash /tmp/elsa-src/deploy/shared-box/bootstrap.sh
#
# Idempotent: every step checks before it changes, so it can be re-run after a failure. It
# creates the `elsa` user and the folders under /srv/elsa, clones the repository there,
# writes the env file and installs the unit, its drop-in, the sudoers line and deploy.sh.
# It does NOT edit the Caddyfile, start the service or deploy a commit: those are the two
# commands it prints at the end, so that the operator sees each before it runs.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "run with sudo" >&2; exit 2; fi
: "${ELSA_DOMAIN:?set ELSA_DOMAIN to the domain this deployment answers on}"
: "${ELSA_ADMIN_EMAIL:?set ELSA_ADMIN_EMAIL to the address the administrator logs in with}"
: "${ELSA_ADMIN_PASSWORD:?set ELSA_ADMIN_PASSWORD (12 to 256 characters) for the first start}"
if [ "${#ELSA_ADMIN_PASSWORD}" -lt 12 ]; then echo "ELSA_ADMIN_PASSWORD is shorter than 12 characters" >&2; exit 2; fi

here="$(cd "$(dirname "$0")" && pwd)"
REPO=https://github.com/IdseVal/ELSA-Decisiontree.git
ELSA_HOME=/srv/elsa
ENV_FILE=/etc/elsa-decisiontree.env
UNIT=/etc/systemd/system/elsa-decisiontree.service

echo "== user and folders"
if ! id elsa >/dev/null 2>&1; then
  adduser --system --group --home "$ELSA_HOME" --shell /bin/bash elsa
fi
install -d -o elsa -g elsa -m 0750 "$ELSA_HOME" "$ELSA_HOME/data"
# Tailscale SSH and plain sshd both log the deploy workflow in as this user; both need a home
# it may write (the npm cache goes there).
install -d -o elsa -g elsa -m 0700 "$ELSA_HOME/.ssh"

echo "== checkout"
if [ ! -d "$ELSA_HOME/app/.git" ]; then
  sudo -u elsa -H git clone --quiet "$REPO" "$ELSA_HOME/app"
fi

echo "== node"
if command -v node >/dev/null 2>&1; then
  echo "node $(node --version) on PATH (this application needs 22.18 or later)"
else
  echo "no node on PATH: install Node.js 22 (docs/deployment.md, step 1), or under $ELSA_HOME/node for this service alone" >&2
fi

echo "== env file"
if [ ! -f "$ENV_FILE" ]; then
  umask 077
  cat > "$ENV_FILE" <<EOF
# The ELSA decision tree on this box (docs/hosting-shared-box.md); the keys are explained in
# deploy/elsa-decisiontree.env.example of the repository.
ELSA_DATA_DIR=$ELSA_HOME/data
ELSA_BASE_URL=https://$ELSA_DOMAIN
PORT=3001
HOSTNAME=127.0.0.1
# For the FIRST start only; remove both lines after it and restart (docs/deployment.md,
# "The administrator and the login").
ELSA_ADMIN_EMAIL=$ELSA_ADMIN_EMAIL
ELSA_ADMIN_PASSWORD=$ELSA_ADMIN_PASSWORD
EOF
  umask 022
  chmod 0600 "$ENV_FILE"
  echo "written $ENV_FILE"
else
  echo "$ENV_FILE exists, left as it is"
fi

echo "== unit, drop-in, sudoers, deploy.sh"
install -m 0644 "$here/../elsa-decisiontree.service" "$UNIT"
install -d -m 0755 "$UNIT.d"
install -m 0644 "$here/shared-box.conf" "$UNIT.d/shared-box.conf"
install -m 0440 "$here/sudoers" /etc/sudoers.d/elsa-decisiontree
visudo -cf /etc/sudoers.d/elsa-decisiontree
install -m 0755 "$here/deploy.sh" "$ELSA_HOME/deploy.sh"
systemctl daemon-reload
systemctl enable --quiet elsa-decisiontree

cat <<EOF

Done. Two steps are left for you, each one command:

1. The virtual host. Append deploy/shared-box/Caddyfile.snippet to /etc/caddy/Caddyfile with
   ELSA_DOMAIN replaced by $ELSA_DOMAIN, then:  sudo systemctl reload caddy

2. The first deploy, of the commit you choose (a full SHA, or a branch name):
     sudo -u elsa -H $ELSA_HOME/deploy.sh main
   Then read its first start:  journalctl -u elsa-decisiontree -n 30
   and REMOVE the two ELSA_ADMIN_ lines from $ENV_FILE, then:  sudo systemctl restart elsa-decisiontree
EOF
