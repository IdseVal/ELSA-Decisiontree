# The Dispatcher (v3)

A deterministic reconciler that runs the agent workflow. Not an agent. The full
behavioural contract is the docstring at the top of `dispatch.py`; this file is the
operations crib sheet and the policy record (v0.1.1 kept the policy in a separate
`~/.orca/roles/dispatcher.md`; it lives here now).

**Two ideas:** (1) it never trusts an agent to report back -- every tick it observes
GitHub, the OS process table, and Orca, computes what should be true, and does the
difference, idempotently. (2) GitHub is the memory; a run is disposable -- agents are
headless `claude -p` processes that start, do one job, and exit. Nothing waits.

## Files

| File | What |
| --- | --- |
| `dispatch.py` | the reconciler; `run` / `once` / `status` / `doctor` / `onboard` / `pause` / `resume` |
| `install-task.ps1` | installs it as a Windows scheduled task (at logon, auto-restart) |
| `state.json` | de-dup memory only (cycles, pages, run PIDs, the session-limit hold). Gitignored. Safe to delete. |
| `prompts/` | the brief files runs are pointed at. Gitignored. Read them to triage. |
| `runs/` | one log per headless run: your window into what an agent did. Gitignored. |
| `dispatcher.log` | rotating log. Gitignored. |
| `dispatcher.lock` | one dispatcher per repo. |
| `paused.json` | the soft-pause marker for THIS project. Gitignored. Present = paused. |
| `interview-done.json` | written by `finish-interview` inside an interview worktree; the dispatcher sees it and archives that worktree. Gitignored. |
| `dispatcher-pause.cmd` / `-resume.cmd` | the button: double-click, or pin to the taskbar. |

## Commands

```powershell
python .orca\dispatcher\dispatch.py doctor --fix   # prerequisites; creates missing labels
python .orca\dispatcher\dispatch.py onboard        # Planner interview (asks autonomy + interview model first, if unset)
python .orca\dispatcher\dispatch.py finish-interview # run BY THE PLANNER inside an interview worktree, on the human's go-ahead
python .orca\dispatcher\dispatch.py status         # the board: issues, runs, PRs
python .orca\dispatcher\dispatch.py once --dry-run # what one tick would do
python .orca\dispatcher\dispatch.py run            # foreground loop (Ctrl+C to stop)
python .orca\dispatcher\dispatch.py pause -m "why" # soft pause: start nothing new
python .orca\dispatcher\dispatch.py resume         # lift it
powershell -ExecutionPolicy Bypass -File .orca\dispatcher\install-task.ps1   # run forever
```

## What it does each tick

Gate on the core document being on `dev`. Dispatch `ready` issues whose `Depends on:`
are closed, up to `max_active_issues` LIVE runs -- but first, in manual/propose mode,
verify WHO applied `ready` (GitHub timeline): not in `promotion.trusted_promoters` ->
demote back to `proposed` with a comment (v0.2.4; empty list = enforcement off).
Dispatch means: worktree (no terminal), brief file,
headless `claude -p` in that directory logging to `runs/`. The issue's labels pick the
role the run loads (`research` -> Planner, `architecture` -> Architect, else the
Implementer) and the MODEL (v0.2.5, `models:` in `dispatch.yml`): `models.default`
(`opus`, the newest Opus) for everything, `models.complex` (`fable`, the most capable)
for every run of an issue labelled `complex`; always an explicit `--model`, never the
app's floating default. Kill any run past
`max_run_minutes` (whole tree); one fresh retry for a run that exits without a PR, then
`needs-human` -- unless the run's log is the "hit your session limit ... resets HH:MM"
line (v0.2.5): then the cycle is refunded and NOTHING new starts (dispatch, retry, fix,
audit) until the stated reset time; the hold lives in `state.json` under `limit` and
lifts by itself. PRs are verified, reviewed and merged by the CI pipeline
(`.github/workflows/agent-pipeline.yml`); the dispatcher only reacts: `state:blocked` ->
a fresh headless fix run whose brief embeds the blocker's comments (breaker at 3 total
starts per issue -> `escalated`); `needs-human` -> page once and touch nothing until the
label is gone; merged -> close the issue, remove the worktree (never an interview
worktree: the Planner keeps working there until `finish-interview` hands it back), kill
any lingering run. The dispatcher only counts and removes worktrees IT created
(`issue-*`, `backlog-audit-*`, `onboarding`, `revision-*`); any other worktree -- a
meta-oversight session, a scratch checkout -- is invisible to it.
Pipeline fully drained (an open interview counts as not drained) -> per the autonomy
dial, a headless Planner audit files
`proposed`/`ready` issues or opens the ACHIEVED PR; an audit that produces nothing while
nothing has merged since pages the human instead of looping.

## Pause

`pause` writes `paused.json`; `resume` deletes it; the running dispatcher reads it every
tick, so neither needs a restart. A pause is **soft and per-project**: it blocks the two
places the dispatcher creates NEW work (dispatching a `ready` issue, spawning an audit).
Fix runs, merges, issue closing and cleanup continue, so the fleet **drains**. It cannot
un-start a headless run that is already going -- but every run has a hard
`max_run_minutes` ceiling, so "already going" is now a bounded promise, not an open one.
A corrupt marker counts as paused: a bad file must never quietly restart the spend.

## Failure modes

| What breaks | What happens |
| --- | --- |
| Orca not open | worktree calls fail; the tick logs it and retries. Nothing is lost. |
| `gh` unauthenticated | the tick sees no issues/PRs and does nothing. `doctor` says so. |
| State file deleted | at most a duplicate comment; PIDs are re-checked against the OS, so nothing orphans. |
| Run exceeds `max_run_minutes` | killed (whole tree); breaker counts it. |
| Run exits without a PR | one fresh retry, then `needs-human` with a pointer at its log. |
| Run dies on the Claude session limit | not counted; a comment says so; every new start holds until the reset time in the message (+2 min), then resumes by itself. Runs already going are unaffected (they die the same way and get the same treatment). A run that prints the line and then idles instead of exiting (some CLI versions do) is killed on the next tick and treated the same. |
| CI blocks a PR | fresh fix run with the comments in its brief; breaker at 3. |
| Agent sets `needs-human` | the item is flagged and appears in the daily digest's "Waiting on you"; nothing moves on it until you remove the label. |
| CI pipeline never ran on a PR | check the repo's Actions tab; usually OWNER STEP 1 or 2 was skipped. |
| Two dispatchers | the lock file refuses the second. |
| Human pauses the project | no new dispatches or audits; in-flight work still lands. |

## Re-running an issue by hand

Remove `escalated`/`needs-human` as appropriate; the dispatcher re-dispatches on the next
tick (cycle continues counting). To reset the cycle count, delete the issue's entry from
`state.json`. To lift a session-limit hold early, delete the `limit` key in `state.json`
(pointless before the limit actually resets). To watch a live run:
`tail -f .orca/dispatcher/runs/<name>.log` (or just open the file; PowerShell:
`Get-Content -Wait`).

## Which model runs

`dispatch.py status` prints the policy on its second line. Per run, the dispatch comment
on the issue and `dispatcher.log` name the model. To send one issue to the most capable
model, add the `complex` label BEFORE `ready`. To change the fleet, edit `models:` in
`dispatch.yml`; it takes effect on the next start (the config is re-read every tick).
