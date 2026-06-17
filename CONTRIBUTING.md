# Contributing

Thanks for helping improve FlowSkill.

## Development

```powershell
npm install
npm test
```

Keep FlowSkill local-first and CLI-first. It must not grow into a task executor, supervisor, thread creator, cloud uploader, or broad automation runtime.

## Pull Request Checklist

- Keep changes scoped to the skill-evolution module.
- Run `npm test`.
- Run `node src\cli.js validate --json` when changing store records or fixtures.
- Do not commit generated local store records unless they are intentional sanitized fixtures.
- Do not include local absolute paths, secrets, private repository names, raw chat logs, or organization-specific evidence.
