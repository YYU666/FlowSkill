# FlowSkill Architecture

## Boundary

CEO Flow owns goal definition, task graph, lane routing, task cards, evidence harvest, accept/revise/block, and user reporting.

FlowSkill owns only the local skill lifecycle:

```text
accepted evidence -> CAPTURED candidate -> promoted active skill | rejected | archived
active skill -> DERIVED candidate
failure report -> FIX candidate
candidate -> public_candidate SKILL.md draft
```

## Components

- `src/cli.js`: argument parsing and command dispatch.
- `src/commands.js`: command handlers.
- `src/parser.js`: Markdown evidence and failure extraction.
- `src/privacy.js`: conservative static privacy scanner.
- `src/search.js`: simple local weighted text search.
- `src/store.js`: local file store helpers.
- `src/render.js`: Markdown and `SKILL.md` draft rendering.
- `src/validate.js`: local contract validation without runtime dependencies.
- `schemas/`: JSON schema contracts for future validation.

## Store Layout

```text
skills/       reviewed active or archived skills
candidates/  captured or evolved candidates, JSON plus Markdown
failures/    failure-pattern records, JSON plus Markdown
metrics/     reserved for aggregate reports
exports/     public candidate SKILL.md drafts
```

## Lifecycle Rules

- `capture` creates private `candidate` records from accepted Markdown reports or structured CEO Flow evidence packets.
- `promote` creates an `active` skill and marks the original candidate as `promoted`.
- `derive` creates a `DERIVED` candidate from an active skill or candidate while resetting metrics and lifecycle fields.
- `evolve` records a failure pattern and creates a `FIX` candidate.
- `reject` keeps a candidate for audit history but excludes it from default search.
- `archive` keeps a skill or candidate for audit history but excludes it from default search.
- `export` writes a reviewable public-candidate `SKILL.md` draft and does not upload anything.

## Integration Points

Future CEO Flow integration should be two hooks only:

- Before dispatch: search FlowSkill and optionally include 0-3 relevant skills in the task-card memory packet.
- After accept: pass accepted evidence to `flowskill capture`, then CEO reviews candidate promotion.

FlowSkill should never decide task acceptance or mutate CEO Flow lane state.
