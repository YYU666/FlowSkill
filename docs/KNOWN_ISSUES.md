# FlowSkill Known Issues

This file records issues found while using FlowSkill on real CEO Flow thread history. It is intentionally blunt: these are product gaps, not user mistakes.

## Fixed Or Mitigated

### CLI Module Was Built Before The Codex Skill Wrapper

FlowSkill initially shipped as a Node CLI and local store, but not as an installable Codex skill. That made the product confusing: the underlying tool existed, but Codex could not discover it as a skill.

Status: mitigated in `v0.1.1`.

Current state:

- CLI module: repository root.
- Codex skill wrapper: `codex-skill/flowskill`.
- Local installed wrapper: user installs or copies it into the Codex skills directory.

Remaining risk: current Codex threads may not see newly installed skills until a refresh or new thread.

### Public Release Initially Included Only The CLI

The first public release did not include a skill wrapper. That made the GitHub project look like a generic CLI rather than a Codex skill-backed module.

Status: mitigated by `codex-skill/flowskill` and `v0.1.1`.

## Current Product Gaps

### Markdown Capture Produces Weak Tags

When FlowSkill captures from a free-form Markdown accepted report, it infers tags from keyword heuristics. In testing, a SQLite/sql.js performance candidate incorrectly received tags such as `ceo-flow`, `frontend`, and `qa`.

Impact:

- Search still works, but task-card recommendations can be noisy.
- Exported `SKILL.md` drafts may have poor "Use this skill when" sections.

Better path observed:

- Structured CEO Flow evidence packets produced correct tags such as `electron`, `sql.js`, `sqlite`, `performance`, and `local-first`.

Needed fixes:

- Add `capture --domain <csv>` and `capture --applies-to <csv>`.
- Add `edit candidate` or `review candidate` commands.
- Prefer structured evidence packets for production capture.

### Exported Skill Drafts Still Need Human Review

`flowskill export` creates a useful draft, not a ready-to-install skill. Real usage showed that a draft may need:

- Natural-language trigger text instead of raw tags.
- Removal of internal metrics such as `applied=0`.
- Stronger safety rules, such as backup-before-mutation.
- Better "do not use" boundaries.

Impact:

- Installing exported drafts without review can create mediocre or misleading skills.

Needed fixes:

- Add an `export --codex-skill` mode that generates a proper skill folder.
- Add a review checklist before install.
- Add a quality score for trigger clarity, safety boundaries, and privacy readiness.

### Candidate Versus Installed Skill Is Easy To Confuse

FlowSkill can create a candidate and export a `SKILL.md` draft, but that is not the same as installing a Codex skill into the local skills directory.

Impact:

- Users may think a generated candidate is already active in Codex.

Needed fixes:

- Add `install-codex-skill --candidate <id>` after explicit confirmation.
- Keep install separate from export and promotion.
- Report clear states: `candidate`, `public_candidate`, `active`, `installed_codex_skill`.

### Store Records Keep Private Evidence Paths

Private candidate JSON stores source evidence paths for traceability. Public exports omit those paths, and the repository ignores generated store records, but private local stores can still contain absolute paths.

Impact:

- Safe for local-first use.
- Unsafe if users manually commit `candidates/`, `skills/`, `failures/`, or `exports/`.

Current mitigation:

- `.gitignore` excludes generated store records.
- Privacy scan flags local absolute paths.

Needed fixes:

- Add `redact --candidate <id>` for shareable records.
- Add `doctor` that checks whether generated records are about to be committed.

### Privacy Scanner Is Conservative And Heuristic

The privacy scanner flags obvious local paths, secret-shaped tokens, repository references, customer/client wording, and raw chat markers. It can have false positives and false negatives.

Impact:

- Good as a warning layer.
- Not a substitute for human review before public publishing.

Needed fixes:

- Add configurable allowlists.
- Add severity policy for blocking public export.
- Add tests for known false positives and misses.

### Validation Is Custom, Not Full JSON Schema Validation

FlowSkill includes JSON schema files and a custom validator, but it does not yet use a full JSON Schema runtime validator.

Impact:

- Basic store mistakes are caught.
- Schema drift may not be caught completely.

Needed fixes:

- Add a schema validator dependency or a tiny generated validator step.
- Validate candidate, skill, failure, evidence packet, and hook result fixtures.

### Search Is Simple Weighted Text Search

Search is currently local weighted text matching over names, summaries, tags, and procedures.

Impact:

- Good enough for first-pass local recall.
- Not robust for synonyms or larger stores.

Needed fixes:

- Add BM25-style scoring.
- Add optional embeddings behind a local-first opt-in.
- Add result explanation so CEO Flow knows why a skill was retrieved.

## Candidate Quality Rules Learned

A FlowSkill-generated candidate is more likely to become a good standalone Codex skill when:

- It solves a repeatable problem outside one project.
- It has clear triggers independent of CEO Flow.
- It has a safety-critical procedure or specialized diagnostic checklist.
- It does not depend on private paths, thread IDs, or project-only concepts.
- It can be written as concise Codex skill instructions.

A candidate should usually stay as CEO Flow internal memory when:

- It only changes CEO Flow routing policy.
- It depends on a specific project board or lane topology.
- It is a one-off incident response.
- It is mainly a task-card wording tweak.

## Next Highest-Value Improvements

1. Add candidate review/edit commands.
2. Add Codex skill install flow with explicit confirmation and validation.
3. Improve structured evidence capture and domain tagging.
4. Add quality gates for exported `SKILL.md` drafts.
5. Add schema runtime validation.
