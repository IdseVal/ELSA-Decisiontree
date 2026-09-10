# Deploying the ELSA decision tree on a plain Linux server

> Written for issue #11. Every command below was run on a clean `ubuntu:24.04` container;
> what was measured is in the pull request that added this file.

The application is **one Node.js process reading files from a folder**. It has no
database, no queue, no object store, no build service and no runtime that belongs to a
hosting vendor: a Wageningen University machine and a Hetzner box are the same machine to
it (`docs/CORE_DOCUMENT.md` section 7). Moving it is copying two folders and setting five
environment variables.

Two ways are documented, and they run the same build:

- [**A plain server**](#a-plain-server) -- Node.js, a systemd unit, a reverse proxy for TLS.
- [**A container**](#a-container) -- the same thing inside the `Dockerfile` in the
  repository root, for a host where a container is easier to keep.

The shape on disk, for both:

```
/opt/elsa-decisiontree/
|-- app/     the built application: server.js, .next/, node_modules/  (replaced by a release)
`-- trees/   the Tree data: one folder per Tree                       (replaced by an author)
/etc/elsa-decisiontree.env    the configuration
```

---

## Configuration

Everything a deployment decides is an environment variable. There is no configuration file
in the application and nothing to edit in the source.

| Variable | Required | Meaning |
|---|---|---|
| `ELSA_TREE` | **yes** | The Tree this deployment serves: the folder name under `ELSA_TREES_DIR`. There is no default; the server refuses to start without it, listing the Tree ids it did find. One deployment serves exactly one Tree (`docs/specs/application.md` section 2). |
| `ELSA_TREES_DIR` | no | Where the Tree folders live. Defaults to `trees` under the working directory. |
| `ELSA_BASE_URL` | no | The address readers reach this deployment at, e.g. `https://elsa.example.org` -- the reverse proxy's address, not the one the process listens on. It must be a bare origin: `http` or `https`, no path, no query. See [share links and the base URL](#share-links-and-the-base-url). |
| `PORT` | no | The TCP port the process listens on. Defaults to 3000. |
| `HOSTNAME` | no | The address it listens on. Defaults to `0.0.0.0`. Behind a reverse proxy set `127.0.0.1`, so nothing but the proxy can reach the process. |
| `NODE_ENV` | no | `production` in a deployment. |
| `NEXT_TELEMETRY_DISABLED` | no | `1` in every environment: the framework must phone nobody. |

All of the application's settings take effect **when the process starts**. There is no
reload: change the file, restart the service.

`deploy/elsa-decisiontree.env.example` is this table as a file to copy.

### Share links and the base URL

A share link is the reader's own address bar (`docs/specs/application.md` 4.1): the share
button copies the URL the browser is showing, so it is the public URL whatever sits in
front of the server, and it needs no configuration to be right.

`ELSA_BASE_URL` is for the one absolute URL the *server* writes about a page: the
`<link rel="canonical">` in its `<head>`, which tells a search engine that one Node has one
address whatever Trail led to it. Without the variable that link stays a path
(`/<tree-id>/<node-id>`), which every browser resolves correctly; with it the link is the
full public URL.

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
stylesheet and the client bundle in beside it. That folder plus `trees/` is the whole
deployment: it carries its own `node_modules`, and nothing runs `npm` again on the server.

Check the Tree you are about to serve while you still have the checkout -- the server
refuses to start on a Tree that does not validate, so an unchecked Tree is an outage:

```sh
npm run validate trees/ai-act-applicability-agrifood
```

**This Tree does not validate yet.** `elsa-tree/2` limits how long every text may be, and
this Tree was written before the limits existed, so the command above prints its violations
and the server refuses to serve it until issue #44 has cut the content
(`trees/ai-act-applicability-agrifood/NOTES.md` section 10). Until then set
`ELSA_TREE=ai-act-example`, which validates, wherever this guide says the first Tree's id.

### 3. Put it on the server

```sh
sudo useradd --system --home-dir /opt/elsa-decisiontree --shell /usr/sbin/nologin elsa
sudo mkdir -p /opt/elsa-decisiontree/trees

sudo rm -rf /opt/elsa-decisiontree/app
sudo cp -r /tmp/elsa-src/.next/standalone /opt/elsa-decisiontree/app

# The contents of trees/, not the folder: `cp -r .../trees /opt/elsa-decisiontree/trees`
# copies the folder *into* the target on a second run and leaves a trees/trees that
# ELSA_TREES_DIR does not point at. This line may be re-run, and a reinstall is a re-run.
# It is not guarded by `rm -rf` the way app is, because a Tree that is not in the
# repository lives in this folder too.
sudo cp -r /tmp/elsa-src/trees/. /opt/elsa-decisiontree/trees/

# The service reads these files and writes none of them.
sudo chown -R root:root /opt/elsa-decisiontree
sudo chmod -R go-w /opt/elsa-decisiontree
```

> The build also traces a copy of `trees/` into `.next/standalone/`, so
> `/opt/elsa-decisiontree/app/trees` exists as well. It is not what is served:
> `ELSA_TREES_DIR` decides, and it names `/opt/elsa-decisiontree/trees` -- the folder an
> author replaces, outside the folder a release replaces.

### 4. Configure it

```sh
sudo cp /tmp/elsa-src/deploy/elsa-decisiontree.env.example /etc/elsa-decisiontree.env
sudo chmod 0644 /etc/elsa-decisiontree.env
sudoedit /etc/elsa-decisiontree.env     # set ELSA_TREE and ELSA_BASE_URL
```

The file holds no secret -- the application has none -- so it needs no special protection.

### 5. Run it as a service

```sh
sudo cp /tmp/elsa-src/deploy/elsa-decisiontree.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now elsa-decisiontree

systemctl status elsa-decisiontree
journalctl -u elsa-decisiontree -n 20
```

A healthy start prints one line -- `Serving Tree "ai-act-applicability-agrifood" (en, nl)
at https://elsa.example.org`. A refusal prints why (the Tree ids it found, or every broken
rule of the Tree) and the unit restarts every 5 seconds until the reason is fixed.

The unit (`deploy/elsa-decisiontree.service`) runs `node server.js` as the unprivileged
`elsa` user, restarts on failure, and starts at boot. It uses systemd and nothing else.

Check it answers:

```sh
curl -sI http://127.0.0.1:3000/                       # 307 to the Tree's root Node
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

Two things a proxy in front of this application must not do: shorten the request path (a
share link carries the whole Trail and may reach about 3.3 kB, within the defaults of both
proxies above), and add a cookie of its own.

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
  -e ELSA_TREE=ai-act-applicability-agrifood \
  -e ELSA_BASE_URL=https://elsa.example.org \
  elsa-decisiontree

docker logs elsa
curl -s http://127.0.0.1:3000/ai-act-applicability-agrifood/start | head -20
```

`--restart unless-stopped` is what the systemd unit's `Restart=always` is. TLS is the same
reverse proxy as above, pointed at the published port.

The image carries the Trees that were in the repository when it was built. To serve a Tree
without rebuilding, mount a folder over them:

```sh
docker run -d --name elsa \
  -p 127.0.0.1:3000:3000 \
  -v /srv/elsa-trees:/app/trees:ro \
  -e ELSA_TREE=my-tree \
  elsa-decisiontree
```

---

## Putting a new version of a Tree on the server

Tree content is files, and a running server holds the Tree it read at start. Publishing a
new version is: validate, copy, restart.

```sh
# On the machine with the checkout -- the server refuses to start on a Tree that does not
# validate, and finding that out on the server means downtime.
cd /tmp/elsa-src && git pull
npm run validate trees/ai-act-applicability-agrifood   # must print "valid" before you copy

# Copy the folder, then restart. --delete so a Node the author removed is removed here too.
sudo apt-get install -y rsync
sudo rsync -a --delete \
  /tmp/elsa-src/trees/ai-act-applicability-agrifood/ \
  /opt/elsa-decisiontree/trees/ai-act-applicability-agrifood/
sudo chown -R root:root /opt/elsa-decisiontree/trees

sudo systemctl restart elsa-decisiontree
journalctl -u elsa-decisiontree -n 5      # "Serving Tree ..." means the new version is up
```

The restart takes well under a second and costs no reader their place: the whole state of
the application is in the URL, so a reload lands on the same page.

To serve a Tree that is not in the repository -- another lab's -- put its folder in
`/opt/elsa-decisiontree/trees/` and name it in `ELSA_TREE`.

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

`trees/` is untouched by this: the application folder and the data folder are replaced by
different people at different times, which is why they are two folders.

## Checking what the deployment sends

The application sets no cookie and fetches nothing from a third party -- no font, no
script, no analytics (`docs/CORE_DOCUMENT.md` section 8). Both are worth re-checking on a
running deployment, because both would arrive by accident rather than on purpose:

```sh
# No cookie, on a page or on an image.
curl -sD - -o /dev/null http://127.0.0.1:3000/ai-act-applicability-agrifood/start | grep -i set-cookie
# (no output)

# Every address the page points a browser at. Only paths on this server appear
# (/_next/..., /images/...). The eur-lex.europa.eu links are Sources: a link a reader may
# click, never something the page fetches.
curl -s http://127.0.0.1:3000/ai-act-applicability-agrifood/start \
  | grep -oE '(src|href)="[^"]*"' | sort -u
```

`npm run test:browser` asserts both in a real browser
(`tests/browser/deployment.spec.ts`): it walks the app and fails if any cookie is set or if
the browser asks any host but the one serving the page. That the app writes nothing to the
reader's local or session storage is asserted by the walks in `tests/browser/`.

## When it does not start

`journalctl -u elsa-decisiontree -n 50` has the reason; the server says exactly one of:

| Message | Meaning |
|---|---|
| `ELSA_TREE is not set. Tree ids found in ...` | The environment file was not read, or the variable is missing. |
| `ELSA_TREE=x: ... is not a folder. Tree ids found in ...` | `ELSA_TREES_DIR` points somewhere else, or the Tree was not copied. |
| `ELSA_TREE=images is a reserved word` | `images` is the image route's path segment; a Tree cannot be called that. |
| `<tree>  <node-id>  key  V-RULE  message`, one line per broken rule | The Tree is broken. `npm run validate <folder>` prints the same list from the checkout. |
| `ELSA_BASE_URL=... is not an absolute URL` | The base URL has no scheme -- `elsa.example.org` rather than `https://elsa.example.org`. |
| `ELSA_BASE_URL=...: only http and https are served` | The base URL names another scheme. |
| `ELSA_BASE_URL=... must be a bare origin` | The base URL carries a path, a query or a fragment. |
| `EADDRINUSE` | Another process holds `PORT`. |

Everything else is in the same journal: the process logs to standard output, which systemd
collects.
