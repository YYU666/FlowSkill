export function validateRecord(record, kind = "record") {
  const issues = [];
  requireField(record, "schema_version", issues, kind);
  requireField(record, "id", issues, kind);

  if (record.schema_version !== 1) {
    issues.push(issue(kind, record.id, "schema_version", "schema_version must be 1"));
  }
  if (record.id && !record.id.startsWith("flowskill.")) {
    issues.push(issue(kind, record.id, "id", "id must start with flowskill."));
  }

  if (kind === "candidate") validateCandidate(record, issues);
  if (kind === "skill") validateSkill(record, issues);
  if (kind === "failure") validateFailure(record, issues);

  return issues;
}

export function validateAll(records) {
  return records.flatMap(({ record, kind }) => validateRecord(record, kind));
}

function validateCandidate(record, issues) {
  requireField(record, "name", issues, "candidate");
  requireField(record, "summary", issues, "candidate");
  requireArray(record, "reusable_pattern", issues, "candidate");
  requireArray(record, "applies_to", issues, "candidate");
  if (!["candidate", "promoted", "rejected", "archived"].includes(record.status)) {
    issues.push(issue("candidate", record.id, "status", "candidate status must be candidate/promoted/rejected/archived"));
  }
  validateMetrics(record, issues, "candidate");
  validateLineage(record, issues, "candidate");
}

function validateSkill(record, issues) {
  requireField(record, "name", issues, "skill");
  requireArray(record, "applies_to", issues, "skill");
  if (!["active", "archived"].includes(record.status)) {
    issues.push(issue("skill", record.id, "status", "skill status must be active/archived"));
  }
  validateMetrics(record, issues, "skill");
  validateLineage(record, issues, "skill");
}

function validateFailure(record, issues) {
  requireField(record, "skill_id", issues, "failure");
  requireField(record, "root_cause", issues, "failure");
  requireField(record, "avoid_next_time", issues, "failure");
}

function validateMetrics(record, issues, kind) {
  const metrics = record.metrics || {};
  for (const field of ["applied_count", "accepted_count", "revise_count", "blocked_count"]) {
    if (!Number.isInteger(metrics[field]) || metrics[field] < 0) {
      issues.push(issue(kind, record.id, `metrics.${field}`, "metric must be a non-negative integer"));
    }
  }
}

function validateLineage(record, issues, kind) {
  const lineage = record.lineage || {};
  if (!["CAPTURED", "DERIVED", "FIX"].includes(lineage.evolution_type)) {
    issues.push(issue(kind, record.id, "lineage.evolution_type", "lineage must be CAPTURED/DERIVED/FIX"));
  }
}

function requireField(record, field, issues, kind) {
  if (record[field] === undefined || record[field] === null || record[field] === "") {
    issues.push(issue(kind, record.id, field, `${field} is required`));
  }
}

function requireArray(record, field, issues, kind) {
  if (!Array.isArray(record[field]) || record[field].length === 0) {
    issues.push(issue(kind, record.id, field, `${field} must be a non-empty array`));
  }
}

function issue(kind, id, field, message) {
  return {
    severity: "error",
    kind,
    id: id || "(missing id)",
    field,
    message
  };
}
