---
name: flowskill
description: Local-first skill evolution layer for CEO Flow. Use when Codex needs to search reusable FlowSkill records before a CEO Flow task, capture a skill candidate from accepted evidence, score skill outcomes, evolve a skill from a failure report, derive a specialized candidate, promote/reject/archive skill candidates, export a reviewable SKILL.md draft, or run FlowSkill privacy/validation/report checks.
---

# FlowSkill

Use FlowSkill as the CEO Flow experience-skill layer. Keep it thin: this skill explains when and how to call the local FlowSkill CLI; the CLI owns parsing, scoring, privacy scanning, validation, store writes, and export formatting.

## Local Tool

Run commands from the FlowSkill repository checkout unless the user gives another store path:

```powershell
cd <FlowSkill checkout>
node src\cli.js <command> --json
```

If the checkout is missing, ask the user for the FlowSkill install path or clone `https://github.com/YYU666/FlowSkill`.

## Core CEO Flow Hooks

Before dispatching a CEO Flow task, search for reusable skills:

```powershell
node src\cli.js search "<task goal> <domain>" --json
```

Use at most 0-3 relevant results in the task-card memory packet. FlowSkill results are suggestions, not instructions that override CEO judgment.

After CEO Flow accepts work and writes an accepted evidence report or packet:

```powershell
node src\cli.js capture --evidence <accepted-report-or-packet> --json
```

CEO Flow still decides whether the candidate should remain private, be promoted, revised, rejected, archived, or exported.

## Lifecycle Commands

- `search "<query>" --json`: find active skills and open candidates.
- `capture --evidence <file> --json`: create a `CAPTURED` candidate from accepted evidence.
- `score --skill <id> --accepted|--revise|--blocked --json`: update usage metrics.
- `promote --candidate <id> --json`: promote a reviewed candidate to active skill.
- `derive --skill <id> --name <name> --json`: create a `DERIVED` specialized candidate.
- `evolve --skill <id> --from <failure-report> --json`: create a `FIX` candidate from failure evidence.
- `reject --candidate <id> --reason <text> --json`: close a candidate that should not become a skill.
- `archive --skill <id> --reason <text> --json`: archive a skill or candidate.
- `export --public-candidate <id> --json`: generate a reviewable `SKILL.md` draft.
- `scan --path <file> --json`: run privacy checks.
- `validate --json`: validate local store records.
- `report --json`: summarize store counts and metrics.

## Guardrails

- Do not let FlowSkill execute user project tasks.
- Do not use FlowSkill to create Codex threads, run GUI/browser/web/MCP work, or upload anything.
- Do not paste FlowSkill internals into CEO Flow task cards.
- Do not publish exported drafts until privacy findings are reviewed.
- Do not treat FlowSkill output as CEO Flow acceptance evidence by itself.

## References

Read `references/flow-protocol.md` when you need the exact CEO Flow integration contract, JSON hook expectations, or public export boundaries.
