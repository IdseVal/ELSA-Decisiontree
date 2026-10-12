# Hosting the ELSA decision tree on the shared Hetzner box

> The plan the owner agreed to on 2026-10-09, and the facts learned while carrying it out.
> This file is about **one machine**: the Hetzner box that already hosts another project
> of ours, and will host this application beside it, each reached through its own domain.
> How the application itself is installed, configured, backed up and updated is in
> [`deployment.md`](deployment.md); this file only says what is particular to sharing that
> box, and records what was found there. It names no address, key or password: those live on
> the box and in the owner's hands, never in this public repository.

## What is decided

- **The box serves two websites, routed by domain.** The other project keeps its domain and
  its setup. This application answers on a second domain: first one of the owner's
  placeholder domains, later the domain project management buys. Switching domains is one
  DNS record, one line in the reverse proxy, and `ELSA_BASE_URL` in the env file.
- **The box deploys `main`.** `dev` is where the agents merge; the owner merges `dev` into
  `main` when the issue list is empty, and every push to `main` reaches the box. The demo
  server on the owner's workstation keeps serving `dev` as the staging copy.
- **The application is isolated from the other project** by the means the operating system
  has: its own user, its own folders, its own service, its own loopback port. The two
  projects cannot read each other's files or reach each other's processes; they share only
  the reverse proxy, which is the only thing listening on 80 and 443.
- **The box is reached over the tailnet only.** The other project's runbook closed SSH to
  the internet and opened it on Tailscale (`tailscale up --ssh`, firewall: 80 and 443 public,
  everything on the tailnet interface). This application keeps that: the deploy workflow
  joins the tailnet for the length of a run rather than asking the box for a public SSH port
  and this repository for a key.

## The shape on the box

Everything this application adds is under `deploy/shared-box/` in this repository, one file
per piece:

```
/srv/elsa/app/       the checkout, built in place by deploy.sh (owner: elsa)
/srv/elsa/current/   the standalone server the service runs: a copy deploy.sh swaps in whole
/srv/elsa/data/      ELSA_DATA_DIR -- the whole state; the one folder the backup needs
/srv/elsa/deploy.sh                      deploy/shared-box/deploy.sh: fetch, build, swap, restart, check
/etc/elsa-decisiontree.env               ELSA_DATA_DIR, ELSA_BASE_URL, PORT=3001, HOSTNAME=127.0.0.1;
                                         ELSA_ADMIN_EMAIL and ELSA_ADMIN_PASSWORD for the first start only
/etc/systemd/system/elsa-decisiontree.service        deploy/elsa-decisiontree.service, unchanged
/etc/systemd/system/elsa-decisiontree.service.d/shared-box.conf   deploy/shared-box/shared-box.conf:
                                         runs from /srv/elsa/current on the box's node
/etc/sudoers.d/elsa-decisiontree         deploy/shared-box/sudoers: elsa may restart its service, nothing else
/etc/caddy/Caddyfile                     + deploy/shared-box/Caddyfile.snippet: <this app's domain> ->
                                         127.0.0.1:3001, TLS from Let's Encrypt, X-Forwarded-Proto: https
                                         (the login cookie is Secure only then), no access log
```

Port 3001 rather than 3000 so that nothing collides with the other project if it uses the
Node default (its own API listens on 8000). The reverse proxy is Caddy, because that is what
the other project installed; the block in `Caddyfile.snippet` is the Caddy example of
[`deployment.md`](deployment.md) with the port changed. The other project runs from a
checkout under systemd, not in Docker, so this one does the same and the repository's
`Dockerfile` stays unused here.

`bootstrap.sh` does the one-time part (user, folders, clone, env file, unit, drop-in, sudoers,
`deploy.sh`) idempotently, from a checkout on the box, with the domain and the administrator's
address and first password given as environment variables. It prints the two steps it leaves to
the operator: appending the Caddy block, and the first `deploy.sh`.

## Deploying from `main`

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every push to `main`,
and by hand ("Run workflow") on any branch, where it deploys that branch's commit:

1. the runner joins the tailnet as an ephemeral node (`tailscale/github-action`), tagged
   `tag:ci`, with an OAuth client kept as two repository secrets;
2. it logs in to the box over Tailscale SSH as the `elsa` user, which the tailnet's policy lets
   it do and nothing else, and runs `/srv/elsa/deploy.sh <commit>`;
3. the script fetches that commit into `/srv/elsa/app`, runs `npm ci` and `npm run build`,
   copies the standalone folder next to `/srv/elsa/current` and swaps it in, restarts the
   service through the one sudoers line, then asks `http://127.0.0.1:3001/` and fails the job
   unless the answer is 200, printing the service's log if not;
4. the first start seeds the repository's Trees; every later start keeps the data directory
   and converts its files to a newer format when a release carries one, as the demo server
   did on 2026-10-03 (`elsa-tree/4` to `/5`) and on 2026-10-10 (`/5` to `/6`).

A rollback is the same workflow run by hand from the commit to go back to, or
`sudo -u elsa -H /srv/elsa/deploy.sh <commit>` on the box. Nothing on the box needs the
agents, Claude, or any GitHub credential: the checkout pulls a public repository.

What the workflow needs, set once by the owner: in the Tailscale admin console an OAuth
client with the `auth_keys` write scope for `tag:ci` (secrets `TS_OAUTH_CLIENT_ID`,
`TS_OAUTH_SECRET`), `tag:ci` under `tagOwners` in the tailnet policy, an `ssh` rule there
letting `tag:ci` reach the box as `elsa` with `action: accept`, and the repository variable
`ELSA_BOX_HOST` with the box's tailnet name. The alternative, a public SSH port with a deploy
key, needs none of that and a firewall change on the box instead; it was not chosen because
the box is closed to the internet on purpose.

## Order of work

1. ~~Survey the box~~ (2026-10-10, below).
2. ~~`bootstrap.sh`, the Caddy block, the first `deploy.sh` of `dev`~~ (2026-10-10: the site answers
   at the placeholder domain over HTTPS, the administrator logs in with a `Secure` cookie, the
   two `ELSA_ADMIN_` lines are removed again).
3. **Add the workflow's secrets and tailnet rule** (the owner; the variable `ELSA_BOX_HOST` is
   set); run the workflow by hand from `dev` and see it deploy the same commit.
4. **Merge `dev` into `main`** (the owner), and watch the push deploy.
5. ~~Add `/srv/elsa/data` to the box's backup~~ (2026-10-10: nightly on the box, below); copying
   the backups off the machine is still to do, for both projects.

What the owner provides for step 3: the Tailscale OAuth client (secrets `TS_OAUTH_CLIENT_ID`
and `TS_OAUTH_SECRET`) and, in the tailnet policy, `tag:ci` under `tagOwners` and an `ssh`
rule letting `tag:ci` reach the box as `elsa` with `action: accept`.

## Facts learned

_Recorded while deploying. Dates, no secrets._

| Date | Fact |
|---|---|
| 2026-10-10 | The box: Ubuntu 24.04.4, 2 vCPU, 3.7 GiB, 38 GB disk with 32 GB free, up since early September. Caddy 2.11 is the only thing on 80 and 443 and terminates TLS, with an admin socket on loopback 2019 and a tailnet-only listener on 8080 for the other project. The other project: gunicorn on 127.0.0.1:8000, PostgreSQL 16 on a local socket, one service (`plt-api`), a checkout under `/srv/plt` with a `deploy.sh` of the same shape as ours, run by hand. No Docker. The firewall denies incoming except 80, 443 and everything on the tailnet interface. |
| 2026-10-10 | There is no OpenSSH on the box at all: SSH is Tailscale SSH (Tailscale 1.102), and the tailnet policy allows `root` after a browser check that holds 12 hours, and refuses other user names until a rule names them. So the deploy workflow's route over the tailnet is the only route, and the `elsa` user needs its own `ssh` rule before the workflow can log in. The `sudo` group is empty: the operator is root. |
| 2026-10-10 | Node.js on the box is 20.20 from NodeSource, which the other project needs (`>=20`). This application needs `>=22.18`, so `bootstrap.sh` installed Node 22.23.3 under `/srv/elsa/node` for this service alone, from the official tarball checked against its SHASUMS256.txt; the box's Node is untouched. A root shell there has umask 077: the first install left that folder unreadable to `elsa`, `node` fell back to Node 20 and the build failed in `postbuild`; `bootstrap.sh` now sets the ownership and mode itself. |
| 2026-10-10 | The box had no swap. A 2 GiB swap file was added (`/swapfile`, in `/etc/fstab`) before the first build: a Next.js build beside PostgreSQL and gunicorn on 3.7 GiB has little headroom. The build then took under a minute. |
| 2026-10-10 | First deploy of `dev` done by hand: `bootstrap.sh`, the Caddy block appended (the previous Caddyfile kept beside it as `Caddyfile.before-elsa-2026-10-10`), `deploy.sh dev`. The first start seeded the two Trees and created the administrator from the two env lines, which were then removed and the service restarted. Certificates for the bare domain and `www` came at once. Checked from outside: 200 on the bare domain, 301 from `www`, 308 from plain HTTP, `robots.txt` names the HTTPS sitemap; a login over HTTPS answers 204 with a `Secure` session cookie, and the logout 204. |
| 2026-10-10 | The other project's runbook promises nightly database dumps under `/var/backups/`; nothing there does it yet (only `dpkg` backups). For this application `/etc/cron.d/elsa-backup` writes `/var/backups/elsa/elsa-data-<date>.tar.gz` at 03:15 every night and keeps 30; a first copy was taken right after the deploy. Nothing copies them off the machine yet. |
| 2026-10-10 | The owner's workstation could not reach the box for a morning because a VPN that starts with Windows refused every connection to tailnet and LAN addresses (`WSAEACCES`); turned off, everything connected. Noted so the next person does not look at the box's firewall first. |
