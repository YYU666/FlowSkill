import fs from "node:fs/promises";
import path from "node:path";
import {
  atomicWriteJson,
  ensureStore,
  findSkillRecord,
  readJsonRecords,
  readJsonIfExists,
  resolveStore,
  writeMarkdown
} from "./store.js";
import {
  candidateToMarkdown,
  failureToMarkdown,
  skillDraftToMarkdown
} from "./render.js";
import { buildCandidate, buildCandidateFromEvidencePacket, buildFailure, isAcceptedEvidence } from "./parser.js";
import { privacyScan } from "./privacy.js";
import { searchRecords } from "./search.js";
import { validateAll } from "./validate.js";

export async function initStore(options = {}) {
  const store = resolveStore(options.store);
  await ensureStore(store);
  await atomicWriteJson(path.join(store, "flowskill.json"), {
    schema_version: 1,
    name: "FlowSkill local store",
    created_at: new Date().toISOString(),
    boundaries: [
      "Does not execute tasks",
      "Does not create Codex threads",
      "Does not upload skills",
      "Captures reusable skill candidates only from accepted evidence"
    ]
  });
  emit(options, {
    command: "init",
    status: "ok",
    store
  }, () => {
    console.log(`Initialized FlowSkill store: ${store}`);
  });
}

export async function captureCandidate(options = {}) {
  const evidencePath = requireOption(options.evidence, "--evidence");
  const store = resolveStore(options.store);
  await ensureStore(store);

  const absoluteEvidencePath = path.resolve(evidencePath);
  const evidence = await fs.readFile(absoluteEvidencePath, "utf8");
  const structuredPacket = parseStructuredEvidence(evidencePath, evidence);
  if (!options.force && !structuredPacket && !isAcceptedEvidence(evidence)) {
    throw new Error("Evidence does not look accepted. Add 'Decision: accept' or use --force for a private draft.");
  }
  if (!options.force && structuredPacket && structuredPacket.decision !== "accept") {
    throw new Error("Structured evidence packet decision must be 'accept'.");
  }

  const scan = privacyScan(evidence);
  const candidate = structuredPacket
    ? buildCandidateFromEvidencePacket(structuredPacket, {
      evidencePath: absoluteEvidencePath,
      privacyFindings: scan.findings
    })
    : buildCandidate(evidence, {
      evidencePath: absoluteEvidencePath,
      privacyFindings: scan.findings
    });

  const jsonPath = path.join(store, "candidates", `${candidate.id}.json`);
  const markdownPath = path.join(store, "candidates", `${candidate.id}.md`);
  await atomicWriteJson(jsonPath, candidate);
  await writeMarkdown(markdownPath, candidateToMarkdown(candidate));

  emit(options, {
    command: "capture",
    status: "ok",
    candidate_id: candidate.id,
    candidate,
    paths: {
      json: jsonPath,
      markdown: markdownPath
    },
    privacy: privacySummary(scan)
  }, () => {
    console.log(`Captured candidate: ${candidate.id}`);
    console.log(`JSON: ${jsonPath}`);
    console.log(`Markdown: ${markdownPath}`);
    printPrivacySummary(scan);
  });
}

export async function listRecords(options = {}) {
  const store = resolveStore(options.store);
  await ensureStore(store);
  const kindFilter = options.kind && options.kind !== true ? options.kind : "all";
  const statusFilter = options.status && options.status !== true ? options.status : null;
  const records = await loadAllRecords(store);
  const filtered = records
    .filter((item) => kindFilter === "all" || item.kind === kindFilter)
    .filter((item) => !statusFilter || item.record.status === statusFilter)
    .map((item) => ({
      kind: item.kind,
      id: item.record.id,
      name: item.record.name || item.record.title,
      status: item.record.status || "recorded",
      visibility: item.record.visibility || null
    }));

  emit(options, {
    command: "list",
    status: "ok",
    records: filtered
  }, () => {
    if (filtered.length === 0) {
      console.log("No records.");
      return;
    }
    for (const item of filtered) {
      console.log(`${item.kind.padEnd(9)} ${String(item.status).padEnd(10)} ${item.id}  ${item.name}`);
    }
  });
}

export async function showRecord(options = {}) {
  const id = requireOption(options.skill || options.candidate || options.failure || options.id, "--id");
  const store = resolveStore(options.store);
  await ensureStore(store);
  const found = await findSkillRecord(store, id);
  if (!found) throw new Error(`Record not found: ${id}`);

  emit(options, {
    command: "show",
    status: "ok",
    kind: found.kind,
    record: found.record
  }, () => {
    console.log(JSON.stringify(found.record, null, 2));
  });
}

export async function searchStore(query, options = {}) {
  const store = resolveStore(options.store);
  await ensureStore(store);
  const results = await searchRecords(store, query || "");

  if (options.json) {
    emit(options, {
      command: "search",
      status: "ok",
      query,
      results: results.map((result) => ({
        score: result.score,
        kind: result.kind,
        id: result.record.id,
        name: result.record.name,
        summary: result.record.summary,
        status: result.record.status,
        visibility: result.record.visibility,
        applies_to: result.record.applies_to || []
      }))
    });
    return;
  }

  if (results.length === 0) {
    console.log("No matching candidates or skills.");
    return;
  }

  for (const result of results) {
    console.log(`${result.score.toFixed(2)}  ${result.record.id}  [${result.kind}] ${result.record.name}`);
    if (result.record.summary) {
      console.log(`      ${result.record.summary}`);
    }
  }
}

export async function scoreSkill(options = {}) {
  const skillId = requireOption(options.skill, "--skill");
  const store = resolveStore(options.store);
  await ensureStore(store);
  const found = await findSkillRecord(store, skillId);
  if (!found) {
    throw new Error(`Skill or candidate not found: ${skillId}`);
  }

  const event = inferScoreEvent(options);
  const record = found.record;
  record.metrics = {
    applied_count: 0,
    accepted_count: 0,
    revise_count: 0,
    blocked_count: 0,
    ...(record.metrics || {})
  };

  if (event === "accepted") {
    record.metrics.applied_count += 1;
    record.metrics.accepted_count += 1;
  } else if (event === "revise") {
    record.metrics.applied_count += 1;
    record.metrics.revise_count += 1;
  } else if (event === "blocked") {
    record.metrics.applied_count += 1;
    record.metrics.blocked_count += 1;
  } else {
    record.metrics.applied_count += 1;
  }
  record.metrics.last_used_at = new Date().toISOString();

  await atomicWriteJson(found.path, record);
  emit(options, {
    command: "score",
    status: "ok",
    skill_id: skillId,
    event,
    metrics: record.metrics
  }, () => {
    console.log(`Scored ${skillId}: ${event}`);
    console.log(JSON.stringify(record.metrics, null, 2));
  });
}

export async function promoteCandidate(options = {}) {
  const candidateId = requireOption(options.candidate || options.skill, "--candidate");
  const store = resolveStore(options.store);
  await ensureStore(store);
  const candidatePath = path.join(store, "candidates", `${candidateId}.json`);
  const candidate = await readJsonIfExists(candidatePath);
  if (!candidate) throw new Error(`Candidate not found: ${candidateId}`);
  if (!["candidate", "public_candidate"].includes(candidate.status) && candidate.status !== "candidate") {
    throw new Error(`Candidate cannot be promoted from status: ${candidate.status}`);
  }

  const skill = {
    ...candidate,
    status: "active",
    visibility: options.public ? "public" : "private",
    promoted_at: new Date().toISOString(),
    review: {
      reviewer: options.reviewer && options.reviewer !== true ? options.reviewer : "ceo-flow",
      notes: options.notes && options.notes !== true ? options.notes : ""
    }
  };
  const skillJsonPath = path.join(store, "skills", `${skill.id}.json`);
  const skillMarkdownPath = path.join(store, "skills", `${skill.id}.md`);
  await atomicWriteJson(skillJsonPath, skill);
  await writeMarkdown(skillMarkdownPath, candidateToMarkdown(skill));

  candidate.status = "promoted";
  candidate.promoted_skill_id = skill.id;
  candidate.promoted_at = skill.promoted_at;
  await atomicWriteJson(candidatePath, candidate);
  await writeMarkdown(path.join(store, "candidates", `${candidate.id}.md`), candidateToMarkdown(candidate));

  emit(options, {
    command: "promote",
    status: "ok",
    candidate_id: candidate.id,
    skill_id: skill.id,
    paths: {
      skill_json: skillJsonPath,
      skill_markdown: skillMarkdownPath
    }
  }, () => {
    console.log(`Promoted candidate to active skill: ${skill.id}`);
    console.log(`JSON: ${skillJsonPath}`);
    console.log(`Markdown: ${skillMarkdownPath}`);
  });
}

export async function deriveSkill(options = {}) {
  const parentId = requireOption(options.skill, "--skill");
  const store = resolveStore(options.store);
  await ensureStore(store);
  const found = await findSkillRecord(store, parentId);
  if (!found || found.kind === "failure") throw new Error(`Parent skill or candidate not found: ${parentId}`);

  const parent = found.record;
  const name = optionText(options.name, `${parent.name} Derived Candidate`);
  const now = new Date().toISOString();
  const derived = {
    ...parent,
    id: `${parent.id}.derived-${Date.now().toString(36)}`,
    name,
    status: "candidate",
    visibility: "private",
    summary: optionText(options.summary, parent.summary),
    reusable_pattern: optionList(options.pattern, parent.reusable_pattern || []),
    applies_to: optionList(options.appliesTo, parent.applies_to || []),
    do_not_apply_to: optionList(options.doNotApplyTo, parent.do_not_apply_to || []),
    source: {
      ...(parent.source || {}),
      derived_from: parent.id,
      derived_at: now
    },
    lineage: {
      parent_id: parent.id,
      evolution_type: "DERIVED",
      created_at: now
    },
    metrics: {
      applied_count: 0,
      accepted_count: 0,
      revise_count: 0,
      blocked_count: 0,
      last_used_at: null
    }
  };
  delete derived.promoted_at;
  delete derived.promoted_skill_id;
  delete derived.exported_at;
  delete derived.review;
  delete derived.rejected_at;
  delete derived.rejected_reason;
  delete derived.archived_at;
  delete derived.archive_reason;

  const jsonPath = path.join(store, "candidates", `${derived.id}.json`);
  const markdownPath = path.join(store, "candidates", `${derived.id}.md`);
  await atomicWriteJson(jsonPath, derived);
  await writeMarkdown(markdownPath, candidateToMarkdown(derived));

  emit(options, {
    command: "derive",
    status: "ok",
    parent_id: parent.id,
    candidate_id: derived.id,
    paths: {
      json: jsonPath,
      markdown: markdownPath
    }
  }, () => {
    console.log(`Derived candidate: ${derived.id}`);
    console.log(`Parent: ${parent.id}`);
    console.log(`JSON: ${jsonPath}`);
    console.log(`Markdown: ${markdownPath}`);
  });
}

export async function rejectCandidate(options = {}) {
  const candidateId = requireOption(options.candidate || options.skill, "--candidate");
  const store = resolveStore(options.store);
  await ensureStore(store);
  const candidatePath = path.join(store, "candidates", `${candidateId}.json`);
  const candidate = await readJsonIfExists(candidatePath);
  if (!candidate) throw new Error(`Candidate not found: ${candidateId}`);

  candidate.status = "rejected";
  candidate.rejected_at = new Date().toISOString();
  candidate.rejected_reason = optionText(options.reason, "Not specified.");
  await atomicWriteJson(candidatePath, candidate);
  await writeMarkdown(path.join(store, "candidates", `${candidate.id}.md`), candidateToMarkdown(candidate));

  emit(options, {
    command: "reject",
    status: "ok",
    candidate_id: candidate.id,
    reason: candidate.rejected_reason
  }, () => {
    console.log(`Rejected candidate: ${candidate.id}`);
    console.log(`Reason: ${candidate.rejected_reason}`);
  });
}

export async function archiveRecord(options = {}) {
  const id = requireOption(options.skill || options.candidate || options.id, "--skill or --candidate");
  const store = resolveStore(options.store);
  await ensureStore(store);
  const found = await findSkillRecord(store, id);
  if (!found || found.kind === "failure") throw new Error(`Skill or candidate not found: ${id}`);

  found.record.status = "archived";
  found.record.archived_at = new Date().toISOString();
  found.record.archive_reason = optionText(options.reason, "Not specified.");
  await atomicWriteJson(found.path, found.record);
  const markdownPath = found.path.replace(/\.json$/, ".md");
  await writeMarkdown(markdownPath, candidateToMarkdown(found.record));

  emit(options, {
    command: "archive",
    status: "ok",
    id,
    kind: found.kind,
    reason: found.record.archive_reason
  }, () => {
    console.log(`Archived ${found.kind}: ${id}`);
    console.log(`Reason: ${found.record.archive_reason}`);
  });
}

export async function evolveSkill(options = {}) {
  const skillId = requireOption(options.skill, "--skill");
  const failurePath = requireOption(options.from, "--from");
  const store = resolveStore(options.store);
  await ensureStore(store);

  const found = await findSkillRecord(store, skillId);
  if (!found) {
    throw new Error(`Skill or candidate not found: ${skillId}`);
  }

  const absoluteFailurePath = path.resolve(failurePath);
  const failureText = await fs.readFile(absoluteFailurePath, "utf8");
  const scan = privacyScan(failureText);
  const failure = buildFailure(failureText, {
    sourcePath: absoluteFailurePath,
    skillId,
    privacyFindings: scan.findings
  });

  const failureJsonPath = path.join(store, "failures", `${failure.id}.json`);
  const failureMarkdownPath = path.join(store, "failures", `${failure.id}.md`);
  await atomicWriteJson(failureJsonPath, failure);
  await writeMarkdown(failureMarkdownPath, failureToMarkdown(failure));

  const evolved = {
    ...found.record,
    id: `${found.record.id}.fix-${Date.now().toString(36)}`,
    name: `${found.record.name} Fix Candidate`,
    status: "candidate",
    visibility: "private",
    source: {
      ...(found.record.source || {}),
      failure_paths: [absoluteFailurePath]
    },
    lineage: {
      parent_id: found.record.id,
      evolution_type: "FIX",
      failure_id: failure.id,
      created_at: new Date().toISOString()
    },
    evolution_notes: [
      ...(found.record.evolution_notes || []),
      failure.avoid_next_time
    ].filter(Boolean)
  };

  const evolvedPath = path.join(store, "candidates", `${evolved.id}.json`);
  await atomicWriteJson(evolvedPath, evolved);
  await writeMarkdown(path.join(store, "candidates", `${evolved.id}.md`), candidateToMarkdown(evolved));

  emit(options, {
    command: "evolve",
    status: "ok",
    skill_id: skillId,
    failure_id: failure.id,
    evolved_candidate_id: evolved.id,
    paths: {
      failure_json: failureJsonPath,
      failure_markdown: failureMarkdownPath,
      candidate_json: evolvedPath,
      candidate_markdown: path.join(store, "candidates", `${evolved.id}.md`)
    },
    privacy: privacySummary(scan)
  }, () => {
    console.log(`Recorded failure: ${failure.id}`);
    console.log(`Created evolution candidate: ${evolved.id}`);
    printPrivacySummary(scan);
  });
}

export async function exportCandidate(options = {}) {
  const skillId = requireOption(options.publicCandidate, "--public-candidate");
  const store = resolveStore(options.store);
  await ensureStore(store);

  const candidatePath = path.join(store, "candidates", `${skillId}.json`);
  const candidate = await readJsonIfExists(candidatePath);
  if (!candidate) {
    throw new Error(`Candidate not found: ${skillId}`);
  }

  candidate.visibility = "public_candidate";
  candidate.exported_at = new Date().toISOString();
  await atomicWriteJson(candidatePath, candidate);

  const draft = skillDraftToMarkdown(candidate);
  const scan = privacyScan(draft);
  const exportDir = path.join(store, "exports", skillId);
  await fs.mkdir(exportDir, { recursive: true });
  const outputPath = path.join(exportDir, "SKILL.md");
  await writeMarkdown(outputPath, draft);

  emit(options, {
    command: "export",
    status: "ok",
    candidate_id: skillId,
    output_path: outputPath,
    privacy: privacySummary(scan)
  }, () => {
    console.log(`Exported public candidate draft: ${outputPath}`);
    printPrivacySummary(scan);
  });
}

export async function scanPrivacy(options = {}) {
  const store = resolveStore(options.store);
  await ensureStore(store);
  const targetPath = options.path && options.path !== true ? path.resolve(options.path) : null;
  const id = options.skill || options.candidate || options.id;
  let text = "";
  let target = "";

  if (targetPath) {
    text = await fs.readFile(targetPath, "utf8");
    target = targetPath;
  } else if (id && id !== true) {
    const found = await findSkillRecord(store, id);
    if (!found) throw new Error(`Record not found: ${id}`);
    text = JSON.stringify(found.record, null, 2);
    target = id;
  } else {
    throw new Error("Missing scan target. Use --path <file> or --skill <id>.");
  }

  const scan = privacyScan(text);
  emit(options, {
    command: "scan",
    status: "ok",
    target,
    privacy: privacySummary(scan)
  }, () => {
    console.log(`Privacy scan target: ${target}`);
    printPrivacySummary(scan);
  });
}

export async function validateStore(options = {}) {
  const store = resolveStore(options.store);
  await ensureStore(store);
  const records = await loadAllRecords(store);
  const issues = validateAll(records);

  emit(options, {
    command: "validate",
    status: issues.length === 0 ? "ok" : "error",
    checked_count: records.length,
    issue_count: issues.length,
    issues
  }, () => {
    console.log(`Validated records: ${records.length}`);
    if (issues.length === 0) {
      console.log("Validation: ok");
      return;
    }
    console.log(`Validation issues: ${issues.length}`);
    for (const item of issues) {
      console.log(`- ${item.severity} ${item.kind} ${item.id} ${item.field}: ${item.message}`);
    }
  });

  if (issues.length > 0) process.exitCode = 1;
}

export async function reportStore(options = {}) {
  const store = resolveStore(options.store);
  await ensureStore(store);
  const records = await loadAllRecords(store);
  const skills = records.filter((item) => item.kind === "skill");
  const candidates = records.filter((item) => item.kind === "candidate");
  const failures = records.filter((item) => item.kind === "failure");
  const metrics = aggregateMetrics([...skills, ...candidates].map((item) => item.record));
  const byStatus = countBy(records, (item) => item.record.status || "recorded");

  emit(options, {
    command: "report",
    status: "ok",
    counts: {
      skills: skills.length,
      candidates: candidates.length,
      failures: failures.length,
      by_status: byStatus
    },
    metrics
  }, () => {
    console.log("FlowSkill report");
    console.log(`Skills: ${skills.length}`);
    console.log(`Candidates: ${candidates.length}`);
    console.log(`Failures: ${failures.length}`);
    console.log(`Status: ${JSON.stringify(byStatus)}`);
    console.log(`Metrics: ${JSON.stringify(metrics)}`);
  });
}

function requireOption(value, name) {
  if (!value || value === true) {
    throw new Error(`Missing required option ${name}`);
  }
  return value;
}

function optionText(value, fallback) {
  return value && value !== true ? value : fallback;
}

function optionList(value, fallback) {
  if (!value || value === true) return fallback;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferScoreEvent(options) {
  if (options.event && options.event !== true) return options.event;
  if (options.accepted) return "accepted";
  if (options.revise) return "revise";
  if (options.blocked) return "blocked";
  return "applied";
}

function printPrivacySummary(scan) {
  const summary = privacySummary(scan);
  if (summary.findings.length === 0) {
    console.log("Privacy scan: no findings.");
    return;
  }
  console.log(`Privacy scan: ${summary.findings.length} finding(s). Review before public export:`);
  for (const finding of summary.findings) {
    console.log(`- ${finding.severity} ${finding.type}: ${finding.message}`);
  }
}

function privacySummary(scan) {
  const findings = scan.findings || [];
  return {
    finding_count: findings.length,
    public_export_ready: !findings.some((finding) => ["critical", "high"].includes(finding.severity)),
    findings
  };
}

function emit(options, payload, textPrinter = null) {
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (textPrinter) textPrinter();
}

async function loadAllRecords(store) {
  const [skills, candidates, failures] = await Promise.all([
    readJsonRecords(path.join(store, "skills")),
    readJsonRecords(path.join(store, "candidates")),
    readJsonRecords(path.join(store, "failures"))
  ]);
  return [
    ...skills.map((item) => ({ ...item, kind: "skill" })),
    ...candidates.map((item) => ({ ...item, kind: "candidate" })),
    ...failures.map((item) => ({ ...item, kind: "failure" }))
  ];
}

function aggregateMetrics(records) {
  const metrics = {
    applied_count: 0,
    accepted_count: 0,
    revise_count: 0,
    blocked_count: 0
  };
  for (const record of records) {
    for (const key of Object.keys(metrics)) {
      metrics[key] += record.metrics?.[key] || 0;
    }
  }
  return metrics;
}

function countBy(items, getter) {
  const counts = {};
  for (const item of items) {
    const key = getter(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function parseStructuredEvidence(evidencePath, text) {
  if (!evidencePath.toLowerCase().endsWith(".json")) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
