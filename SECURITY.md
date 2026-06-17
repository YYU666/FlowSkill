# Security Policy

## Reporting

Please report suspected security issues through GitHub private vulnerability reporting when available, or open a minimal issue without posting secrets.

## Scope

FlowSkill is a local CLI. It should not:

- Execute project tasks.
- Create Codex threads.
- Run browser, GUI, shell, web, or MCP work on behalf of an agent task.
- Upload local skills or evidence.
- Store secrets in public skill drafts.

## Privacy Expectations

Before publishing generated skill drafts, run:

```powershell
node src\cli.js scan --path <file>
```

The scanner is conservative and does not replace human review.
