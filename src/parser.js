import crypto from "node:crypto";
import path from "node:path";

export function isAcceptedEvidence(markdown) {
  return /decision\s*:\s*accept\b/i.test(markdown) ||
    /\baccepted\b/i.test(markdown) ||
    /结论\s*[:：]\s*accept/i.test(markdown) ||
    /验收\s*[:：]\s*(通过|接受)/i.test(markdown);
}

export function buildCandidateFromEvidencePacket(packet, context) {
  const task = packet.task || {};
  const evidence = packet.evidence || {};
  const title = task.goal || evidence.summary || "Captured FlowSkill Candidate";
  const id = makeId(title, context.evidencePath);

  return {
    schema_version: 1,
    id,
    name: title,
    status: "candidate",
    visibility: "private",
    summary: evidence.summary || task.goal || "Reusable practice captured from accepted CEO Flow evidence.",
    reusable_pattern: Array.isArray(evidence.reusable_pattern) && evidence.reusable_pattern.length > 0
      ? evidence.reusable_pattern
      : [evidence.summary || task.goal || "Review accepted evidence and reuse the proven steps."],
    applies_to: firstNonEmptyList(task.domain, inferTags(JSON.stringify(packet))),
    do_not_apply_to: ["one-off environment hacks", "private organization-specific logic"],
    source: {
      task_id: task.id || null,
      evidence_paths: [context.evidencePath],
      accepted_at: new Date().toISOString(),
      artifacts: evidence.artifacts || [],
      tests: evidence.tests || [],
      residual_risk: evidence.residual_risk || ""
    },
    metrics: emptyMetrics(),
    lineage: {
      parent_id: null,
      evolution_type: "CAPTURED"
    },
    privacy_findings: context.privacyFindings || []
  };
}

export function buildCandidate(markdown, context) {
  const title = extractTitle(markdown) || "Captured FlowSkill Candidate";
  const summary = extractSection(markdown, ["Current conclusion", "Summary", "结论", "Outcome"]) ||
    firstMeaningfulParagraph(markdown);
  const patternSection = extractSection(markdown, ["Reusable pattern", "Steps", "What changed", "做法", "步骤"], {
    raw: true
  });
  const steps = firstNonEmptyList(
    extractBullets(patternSection),
    extractBullets(markdown).slice(0, 8)
  );
  const appliesTo = inferTags(markdown);
  const id = makeId(title, context.evidencePath);

  return {
    schema_version: 1,
    id,
    name: title,
    status: "candidate",
    visibility: "private",
    summary,
    reusable_pattern: steps.length > 0 ? steps : [summary],
    applies_to: appliesTo,
    do_not_apply_to: ["one-off environment hacks", "private organization-specific logic"],
    source: {
      evidence_paths: [context.evidencePath],
      accepted_at: new Date().toISOString()
    },
    metrics: emptyMetrics(),
    lineage: {
      parent_id: null,
      evolution_type: "CAPTURED"
    },
    privacy_findings: context.privacyFindings || []
  };
}

export function buildFailure(markdown, context) {
  const title = extractTitle(markdown) || `Failure pattern for ${context.skillId}`;
  const rootCause = extractSection(markdown, ["Root cause", "原因", "root_cause"]) ||
    firstMeaningfulParagraph(markdown);
  const avoidNextTime = extractSection(markdown, ["Avoid next time", "avoid_next_time", "修复建议", "下次避免"]) ||
    "Review the failure evidence before applying this skill again.";
  const id = makeId(title, context.sourcePath);

  return {
    schema_version: 1,
    id,
    skill_id: context.skillId,
    title,
    trigger: extractSection(markdown, ["Trigger", "触发条件"]) || "",
    symptom: extractSection(markdown, ["Symptom", "现象"]) || "",
    root_cause: rootCause,
    avoid_next_time: avoidNextTime,
    source: {
      failure_paths: [context.sourcePath],
      captured_at: new Date().toISOString()
    },
    privacy_findings: context.privacyFindings || []
  };
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match) return cleanText(match[1]);
  const taskMatch = markdown.match(/^Task\s*:\s*(.+)$/im);
  return taskMatch ? cleanText(taskMatch[1]) : null;
}

function extractSection(markdown, headings, options = {}) {
  for (const heading of headings) {
    const pattern = new RegExp(`^#{1,4}\\s*${escapeRegExp(heading)}\\s*\\r?\\n([\\s\\S]*?)(?=\\n#{1,4}\\s+|(?![\\s\\S]))`, "im");
    const match = markdown.match(pattern);
    if (match && match[1].trim()) {
      return options.raw ? match[1].trim() : cleanText(match[1]);
    }

    const labelPattern = new RegExp(`^${escapeRegExp(heading)}\\s*[:：]\\s*(.+)$`, "im");
    const labelMatch = markdown.match(labelPattern);
    if (labelMatch) return cleanText(labelMatch[1]);
  }
  return "";
}

function extractBullets(markdown) {
  if (!markdown) return [];
  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(cleanText);
}

function firstNonEmptyList(...lists) {
  return lists.find((list) => Array.isArray(list) && list.length > 0) || [];
}

function firstMeaningfulParagraph(markdown) {
  const paragraph = markdown
    .replace(/^---[\s\S]*?---/m, "")
    .split(/\n\s*\n/)
    .map((part) => cleanText(part.replace(/^#+\s*/gm, "")))
    .find((part) => part.length > 20);
  return paragraph || "Reusable practice captured from accepted CEO Flow evidence.";
}

function inferTags(markdown) {
  const lower = markdown.toLowerCase();
  const tags = new Set(["ceo-flow"]);
  const pairs = [
    ["frontend", ["frontend", "ui", "visual", "playwright", "css"]],
    ["docs", ["readme", "documentation", "docs"]],
    ["privacy", ["privacy", "secret", "public", "open-source"]],
    ["node-cli", ["node", "cli", "npm"]],
    ["qa", ["qa", "test", "smoke", "verification"]]
  ];

  for (const [tag, needles] of pairs) {
    if (needles.some((needle) => lower.includes(needle))) tags.add(tag);
  }
  return [...tags];
}

function makeId(title, sourcePath) {
  const slug = slugify(title).slice(0, 48) || "candidate";
  const hash = crypto
    .createHash("sha1")
    .update(`${title}:${sourcePath}:${Date.now()}`)
    .digest("hex")
    .slice(0, 8);
  return `flowskill.${slug}.${hash}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emptyMetrics() {
  return {
    applied_count: 0,
    accepted_count: 0,
    revise_count: 0,
    blocked_count: 0,
    last_used_at: null
  };
}
