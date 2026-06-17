# FlowSkill Protocol

FlowSkill is a local CLI-backed skill evolution layer for CEO Flow.

## Data Boundary

CEO Flow owns:

- Goal definition
- Task graph
- Lane/thread scheduling
- Task cards
- Evidence harvest
- `accept | revise | block | supersede`
- User reporting

FlowSkill owns:

- Search over local skills and candidates
- Candidate capture from accepted evidence
- Skill metrics
- `CAPTURED | DERIVED | FIX` lineage records
- Candidate promotion/rejection/archive
- Privacy scan, validation, report, and export drafts

## Accepted Evidence Input

FlowSkill accepts either Markdown accepted reports or structured CEO Flow evidence packets.

Structured packet schema lives in the FlowSkill repo:

```text
schemas/ceoflow-evidence.schema.json
```

Minimal packet:

```json
{
  "schema_version": 1,
  "decision": "accept",
  "task": {
    "id": "TASK-01",
    "goal": "Reusable task goal",
    "domain": ["frontend", "qa"]
  },
  "evidence": {
    "summary": "Accepted result summary.",
    "reusable_pattern": ["Step one", "Step two"],
    "tests": ["npm test"],
    "residual_risk": "Known limitation."
  }
}
```

## JSON Hook Result

All FlowSkill CLI commands should be called with `--json` when Codex needs to parse the result. The result is a single JSON object with:

- `command`
- `status`
- command-specific ids, paths, results, privacy, issues, counts, or metrics

Schema lives in:

```text
schemas/ceoflow-hook-result.schema.json
```

## Public Export Rules

Exported `SKILL.md` drafts are candidates only. Before publishing:

1. Run `scan --path <draft> --json`.
2. Review privacy findings.
3. Confirm no local paths, secrets, private repository names, raw chats, or organization-specific evidence remain.
4. Keep the final skill concise: frontmatter, triggers, procedure, evidence basis, and privacy review only.
