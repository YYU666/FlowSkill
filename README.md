# FlowSkill

FlowSkill is a local-first skill evolution module for CEO Flow. It turns accepted CEO Flow evidence into reusable skill candidates, records simple quality metrics, evolves skills from failure reports, and exports reviewable `SKILL.md` drafts.

It is not a new orchestrator. CEO Flow still owns goals, task graphs, lane scheduling, task cards, evidence harvest, accept/revise/block decisions, and user reporting.

## Install / Run

```powershell
git clone https://github.com/YYU666/FlowSkill.git
cd FlowSkill
npm install
node src\cli.js init
node src\cli.js capture --evidence examples\accepted-report.md
node src\cli.js search "frontend visual qa"
node src\cli.js list
node src\cli.js show --id <record-id>
node src\cli.js score --skill <skill-id> --accepted
node src\cli.js promote --candidate <candidate-id>
node src\cli.js derive --skill <skill-id> --name "Mobile Visual QA"
node src\cli.js evolve --skill <skill-id> --from examples\failure-report.md
node src\cli.js export --public-candidate <skill-id>
node src\cli.js validate
node src\cli.js report
```

After `npm link`, the same commands are available as `flowskill`.

## Install As A Codex Skill

FlowSkill has two parts:

- the CLI in this repository
- a thin Codex skill wrapper in `codex-skill/flowskill`

To install the wrapper locally:

```powershell
Copy-Item -Recurse -Force .\codex-skill\flowskill "$env:USERPROFILE\.codex\skills\flowskill"
```

The wrapper tells Codex when to call the local CLI. It intentionally does not embed the CLI implementation in the skill prompt.

## Commands

- `flowskill init`: create a local FlowSkill store.
- `flowskill search "frontend visual qa"`: search local candidates and active skills.
- `flowskill capture --evidence <accepted-report.md>`: create a candidate from accepted Markdown evidence.
- `flowskill capture --evidence <accepted-evidence-packet.json>`: create a candidate from a structured CEO Flow evidence packet.
- `flowskill list`: list local skills, candidates, and failures.
- `flowskill show --id <record-id>`: show a record as JSON.
- `flowskill score --skill <skill-id>`: increment `applied_count`; add `--accepted`, `--revise`, `--blocked`, or `--event`.
- `flowskill promote --candidate <candidate-id>`: promote a reviewed candidate to an active skill.
- `flowskill derive --skill <skill-id>`: create a `DERIVED` candidate from an active skill or candidate.
- `flowskill reject --candidate <candidate-id>`: reject a candidate with a reason.
- `flowskill archive --skill <skill-id>`: archive an active skill or candidate.
- `flowskill evolve --skill <skill-id> --from <failure-report.md>`: record a failure and create a `FIX` candidate.
- `flowskill export --public-candidate <skill-id>`: mark a candidate as `public_candidate` and generate an export draft at `exports/<skill-id>/SKILL.md`.
- `flowskill scan --path <file>`: run the privacy scanner on a file.
- `flowskill validate`: validate local FlowSkill records.
- `flowskill report`: summarize counts and aggregate metrics.

Use `--store <dir>` to operate on a store outside the current working directory.
Use `--json` on any command when calling FlowSkill from CEO Flow or another wrapper.

## Boundaries

FlowSkill does:

- Capture reusable experience from accepted evidence.
- Generate structured candidate JSON and readable Markdown.
- Track candidate / active / archived lifecycle data.
- Promote, reject, and archive lifecycle records.
- Validate records and report aggregate quality metrics.
- Score simple skill metrics.
- Search local candidates and skills.
- Evolve from failure reports using the `FIX` lineage concept.
- Export reviewable `SKILL.md` drafts.
- Scan for privacy risks before public sharing.

FlowSkill does not:

- Run tasks or supervise agents.
- Create Codex threads.
- Call shell, GUI, browser, web, or MCP tools on behalf of a task.
- Upload anything to the cloud.
- Replace CEO Flow's quality gate.
- Clone AutoFlow's task pool, leases, desktop, review queue, or control plane.

## Relationship To CEO Flow

CEO Flow is the operating layer. It defines the user outcome, routes work, harvests evidence, and decides `accept`, `revise`, or `block`.

FlowSkill starts after evidence is accepted. It helps answer: what did we learn, can it become a reusable skill, did the skill work later, and is it safe to publish?

The integration contract is intentionally thin. See [docs/CEO_FLOW_INTEGRATION.md](docs/CEO_FLOW_INTEGRATION.md). CEO Flow should call `flowskill search ... --json` before dispatch and `flowskill capture --evidence ... --json` after accept; it should not embed FlowSkill internals inside the CEO Flow skill.

## Relationship To OpenSpace

FlowSkill borrows the lightweight vocabulary of `CAPTURED`, `DERIVED`, and `FIX` skill evolution from HKUDS/OpenSpace. It does not copy OpenSpace's execution runtime, cloud community, dashboard, or task executor. The first version is CLI-first and local-only.

## Relationship To AutoFlow

AutoFlow explores a broader local automation runtime: task pools, leases, supervisors, desktop surfaces, review queues, writeback, repair, and control plane contracts.

FlowSkill intentionally stays smaller. It is only the experience-skill layer for CEO Flow, designed to be open-sourceable without leaking local runtime state, workspace paths, queues, leases, reports, or user-specific artifacts.

## Privacy Scan

The scanner flags:

- Local absolute paths.
- API-key-shaped secrets.
- Private repository references.
- Customer/client placeholder wording that needs human review.
- Raw chat transcript markers.

Findings do not automatically publish or upload anything. They are review prompts for the human and CEO Flow quality gate.

## Smoke Test

```powershell
npm test
```

The smoke test creates a temporary store under `examples/.flowskill-smoke`, runs init/capture/search/score/evolve/export, and checks that expected files exist.

## License

MIT. See [LICENSE](LICENSE).
