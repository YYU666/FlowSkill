# FlowSkill Program Goal

Program goal: Build FlowSkill into the official CEO Flow skill-evolution module while keeping it local-first, modular, and open-sourceable.

Canonical project root: local FlowSkill project checkout

Outcome / launch definition: A CLI-first module that can be called by CEO Flow through thin JSON hooks, manages candidate/active/archived lifecycle, scores skill quality, evolves from failures, validates records, scans privacy risks, and exports reviewable `SKILL.md` drafts without becoming an execution runtime.

## Phases

- Phase 1: MVP CLI and local store. Status: accepted.
- Phase 2: Full local lifecycle baseline. Status: accepted.
- Phase 3: Hardening for open source: stricter schema validation, fixtures, package metadata, release checklist. Status: pending.
- Phase 4: Optional integrations: richer search, embeddings, UI, or community registry. Status: explicitly deferred.

## Completion Dashboard

Phase: Full local lifecycle baseline

Percent complete: 85

Active lanes: current CEO direct fallback thread

Blocked lanes: none

Accepted work:

- MVP store, capture, search, score, evolve, export.
- CEO Flow thin hook contract and `--json` output.

Next task:

- Harden open-source packaging, stricter schema validation, and release checks.

Evidence:

- `npm test`
- `node src\cli.js validate --json`
- `node src\cli.js report --json`
- `node src\cli.js search "frontend visual qa" --json`

## Non-Goals

- No resident supervisor.
- No task execution.
- No Codex thread creation.
- No shell/browser/GUI/MCP task running.
- No automatic cloud upload.
- No AutoFlow runtime clone.
- No heavy CEO Flow skill rewrite.

## Acceptance Evidence

- Smoke test covers init, Markdown capture, structured JSON capture, search, show, list, score, promote, reject, archive, evolve, export, scan, validate, and report.
- README and integration docs explain boundaries.
- Exported `SKILL.md` drafts omit private evidence paths.
