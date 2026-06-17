# FlowSkill MVP PRD

## Mode

CEO Flow mode: direct CEO fallback after thread-tool discovery. This is a bounded single-write-set prototype in the local FlowSkill project root.

## Product Definition

FlowSkill is the experience-skill layer for CEO Flow. It captures reusable practices from accepted evidence, keeps them local by default, scores their quality, evolves them from failures, and exports reviewable `SKILL.md` drafts.

## Non-Goals

- No resident supervisor.
- No task execution.
- No Codex thread creation.
- No shell, GUI, web, MCP, or agent runner orchestration.
- No automatic cloud upload.
- No AutoFlow task pool, lease, desktop, review queue, or control plane clone.
- No modification of the CEO Flow main skill in this phase.

## Command Surface

- `flowskill init`
- `flowskill search "frontend visual qa"`
- `flowskill list`
- `flowskill show --id <record-id>`
- `flowskill capture --evidence <accepted-report.md>`
- `flowskill score --skill <skill-id>`
- `flowskill promote --candidate <candidate-id>`
- `flowskill derive --skill <skill-id>`
- `flowskill reject --candidate <candidate-id>`
- `flowskill archive --skill <skill-id>`
- `flowskill evolve --skill <skill-id> --from <failure-report.md>`
- `flowskill export --public-candidate <skill-id>`
- `flowskill scan --path <file>`
- `flowskill validate`
- `flowskill report`

## Data Model

- `candidate`: private captured, derived, rejected, promoted, or archived reusable pattern.
- `skill`: reviewed active or archived reusable skill.
- `failure`: failure pattern used to create `FIX` evolution candidates.
- `metrics`: `applied_count`, `accepted_count`, `revise_count`, `blocked_count`, `last_used_at`.
- `lineage`: `CAPTURED`, `DERIVED`, or `FIX`, borrowed as concepts from OpenSpace without importing the OpenSpace runtime.

## Acceptance Evidence

The full local lifecycle baseline is accepted when smoke commands prove:

- Store initialization works.
- Accepted Markdown evidence and structured CEO Flow evidence packets create JSON and Markdown candidates.
- Search finds candidates or skills.
- `CAPTURED`, `DERIVED`, and `FIX` lineage are all represented.
- Candidate promotion creates active skills.
- Candidate reject and skill/candidate archive close lifecycle records.
- Score updates simple metrics.
- Evolve records a failure and creates a fix candidate.
- Export creates a `SKILL.md` draft.
- Privacy scan reports local paths, secret-shaped tokens, private repo references, customer/client wording, and raw chat markers.
- Validation and report commands summarize store health.
