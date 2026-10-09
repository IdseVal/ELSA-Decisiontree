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

## The shape on the box

```
/srv/elsa/app/      the checkout of main, built in place (owner: elsa)
/srv/elsa/data/     ELSA_DATA_DIR -- the whole state; the one folder the backup needs
/etc/elsa-decisiontree.env   ELSA_DATA_DIR, ELSA_BASE_URL, PORT=3001, HOSTNAME=127.0.0.1;
                             ELSA_ADMIN_EMAIL and ELSA_ADMIN_PASSWORD for the first start only
systemd: elsa-decisiontree.service   node server.js as `elsa`, 127.0.0.1:3001, restarts on failure
reverse proxy: one virtual host     <this app's domain> -> 127.0.0.1:3001, TLS from Let's Encrypt,
                                     X-Forwarded-Proto: https (the login cookie is Secure only then)
```

Port 3001 rather than 3000 so that nothing collides with the other project if it uses the
Node default. If the other project runs in Docker, this application runs from the
repository's `Dockerfile` instead, with `/srv/elsa/data` mounted as its volume and the same
env file passed with `--env-file`; the proxy line is the same. Which of the two is decided
by what is on the box (step 1 below) and recorded here.

## Deploying from `main`

A GitHub Actions workflow in this repository, `deploy.yml`, runs on every push to `main`:

1. connects to the box over SSH with a deploy key kept as a repository secret, as the `elsa`
   user, which can do nothing on the box but this;
2. runs `/srv/elsa/deploy.sh`: `git pull --ff-only`, `npm ci`, `npm run build`, copy the
   standalone folder into place, `systemctl restart elsa-decisiontree` (the unit grants the
   `elsa` user that one restart through a sudoers line), then `curl -sI http://127.0.0.1:3001/`
   and fails the job if the answer is not 200;
3. the first start seeds the repository's Trees; every later start keeps the data directory
   and converts its files to a newer format when a release carries one, as the demo server
   did on 2026-10-03 (`elsa-tree/4` to `/5`).

A rollback is `git checkout <previous commit or tag>` in `/srv/elsa/app` and the same
script. Nothing on the box needs the agents, Claude, or any GitHub credential beyond the
read-only deploy key.

## Order of work

1. **Survey the box** (read-only): the reverse proxy in use (nginx, Caddy, Traefik, or the
   other project binding 443 itself), Docker or not, the ports in use, the firewall, the
   backup routine, Node.js if any. Record the findings below.
2. **Create the user, folders, env file and unit**; deploy `dev` once by hand to the
   placeholder domain; verify the login over HTTPS and one Tree end to end.
3. **Add `deploy.yml` and the deploy key**; test with a push to a throwaway branch the
   workflow is temporarily pointed at.
4. **Point the workflow at `main`** once the owner has merged `dev` into it.
5. **Add `/srv/elsa/data` to the box's backup**, and note here where the backups go.

What the owner provides: SSH access to the box, the placeholder domain with its DNS record
pointing at the box, and the e-mail address the administrator of that deployment logs in
with (a value only the owner chooses; see `deployment.md`, `ELSA_ADMIN_EMAIL`).

## Facts learned on the box

_Recorded while deploying. Dates, no secrets._

| Date | Fact |
|---|---|
| | _nothing yet: access not given_ |
