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

1. **Survey the box** (read-only): confirm the facts below, which come from the other
   project's runbook and not yet from the machine: the proxy, the Node.js version against
   this application's `>=22.18`, the ports in use, the firewall, where the backups go.
2. **`bootstrap.sh`**, then the Caddy block and the first `deploy.sh` of `dev`, to the
   placeholder domain; verify the login over HTTPS and one Tree end to end; remove the two
   `ELSA_ADMIN_` lines from the env file and restart.
3. **Add the workflow's secrets, variable and tailnet rule**; run the workflow by hand from
   `dev` and see it deploy the same commit.
4. **Merge `dev` into `main`** (the owner), and watch the push deploy.
5. **Add `/srv/elsa/data` to the box's backup**, and note here where the backups go.

What the owner provides: a login on the box over the tailnet for the one who does steps 1
to 3 (or runs them from the printed commands), the placeholder domain with its A record
pointing at the box, the e-mail address the administrator of that deployment logs in with (a
value only the owner chooses; see `deployment.md`, `ELSA_ADMIN_EMAIL`), and the Tailscale
OAuth client of step 3.

## Facts learned

_Recorded while deploying. Dates, no secrets._

| Date | Fact |
|---|---|
| 2026-10-10 | From the other project's runbook, to confirm on the box: Ubuntu 24.04; Caddy is the only thing on 80 and 443 and terminates TLS; the other project's API listens on 127.0.0.1:8000 and its PostgreSQL on a local socket; systemd units and timers run it; the firewall denies incoming except 80, 443 and the tailnet interface; SSH is Tailscale SSH with no public port, password login and root login off; Node.js came from the distribution or NodeSource at 20 or later, so 22.18 is not guaranteed; backups are nightly database dumps under `/var/backups/`, copied off the machine. |
| 2026-10-10 | The other project deploys by hand (pull, install, build, restart); it has no deploy workflow, so this application's is the first thing on the box that GitHub drives. |
| 2026-10-10 | The box is on the owner's tailnet and answers Tailscale pings from the workstation, but the workstation refuses every outbound TCP connection to tailnet and LAN addresses at the socket level (`WSAEACCES`), from any process, while public addresses connect. Windows Firewall has no such rule; the third-party security suite's firewall is the suspect. Until that is lifted, steps 1 to 3 run from another machine or from the commands `bootstrap.sh` prints. |
