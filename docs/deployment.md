# Deploying the ELSA decision tree on a plain Linux server

> Written for issue #11. Every command below was run on a clean `ubuntu:24.04` container;
> what was measured is in the pull request that added this file.

The application is **one Node.js process and the one folder it keeps its data in**. It has no
database, no queue, no object store, no build service and no runtime that belongs to a
hosting vendor: a Wageningen University machine and a Hetzner box are the same machine to
it (`docs/CORE_DOCUMENT.md` section 7). Moving it is copying two folders and setting a
handful of environment variables.

Two ways are documented, and they run the same build:

- [**A plain server**](#a-plain-server) -- Node.js, a systemd unit, a reverse proxy for TLS.
- [**A container**](#a-container) -- the same thing inside the `Dockerfile` in the
  repository root, for a host where a container is easier to keep.

The shape on disk, for both:

```
/opt/elsa-decisiontree/
|-- app/     the built application: server.js, .next/, node_modules/, the seed trees/  (replaced by a release)
`-- data/    ELSA_DATA_DIR: the whole state, one folder per Tree under trees/           (written by the service)
/etc/elsa-decisiontree.env    the configuration
```

---

## The editor round changes this document (#132, decided 2026-09-23)

> **Written by the architecture freeze of issue #132.** **#134** (the data directory and
> many Trees) has rewritten the sections below it changes: the configuration, the plain
> server's steps, the container and the start messages. **#135** (the administrator's
> password and the login) and **#136** (the store's write path, the import command, backups
> and moving a Tree) have rewritten what is theirs. The decisions are
> `docs/adrs/ADR-132-*.md` and `docs/specs/application.md` 17 to 23.

The application becomes a **writer**: Trees are created and edited in the app behind a login,
saved automatically and published with a toggle. What that changes on a server:

| What | Version 1.0 | The editor round |
|---|---|---|
| The data | `trees/`, copied by an author, read-only to the service | **`ELSA_DATA_DIR`** (`/opt/elsa-decisiontree/data`): one writable folder, owned by the `elsa` user, holding `accounts.json`, `sessions.json` and `trees/<id>/` with the draft, the published `tree.json`, `images/` and `theme/`. Outside `app/`, so a release never touches it. **Required; no default.** (#134; `application.md` 17) |
| Which Tree is served | `ELSA_TREE` names one | Every **published** Tree of the data directory; `/` is an overview of them. `ELSA_TREE`, `ELSA_TREES_DIR` and `ELSA_TREE_LASTMOD` are **retired, and the server refuses to start while any is set**, naming the replacement. (#134; `application.md` 18) |
| The repository's Trees | copied by hand | **`ELSA_SEED_DIR`** (default `trees` beside `server.js`, which the build already carries) is imported into the data directory **at the first start only**, published, owned by the administrator. Later: `npm run store -- import <folder>` from the checkout, with the service stopped. (#134, #136; `application.md` 17.4) |
| The administrator | none | **`ELSA_ADMIN_PASSWORD`**, 12 to 256 characters, in `/etc/elsa-decisiontree.env`, which becomes **mode `0600`**: at every start it creates the `admin` account or resets its password. **Remove it from the file after the first start**; set it again only to recover a lost password. Never a default, never printed. **Done in #135**: see [the administrator and the login](#the-administrator-and-the-login). (`application.md` 20.3) |
| Updating a Tree | validate, `rsync`, restart | Through the editor at `/admin`; no restart. **Done in #136**: see [changing, importing, moving and backing up a Tree](#changing-importing-moving-and-backing-up-a-tree). |
| Backups | the repository | **`rsync -a` or `tar` of `ELSA_DATA_DIR`**, running or stopped: every file in it is replaced atomically, so each file in a copy is whole. Stop the service for a copy exact to the write. Restore is copying the folder back. (`application.md` 17.4) |
| Moving a Tree between deployments | copy the folder | Copy `trees/<id>/tree.json`, `images/` and `theme/` out (not `draft.json`, not `meta.json`) and `npm run store -- import` them on the other side. **Done in #136.** |
| The container | `-e ELSA_TREE=...` | `-v /srv/elsa-data:/data -e ELSA_DATA_DIR=/data -e ELSA_ADMIN_PASSWORD=...` on the first run; the `Dockerfile` changes with #134 and #135. |
| Cookies | none, anywhere | One session cookie, `HttpOnly; Secure; SameSite=Strict; Path=/admin`, on the admin routes only; **the public routes still set none**, and the `curl` check below still prints nothing. A proxy must pass `/admin` through unchanged and still add no cookie of its own. (`application.md` 20) |
| The journal | one line per start | Also: logins by account id, lockouts, publishes and account changes. Never a password, a token, a name typed into the login form, or a client address. (`application.md` 20.8) |

---

## Configuration

Everything a deployment decides is an environment variable. There is no configuration file
in the application and nothing to edit in the source.

| Variable | Required | Meaning |
|---|---|---|
| `ELSA_DATA_DIR` | **yes** | **[#134]** The one writable folder that is the whole state of the deployment: `trees/<tree-id>/` per Tree, **[#135]** `accounts.json` (the accounts, with password hashes) and `sessions.json` (the logged-in sessions, as hashes of their tokens), and the `lock` of the one process that has it open. There is no default; the server refuses to start when it is unset, is not a folder, cannot be written, or is held by another live process. Keep it outside `app/`, so a release never touches it (`docs/specs/application.md` 17). |
| `ELSA_SEED_DIR` | no | **[#134]** Read at the **first start only** -- when `$ELSA_DATA_DIR/trees/` does not exist yet -- and every Tree folder in it that validates is imported, published. Defaults to `trees` under the working directory, which the build already carries. Never read again (`application.md` 17.4). |
| `ELSA_BASE_URL` | no | The address readers reach this deployment at, e.g. `https://elsa.example.org` -- the reverse proxy's address, not the one the process listens on. It must be a bare origin: `http` or `https`, no path, no query. **[#120]** It is now the address `robots.txt`, `sitemap.xml` and every page's canonical and `hreflang` links advertise -- **[#121]** and `llms.txt` and every page's dataset link -- so a deployment that sets none advertises the address each request arrived on instead. See [share links and the base URL](#share-links-and-the-base-url). |
| `ELSA_ADMIN_PASSWORD` | **at the first start** | **[#135]** The password of the administrator, the account `admin` that may do everything in the admin area and is the one that creates every other account. 12 to 256 characters. Read at **every** start: with no administrator yet it creates one, with one it **replaces** its password. So set it for the first start, then **remove it** -- while it is set it wins over a password changed at `/admin/account` -- and set it again only to recover a lost password. Never printed; the log says `administrator password set from ELSA_ADMIN_PASSWORD; remove the variable`. A first start without it refuses to start (`application.md` 20.3). |
| `ELSA_TREE`, `ELSA_TREES_DIR`, `ELSA_TREE_LASTMOD` | **must be unset** | **[#134]** Retired: a deployment serves every published Tree of its data directory, with an overview at `/`. Set, the server refuses to start and names what replaced the variable, so a 1.0 environment file is corrected rather than half-read (`application.md` 18). |
| `PORT` | no | The TCP port the process listens on. Defaults to 3000. |
| `HOSTNAME` | no | The address it listens on. Defaults to `0.0.0.0`. Behind a reverse proxy set `127.0.0.1`, so nothing but the proxy can reach the process. |
| `NODE_ENV` | no | `production` in a deployment. |
| `NEXT_TELEMETRY_DISABLED` | no | `1` in every environment: the framework must phone nobody. |

All of the application's settings take effect **when the process starts**. There is no
reload: change the file, restart the service. The set of Trees served is read from the data
directory at the same moment; a folder placed there by hand is served from the next start.

`deploy/elsa-decisiontree.env.example` is this table as a file to copy.

### Share links and the base URL

A share link is the reader's own address bar (`docs/specs/application.md` 4.1): the share
button copies the URL the browser is showing, so it is the public URL whatever sits in
front of the server, and it needs no configuration to be right.

`ELSA_BASE_URL` is for the absolute URLs the *server* writes about itself: the
`<link rel="canonical">` in a page's `<head>`, which tells a search engine that one Node
has one address whatever Trail led to it, and -- **[#120]**, `docs/specs/application.md`
16 -- the `hreflang` links beside it, every `<loc>` of `/sitemap.xml`, and the `Sitemap:`
line of `/robots.txt`.

**So the variable is now what this deployment advertises to the outside world.** A
deployment that names none is still a valid deployment: those documents then carry the
origin each request arrived on -- the `Host` the proxy passed through -- which is right
whenever the proxy passes the public host through, and wrong the moment it does not. A
public deployment sets the variable, and then no header is read at all.

The share link is unaffected either way: it is the reader's own address bar.

### The date the sitemap reports

`/sitemap.xml` reports every page of a Tree as last modified on the day that Tree's
**published file** -- `$ELSA_DATA_DIR/trees/<tree-id>/tree.json` -- was last written, read
when the server starts (`docs/specs/application.md` 16.2, 23). One file per Tree, so no
Node's text can change without it changing, and each Tree carries its own date.

The seed keeps the timestamp of the file it copies, so a seeded Tree reports the day its
`tree.json` was written in the build's `trees/` -- which, after a `git clone`, is the day of
the clone. A Tree copied in by hand keeps its date only if the copy preserves timestamps:
`rsync -a` and `cp -p` do. `ELSA_TREE_LASTMOD` is retired: the store writes the published
file itself on every publish and every valid save of a published Tree (#136), so its time is
right by construction.

When the file's time is in the future the sitemap carries **no** date rather than a wrong one: a
search engine that catches a site reporting dates it cannot back stops reading them for
that site altogether.

---

## A plain server

Ubuntu 24.04 is used below. On another distribution only the package manager line differs:
nothing here is Ubuntu-specific.

### 1. Install Node.js 22

The application needs Node.js 22 (`.nvmrc`, `package.json` `engines`) and nothing else --
no compiler, no Python, no system libraries beyond a base install. Ubuntu 24.04's own
`nodejs` package is older than that, so install the official build and verify its checksum:

```sh
sudo apt-get update
sudo apt-get install -y curl xz-utils ca-certificates

cd /tmp
curl -fsSLO https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt
tarball=$(grep -o 'node-v22[0-9.]*-linux-x64\.tar\.xz' SHASUMS256.txt | head -1)
curl -fsSLO "https://nodejs.org/dist/latest-v22.x/$tarball"
sha256sum --ignore-missing -c SHASUMS256.txt

sudo tar -xJf "$tarball" -C /usr/local --strip-components=1 \
  --exclude CHANGELOG.md --exclude LICENSE --exclude README.md
node --version    # v22.x
npm --version
```

This puts `node` at `/usr/local/bin/node`, which is the path the systemd unit names. Any
other way of getting Node.js 22 (a distribution package, `nvm`) works just as well; then
correct `ExecStart` in the unit to the path `command -v node` prints.

### 2. Build the application

Build where you like -- on the server, or on a workstation, and copy the result over. The
build reads the committed lockfile, so it installs the same packages either way.

```sh
sudo apt-get install -y git
git clone https://github.com/IdseVal/ELSA-Decisiontree.git /tmp/elsa-src
cd /tmp/elsa-src

# The build, not only the server, must phone nobody: without this the framework's build
# reports anonymous usage to its own service. The systemd unit and the Dockerfile set it
# for what they run; a build by hand is the one place it has to be typed.
export NEXT_TELEMETRY_DISABLED=1

npm ci
npm run build
```

`npm run build` writes the self-contained server to `.next/standalone/` and copies the
stylesheet and the client bundle in beside it, and carries `trees/` as the seed. That folder plus a data directory is the whole
deployment: it carries its own `node_modules`, and nothing runs `npm` again on the server.

Check the Tree you are about to serve while you still have the checkout -- the server
refuses to start on a Tree that does not validate, so an unchecked Tree is an outage:

```sh
npm run validate trees/ai-act-applicability-agrifood
```

It prints `valid`. This Tree was written before `elsa-tree/2` limited how long every text
may be, and did not validate until issue #44 cut it to those limits; what that cut changed
is recorded in `trees/ai-act-applicability-agrifood/NOTES.md` section 10.

### 3. Put it on the server

```sh
sudo useradd --system --home-dir /opt/elsa-decisiontree --shell /usr/sbin/nologin elsa

sudo rm -rf /opt/elsa-decisiontree/app
sudo mkdir -p /opt/elsa-decisiontree
sudo cp -r /tmp/elsa-src/.next/standalone /opt/elsa-decisiontree/app

# The service reads the application and writes none of it.
sudo chown -R root:root /opt/elsa-decisiontree/app
sudo chmod -R go-w /opt/elsa-decisiontree/app

# The data directory: the one folder the service writes, and so the one it owns. Created
# empty; the first start fills it from the seed. Never inside app/, which a release replaces.
sudo mkdir -p /opt/elsa-decisiontree/data
sudo chown elsa:elsa /opt/elsa-decisiontree/data
sudo chmod 0750 /opt/elsa-decisiontree/data
```

> The build traces a copy of `trees/` into `.next/standalone/`, so
> `/opt/elsa-decisiontree/app/trees` exists. That is the **seed**: `ELSA_SEED_DIR` defaults
> to `trees` under the working directory, and the unit's working directory is `app/`. It is
> read at the first start only, to fill `data/trees/`; after that, what is served is the
> data directory's, and a release that replaces `app/` changes no Tree.

### 4. Configure it

```sh
sudo cp /tmp/elsa-src/deploy/elsa-decisiontree.env.example /etc/elsa-decisiontree.env
# [#135] Readable by root alone: at the first start it holds the administrator's password.
# systemd reads it as root before it drops to the elsa user, so the service needs no more.
sudo chown root:root /etc/elsa-decisiontree.env
sudo chmod 0600 /etc/elsa-decisiontree.env
sudoedit /etc/elsa-decisiontree.env     # set ELSA_DATA_DIR, ELSA_BASE_URL and ELSA_ADMIN_PASSWORD
```

**[#135]** The file holds one secret, `ELSA_ADMIN_PASSWORD`, and only until the first start
has run: remove the line then ([the administrator and the login](#the-administrator-and-the-login)).

### 5. Run it as a service

```sh
sudo cp /tmp/elsa-src/deploy/elsa-decisiontree.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now elsa-decisiontree

systemctl status elsa-decisiontree
journalctl -u elsa-decisiontree -n 20
```

The first start prints `administrator password set from ELSA_ADMIN_PASSWORD; remove the
variable` -- **[#135]** do so now: `sudoedit /etc/elsa-decisiontree.env`, delete the line,
`sudo systemctl restart elsa-decisiontree` -- and one `Seeded Tree "<id>" from .../trees` line
per Tree it imported, each owned by the administrator.
Every start then prints one `Serving Tree "<id>" (en, nl)` line per Tree served, and
`Reached at https://elsa.example.org` when `ELSA_BASE_URL` is set. A published Tree that
fails validation is **not served, and the others are**: its broken rules are printed after
`Not serving, published but invalid:`, and it answers 404 everywhere until it is fixed. A
data directory the server cannot use prints why, and the unit restarts every 5 seconds
until the reason is fixed ([when it does not start](#when-it-does-not-start)).

The unit (`deploy/elsa-decisiontree.service`) runs `node server.js` as the unprivileged
`elsa` user, restarts on failure, and starts at boot. It uses systemd and nothing else.

Check it answers:

```sh
curl -sI http://127.0.0.1:3000/                       # 200: the overview of every Tree (/?lang=nl in Dutch)
curl -sI http://127.0.0.1:3000/ai-act-applicability-agrifood   # 307 to the Tree's root Node
curl -s http://127.0.0.1:3000/ai-act-applicability-agrifood/start | head -20
```

### 6. TLS, through a reverse proxy

The application speaks plain HTTP on loopback and knows nothing about what is in front of
it. Any reverse proxy will do; two examples, neither of them a hosting service.

**nginx**, with a certificate from any ACME client (certbot, acme.sh, ...):

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name elsa.example.org;

    ssl_certificate     /etc/letsencrypt/live/elsa.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/elsa.example.org/privkey.pem;

    # The application stores nothing about its readers (docs/CORE_DOCUMENT.md section 8).
    # An access log would be the one place their addresses are kept, so it is off here;
    # turn it on deliberately and for a stated reason, or not at all.
    access_log off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name elsa.example.org;
    return 308 https://$host$request_uri;
}
```

**Caddy**, which obtains and renews the certificate itself:

```caddy
elsa.example.org {
    log {
        output discard
    }
    reverse_proxy 127.0.0.1:3000
}
```

Set `ELSA_BASE_URL=https://elsa.example.org` to match, and restart the service.

Both examples pass **every** path through, which includes the dataset: `location /` and
`reverse_proxy` are not path lists, so nothing has to be added for the routes below.

Two things a proxy in front of this application must not do: shorten the request path (a
share link carries the whole Trail and may reach about 3.3 kB, within the defaults of both
proxies above), and add a cookie of its own.

**[#135] The login needs HTTPS in front of the process.** The session cookie is `Secure`
(`application.md` 20.4): a browser keeps it only from an `https://` address -- or from
`localhost` and `127.0.0.1`, which browsers treat as secure. At `http://<server>:3000` from
another machine the login answers 204 and the browser drops the cookie, so every page shows
the login form again, and nothing says why. The proxy above is what makes `/admin` work; the
flag never comes off. The proxy must also pass the browser's `Origin` and `Sec-Fetch-Site`
headers through unchanged (both examples do): every write under `/admin` is refused with
403 without them (`application.md` 20.6).

### The administrator and the login

**[#135]** The admin area is `https://<your host>/admin`. A visitor without a session sees
the login page at whatever `/admin` address they asked for, and lands on it once logged in.

1. **The first start** creates the account `admin` with the password `ELSA_ADMIN_PASSWORD`
   gives it ([step 4](#4-configure-it)). Log in at `/admin` with the name `admin`.
2. **Remove the variable** from `/etc/elsa-decisiontree.env` and restart. While it is set,
   every start sets the password back to it, over one changed at `/admin/account`.
3. **Every other account** is made by the administrator at `/admin/accounts`: a display
   name, a login name (lowercase letters, digits and single hyphens) and a first password
   of 12 to 256 characters, handed over out of band. The holder changes it at
   `/admin/account`. There is no self-registration, no mail and no reset by mail: a
   forgotten password is set again by the administrator on the same page.
4. **An account is deactivated, never deleted**: it cannot log in, its sessions end at once,
   and the Trees it made stay. The administrator cannot be deactivated.
5. **A lost administrator password**: set `ELSA_ADMIN_PASSWORD` again, restart, log in,
   remove it, restart.

Five wrong passwords for one name lock that name for 15 minutes; more than 60 failed logins
in a minute across all names lock the login for one minute. Both answer 429 and the page
says "Too many attempts". A session ends after 12 hours without a request, and after 14
days in any case; logging out ends it at once.

The journal gets `account <id> logged in`, `login failed for account <id>` or `... for an
unknown name`, the locks, the logouts and every account change, by account id. Never a
password, a token, a name typed into the login form, or a client address.

### The dataset is public

**[#121]** A deployment serves every published Tree as a dataset as well as a walk, at
`https://<your host>/<tree-id>/tree.json` -- the Tree file itself, byte for byte, under
CC BY 4.0, with the licence in a `Link` header on the bytes and `Access-Control-Allow-Origin: *`
so another lab's page or a notebook can fetch it (`docs/specs/application.md` 15). The
format's JSON Schema is beside it at `/schemas/elsa-tree-4.json`, and `/llms.txt` is the
short plain-text description that points an AI agent at every Tree's and at the schema. A
Tree that is not published is in none of them: its `tree.json`, its pages and its pictures
answer 404, the same answer as an id that does not exist.

Nothing needs configuring for any of this, and there is nothing to turn off: the data was
already public in the repository, the routes set no cookie, and what they serve is the
file the server validated at start. A proxy that strips response headers it does not
recognise would take the licence off the bytes, so leave `Link` alone.

---

## A container

The `Dockerfile` in the repository root runs the same `npm ci && npm run build` and starts
the same `node server.js`. It is optional: it exists for a host where a container is easier
to keep than a systemd unit, and it introduces no dependency on one -- the base image is
the Docker official Node.js image, and the result runs under any OCI runtime.

```sh
docker build -t elsa-decisiontree .

docker run -d --name elsa \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v elsa-data:/data \
  -e ELSA_DATA_DIR=/data \
  -e ELSA_BASE_URL=https://elsa.example.org \
  --env-file /etc/elsa-admin.env \
  elsa-decisiontree

docker logs elsa
curl -s http://127.0.0.1:3000/ai-act-applicability-agrifood/start | head -20
```

`--restart unless-stopped` is what the systemd unit's `Restart=always` is. TLS is the same
reverse proxy as above, pointed at the published port.

**[#135]** `/etc/elsa-admin.env` is a `0600` file holding the one line
`ELSA_ADMIN_PASSWORD=...`, so the password is not in the shell's history or on the command
line. Only the first run needs it: once `docker logs elsa` shows `administrator password set
from ELSA_ADMIN_PASSWORD; remove the variable`, re-create the container without
`--env-file` (the volume keeps the account). A container's environment cannot be edited in
place, and every restart of the same container would set the password back.

The volume is the data directory, and the container is disposable around it: removing
and re-running the container keeps every Tree. The image carries the Trees that were in the
repository when it was built as its seed, imported the first time the volume is empty. To
seed from other Trees, mount them and name them for that first run:

```sh
docker run -d --name elsa \
  -p 127.0.0.1:3000:3000 \
  -v elsa-data:/data -e ELSA_DATA_DIR=/data \
  -v /srv/elsa-trees:/seed:ro -e ELSA_SEED_DIR=/seed \
  elsa-decisiontree
```

A container build does not preserve the Tree file's modification time, so a Tree seeded
from the image reports the day the image was built in `/sitemap.xml`; one seeded from a
mounted folder keeps its own ([the date the sitemap reports](#the-date-the-sitemap-reports)).

---

## Changing, importing, moving and backing up a Tree

**[#136]** A Tree changes through the editor, not through the server's file system: its
creator and collaborators log in at `/admin`, every field they type is saved as they go into
the Tree's draft, and the Publish toggle copies a draft that validates in full to the public
`tree.json` -- at once, with no restart (`docs/specs/application.md` 19). While a Tree is
published, every save that leaves its draft valid reaches the public copy immediately; a save
that does not leaves the last valid copy in place until the draft is valid again. The process
is the data directory's only writer, so **never edit, copy or delete a file under
`ELSA_DATA_DIR` while the service runs** -- the running server would not see the change, and
its next write would replace it.

### What is in the data directory

```
/opt/elsa-decisiontree/data/          (ELSA_DATA_DIR)
├── lock                  the pid of the running server; a second one refuses to start
├── accounts.json         every account, with its password hash
├── sessions.json         the live login sessions, by the hash of their token
└── trees/<tree-id>/
    ├── meta.json         creator, collaborators, times, publish count, revision
    ├── draft.json        the draft the editor writes: the same elsa-tree/4 file, maybe unfinished
    ├── tree.json         the published copy; present exactly when the Tree is published
    ├── images/           every uploaded picture, the draft's and the published copy's
    └── theme/            the Theme's files
```

### What to back up

**The whole of `ELSA_DATA_DIR`, and nothing else**: the release in `app/` holds no state, and
the environment file is yours already. Every file in the directory is replaced atomically
(written beside itself and renamed over), so a copy taken while the service runs holds whole
files; at worst a `draft.json` is one save newer than its `meta.json`, which the store
tolerates. For a copy exact to the save, stop the service first.

```sh
# Running: every file in the archive is whole.
sudo tar -C /opt/elsa-decisiontree -czf /var/backups/elsa-data-$(date +%F).tar.gz data

# Restore: stop, put the folder back, start.
sudo systemctl stop elsa-decisiontree
sudo rm -rf /opt/elsa-decisiontree/data
sudo tar -C /opt/elsa-decisiontree -xzf /var/backups/elsa-data-2026-09-26.tar.gz
sudo chown -R elsa:elsa /opt/elsa-decisiontree/data
sudo systemctl start elsa-decisiontree
```

`accounts.json` and `sessions.json` hold password hashes and session-token hashes: keep the
backup where only an administrator can read it, as you keep `/etc/elsa-decisiontree.env`.

### Importing a Tree, and moving one between deployments

A Tree that arrives as a folder -- another lab's, a repository Tree after the first start, a
Tree from another deployment -- is imported with one command, run from a checkout with **the
service stopped** and `ELSA_DATA_DIR` naming the data directory:

```sh
cd /tmp/elsa-src
npm run validate trees/ai-act-applicability-agrifood      # must print "valid"

sudo systemctl stop elsa-decisiontree
sudo -u elsa env ELSA_DATA_DIR=/opt/elsa-decisiontree/data \
  npm run store -- import /tmp/elsa-src/trees/ai-act-applicability-agrifood
sudo systemctl start elsa-decisiontree
journalctl -u elsa-decisiontree -n 5      # "Serving Tree ..." for the imported Tree
```

The folder's name is the Tree's id. The command copies `tree.json`, `images/` and `theme/`,
writes a `draft.json` that is a byte copy of `tree.json` and a `meta.json` naming **this
deployment's administrator** as the creator, and the Tree is published from the next start.
It refuses -- exit code 1, nothing written -- an id the data directory already has, a
reserved id (`images`, `theme`, `schemas`, `admin`) and a Tree that does not validate in full,
printing every violation. To replace a Tree that exists, delete it in the admin area first
(unpublish, then delete) and import the new folder.

**To move a Tree from one deployment to another**, copy three things out of the source's
`trees/<tree-id>/` -- `tree.json`, `images/` and `theme/` -- into a folder named `<tree-id>`,
and import that folder on the other side:

```sh
# On the source (running or not: each file is whole).
mkdir -p /tmp/move/my-tree
cp -p  /opt/elsa-decisiontree/data/trees/my-tree/tree.json /tmp/move/my-tree/
cp -rp /opt/elsa-decisiontree/data/trees/my-tree/images    /tmp/move/my-tree/ 2>/dev/null || true
cp -rp /opt/elsa-decisiontree/data/trees/my-tree/theme     /tmp/move/my-tree/ 2>/dev/null || true
# ... carry /tmp/move/my-tree to the target, then import it there as above.
```

`draft.json` and `meta.json` stay behind: the draft is its authors' unpublished work, and
`meta.json` names accounts of the source deployment, which mean nothing on the target. What
moves is the published Tree; on the target its creator is the administrator, who hands it
over to the right account in the admin area. The copy may carry pictures only the source's
draft named; the next publish on the target deletes the ones its copy does not name.

## Putting a new version of the application on the server

```sh
cd /tmp/elsa-src && git pull
export NEXT_TELEMETRY_DISABLED=1     # as in step 2: a build by hand must phone nobody
npm ci && npm run build

sudo rm -rf /opt/elsa-decisiontree/app
sudo cp -r /tmp/elsa-src/.next/standalone /opt/elsa-decisiontree/app
sudo chown -R root:root /opt/elsa-decisiontree/app
sudo systemctl restart elsa-decisiontree
```

`data/` is untouched by this: a release replaces the application folder and the service
writes the data folder, which is why they are two folders. The new release's `trees/` is
not read again; it only seeds a data directory that is still empty.

## Checking what the deployment sends

The application sets no cookie and fetches nothing from a third party -- no font, no
script, no analytics (`docs/CORE_DOCUMENT.md` section 8). Both are worth re-checking on a
running deployment, because both would arrive by accident rather than on purpose:

```sh
# No cookie, on a page or on an image.
curl -sD - -o /dev/null http://127.0.0.1:3000/ai-act-applicability-agrifood/start | grep -i set-cookie
# (no output)

# No cookie on the overview either.
curl -sD - -o /dev/null http://127.0.0.1:3000/ | grep -i set-cookie
# (no output)

# [#135] The one cookie is the login's, kept to /admin with every flag. The Origin is what
# a browser sends; without it the write is refused (403).
curl -sD - -o /dev/null -X POST http://127.0.0.1:3000/admin/api/login \
  -H 'Origin: https://elsa.example.org' -H 'Content-Type: application/json' \
  -d '{"login":"admin","password":"<the administrator password>"}' | grep -i set-cookie
# set-cookie: elsa-admin-session=...; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=1209600

# Every address the page points a browser at. Only paths on this server appear
# (/_next/..., /<tree-id>/images/...). The eur-lex.europa.eu links are Sources: a link a
# reader may click, never something the page fetches.
curl -s http://127.0.0.1:3000/ai-act-applicability-agrifood/start \
  | grep -oE '(src|href)="[^"]*"' | sort -u
```

`npm run test:browser` asserts both in a real browser
(`tests/browser/deployment.spec.ts`): it walks the app and fails if any cookie is set or if
the browser asks any host but the one serving the page. **[#135]** It then logs in, walks
every public route again, and fails if the browser sent the session cookie to any of them
or any answered a cookie: `Path=/admin` keeps it in the admin area. That the app writes nothing to the
reader's local or session storage is asserted by the walks in `tests/browser/`.

## When it does not start

`journalctl -u elsa-decisiontree -n 50` has the reason; the server says exactly one of:

| Message | Meaning |
|---|---|
| `ELSA_DATA_DIR is not set: ...` | The environment file was not read, or the variable is missing. |
| `ELSA_DATA_DIR=... is not a folder` | The folder was not created, or the path is mistyped. A production server never creates it, so a typo is a server that does not start rather than an empty store somewhere else. |
| `ELSA_DATA_DIR=... cannot be written` | The folder is not owned by `elsa` (step 3). |
| `ELSA_DATA_DIR=... is in use by process N; one process per data directory` | A second copy of the service, or a container, has the same folder open. A lock left by a process that is gone is taken over by itself. |
| `ELSA_TREE is set, and is retired: ...`, and the same for `ELSA_TREES_DIR` and `ELSA_TREE_LASTMOD` | **[#134]** A 1.0 environment file. Remove the line; the message names what replaced it. |
| `ELSA_ADMIN_PASSWORD is not set and there is no administrator: ...` | **[#135]** A first start, or a data directory whose `accounts.json` was removed. Set the variable for one start ([step 4](#4-configure-it)). |
| `ELSA_ADMIN_PASSWORD must be 12 to 256 characters` | **[#135]** The password is too short or too long. |
| `ELSA_BASE_URL=... is not an absolute URL` | The base URL has no scheme -- `elsa.example.org` rather than `https://elsa.example.org`. |
| `ELSA_BASE_URL=...: only http and https are served` | The base URL names another scheme. |
| `ELSA_BASE_URL=... must be a bare origin` | The base URL carries a path, a query or a fragment. |
| `EADDRINUSE` | Another process holds `PORT`. |

A broken Tree no longer stops the server. The start prints `Not serving, published but
invalid:` and then the Tree's broken rules, one `<tree>  <node-id>  key  V-RULE  message`
line each -- the list `npm run validate <folder>` prints from the checkout -- and serves
every other Tree. `Not seeded: ...` at a first start is the same for a seed folder.

Everything else is in the same journal: the process logs to standard output, which systemd
collects.
