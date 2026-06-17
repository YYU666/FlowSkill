export function candidateToMarkdown(candidate) {
  return `# ${candidate.name}

Status: ${candidate.status}
Visibility: ${candidate.visibility}
Lineage: ${candidate.lineage?.evolution_type || "CAPTURED"}

## Summary

${candidate.summary}

## Applies To

${list(candidate.applies_to)}

## Do Not Apply To

${list(candidate.do_not_apply_to)}

## Reusable Pattern

${list(candidate.reusable_pattern)}

## Metrics

- applied_count: ${candidate.metrics?.applied_count ?? 0}
- accepted_count: ${candidate.metrics?.accepted_count ?? 0}
- revise_count: ${candidate.metrics?.revise_count ?? 0}
- blocked_count: ${candidate.metrics?.blocked_count ?? 0}

## Privacy Findings

${privacyList(candidate.privacy_findings)}
`;
}

export function failureToMarkdown(failure) {
  return `# ${failure.title}

Skill: ${failure.skill_id}

## Trigger

${failure.trigger || "Not specified."}

## Symptom

${failure.symptom || "Not specified."}

## Root Cause

${failure.root_cause || "Not specified."}

## Avoid Next Time

${failure.avoid_next_time || "Not specified."}

## Privacy Findings

${privacyList(failure.privacy_findings)}
`;
}

export function skillDraftToMarkdown(candidate) {
  return `---
name: ${safeSkillName(candidate.name)}
description: ${candidate.summary}
---

# ${candidate.name}

Use this skill when:

${list(candidate.applies_to)}

Do not use this skill when:

${list(candidate.do_not_apply_to)}

## Procedure

${list(candidate.reusable_pattern)}

## Evidence Basis

- Source lineage: ${candidate.lineage?.evolution_type || "CAPTURED"}
- Source evidence paths are intentionally omitted from the public draft.
- Metrics at export: applied=${candidate.metrics?.applied_count ?? 0}, accepted=${candidate.metrics?.accepted_count ?? 0}, revise=${candidate.metrics?.revise_count ?? 0}, blocked=${candidate.metrics?.blocked_count ?? 0}

## Privacy Review

Before publishing, confirm that this draft contains no local paths, real organization names, private repository names, API keys, raw chat transcripts, or project-specific secrets.
`;
}

function list(values = []) {
  if (!Array.isArray(values) || values.length === 0) return "- Not specified.";
  return values.map((value) => `- ${value}`).join("\n");
}

function privacyList(findings = []) {
  if (!findings.length) return "- No findings.";
  return findings.map((finding) => `- ${finding.severity} ${finding.type}: ${finding.message}`).join("\n");
}

function safeSkillName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "flowskill-candidate";
}
