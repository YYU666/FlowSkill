export function printHelp() {
  console.log(`FlowSkill

Usage:
  flowskill init [--store <dir>]
  flowskill search "frontend visual qa" [--store <dir>]
  flowskill list [--kind skill|candidate|failure] [--status active|candidate|archived]
  flowskill show --id <record-id>
  flowskill capture --evidence <accepted-report.md> [--store <dir>]
  flowskill score --skill <skill-id> [--event applied|accepted|revise|blocked] [--store <dir>]
  flowskill promote --candidate <candidate-id> [--reviewer <name>] [--notes <text>]
  flowskill derive --skill <skill-id> [--name <name>] [--applies-to <csv>]
  flowskill reject --candidate <candidate-id> [--reason <text>]
  flowskill archive --skill <skill-id> [--reason <text>]
  flowskill evolve --skill <skill-id> --from <failure-report.md> [--store <dir>]
  flowskill export --public-candidate <skill-id> [--store <dir>]
  flowskill scan --path <file> | --skill <skill-id>
  flowskill validate
  flowskill report

Machine interface:
  Add --json to any command to return a single JSON object for CEO Flow hooks.

FlowSkill is a local-first skill evolution layer. It does not execute tasks,
create Codex threads, run shell/browser/MCP work, or upload skills.`);
}
