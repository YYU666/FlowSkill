# CEO Flow Integration Contract

FlowSkill should integrate with CEO Flow through a thin, reviewable interface. The CEO Flow skill should not absorb FlowSkill's capture, search, scoring, privacy scan, or export implementation.

## Integration Shape

CEO Flow owns decisions. FlowSkill only returns local skill data.

```text
Before dispatch:
  CEO Flow -> flowskill search "<task goal> <domain>" --json
  FlowSkill -> ranked local skills/candidates
  CEO Flow -> may include 0-3 selected items in task-card memory packet

After accept:
  CEO Flow -> writes accepted evidence packet/report
  CEO Flow -> flowskill capture --evidence <accepted-report.md> --json
  FlowSkill -> candidate id, files, privacy findings
  CEO Flow -> decides review/promote/export later
```

Optional later hooks:

```text
After outcome:
  flowskill score --skill <skill-id> --accepted|--revise|--blocked --json

After repeated failure:
  flowskill evolve --skill <skill-id> --from <failure-report.md> --json

Before public sharing:
  flowskill export --public-candidate <candidate-id> --json
```

## CEO Flow Side Change

Recommended CEO Flow change is one short reference section, not a large rewrite:

```text
FlowSkill hook:
- If FLOW_SKILL_ENABLED or project config enables it, CEO may run `flowskill search "<task goal> <domain>" --json` before dispatch.
- Include at most 0-3 relevant results in task-card `Memory packet`.
- After a task is accepted and evidence is written, CEO may run `flowskill capture --evidence <accepted-report.md> --json`.
- CEO decides whether the candidate remains private, is promoted, revised, archived, or exported.
- FlowSkill output never replaces CEO accept/revise/block decisions.
```

Do not place full FlowSkill command logic, parser rules, privacy patterns, score formulas, or export templates inside the CEO Flow skill.

## FlowSkill Side Interface

All CLI commands support `--json` and return one JSON object.

Examples:

```powershell
flowskill search "frontend visual qa" --json
flowskill capture --evidence .\reports\accepted-report.md --json
flowskill score --skill flowskill.frontend-visual-qa --accepted --json
```

The JSON result schema is documented in:

- `schemas/ceoflow-hook-result.schema.json`
- `schemas/ceoflow-evidence.schema.json`

## SKILL.md Export Format

Exported skill drafts must stay small:

- YAML frontmatter: `name`, `description`.
- Trigger guidance: when to use / when not to use.
- Procedure: reusable steps only.
- Evidence basis: lineage and metrics summary, without private evidence paths.
- Privacy review reminder.

Exported drafts must not contain:

- CLI implementation details.
- CEO Flow routing policy.
- AutoFlow runtime concepts.
- Raw task reports, chat transcripts, private paths, secrets, organization names, or repository names.

## Boundary Guardrail

FlowSkill is a callable local tool. CEO Flow is the orchestrator. The integration line is data exchange, not runtime merger.
