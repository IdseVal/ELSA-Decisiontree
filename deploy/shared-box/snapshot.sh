#!/usr/bin/env bash
# Copy the data directory into one archive before a release starts (docs/deployment.md,
# "Putting a new version"; docs/hosting-shared-box.md). Installed as /srv/elsa/snapshot.sh
# beside deploy.sh, which runs it as the `elsa` user after the build and before the swap:
#
#   snapshot.sh <data dir> <backup dir> <label>     writes <backup dir>/<label>.tar.gz
#
# A start of the new release may convert the data directory's files to a newer format in place
# (docs/specs/application.md 17.4), and nothing else keeps the old bytes; the nightly backup can
# be a day old. The service keeps serving while this runs (elsa may restart it, not stop it), so
# the copy is of a live folder: each file as it was when read. It keeps the ten newest archives
# by name, which is by time, as deploy.sh's labels start with it.
set -euo pipefail

KEEP=10

if [ "$#" -ne 3 ]; then
  echo "usage: $0 <data dir> <backup dir> <label>" >&2
  exit 2
fi
data="$1"
backups="$2"
label="$3"

# The label becomes a file name inside the backup folder, and nothing else.
case "$label" in
  '' | .* | *[!A-Za-z0-9._-]*)
    echo "the label must be a plain file name (letters, digits, '.', '_', '-'): '$label'" >&2
    exit 2
    ;;
esac
if [ ! -d "$data" ]; then
  echo "no data directory at $data" >&2
  exit 1
fi
if [ ! -d "$backups" ]; then
  # The archives hold the accounts' password hashes: for the owner of the folder alone.
  (umask 077 && mkdir -p "$backups") || { echo "cannot make the backup folder $backups" >&2; exit 1; }
fi

archive="$backups/$label.tar.gz"
if [ -e "$archive" ]; then
  echo "$archive exists already: refused, it is left as it is" >&2
  exit 1
fi

# Written under another name and renamed when whole, so that an archive by its own name is
# always a complete one. --force-local: Git Bash's tar reads "C:" as a remote host without it.
partial="$archive.partial"
status=0
tar --force-local -czf "$partial" -C "$data" . || status=$?
if [ "$status" -eq 1 ]; then
  # GNU tar's 1 is "some files differ": a file changed or vanished while read (writeAtomic's
  # .tmp files come and go). Each file in the archive is still whole.
  echo "warning: tar exit status 1, a file changed as it was read; the archive holds each file as it was read" >&2
elif [ "$status" -ne 0 ]; then
  rm -f "$partial"
  echo "tar failed with exit status $status: no archive written" >&2
  exit 1
fi
mv "$partial" "$archive"
echo "wrote $archive"

find "$backups" -maxdepth 1 -type f -name '*.tar.gz' -printf '%f\n' | sort | head -n "-$KEEP" | while read -r old; do
  rm -f "$backups/$old"
  echo "removed the older $old"
done
