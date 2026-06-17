import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const store = path.join(root, "examples", ".flowskill-smoke");
const cli = path.join(root, "src", "cli.js");

fs.rmSync(store, { recursive: true, force: true });

function run(args) {
  return execFileSync(process.execPath, [cli, ...args, "--store", store], {
    cwd: root,
    encoding: "utf8"
  });
}

run(["init"]);
const captureOutput = run(["capture", "--evidence", path.join(root, "examples", "accepted-report.md")]);
const candidateId = captureOutput.match(/Captured candidate: (flowskill\.[^\s]+)/)?.[1];
assert.ok(candidateId, "capture should print candidate id");

const jsonCapture = JSON.parse(run(["capture", "--evidence", path.join(root, "examples", "accepted-report.md"), "--json"]));
assert.equal(jsonCapture.command, "capture", "capture --json emits command envelope");
assert.ok(jsonCapture.candidate_id, "capture --json emits candidate id");

assert.ok(fs.existsSync(path.join(store, "candidates", `${candidateId}.json`)), "candidate JSON exists");
assert.ok(fs.existsSync(path.join(store, "candidates", `${candidateId}.md`)), "candidate Markdown exists");
const candidate = JSON.parse(fs.readFileSync(path.join(store, "candidates", `${candidateId}.json`), "utf8"));
assert.ok(candidate.reusable_pattern.length >= 4, "candidate keeps individual reusable steps");

const searchOutput = run(["search", "frontend visual qa"]);
assert.match(searchOutput, new RegExp(candidateId), "search returns candidate");
const jsonSearch = JSON.parse(run(["search", "frontend visual qa", "--json"]));
assert.ok(Array.isArray(jsonSearch.results), "search --json emits result array");
assert.ok(jsonSearch.results.length >= 1, "search --json returns at least one result");

const structuredCapture = JSON.parse(run(["capture", "--evidence", path.join(root, "examples", "accepted-evidence-packet.json"), "--json"]));
assert.ok(structuredCapture.candidate_id, "structured evidence capture emits candidate id");

const showOutput = JSON.parse(run(["show", "--id", candidateId, "--json"]));
assert.equal(showOutput.record.id, candidateId, "show returns record");

const listOutput = JSON.parse(run(["list", "--json"]));
assert.ok(listOutput.records.some((record) => record.id === candidateId), "list returns candidate");

const scoreOutput = run(["score", "--skill", candidateId, "--accepted"]);
assert.match(scoreOutput, /accepted_count": 1/, "score increments accepted count");

const promoteOutput = JSON.parse(run(["promote", "--candidate", candidateId, "--json"]));
assert.equal(promoteOutput.skill_id, candidateId, "promote keeps stable skill id");
assert.ok(fs.existsSync(path.join(store, "skills", `${candidateId}.json`)), "promoted skill JSON exists");

const activeSearch = JSON.parse(run(["search", "frontend visual qa", "--json"]));
assert.ok(activeSearch.results.some((result) => result.kind === "skill" && result.id === candidateId), "search returns promoted active skill");

const deriveOutput = JSON.parse(run([
  "derive",
  "--skill",
  candidateId,
  "--name",
  "Mobile Visual QA Derived Candidate",
  "--applies-to",
  "frontend,mobile,visual-qa",
  "--json"
]));
assert.ok(deriveOutput.candidate_id, "derive creates candidate");

const evolveOutput = run(["evolve", "--skill", candidateId, "--from", path.join(root, "examples", "failure-report.md")]);
assert.match(evolveOutput, /Created evolution candidate:/, "evolve creates candidate");

const exportOutput = run(["export", "--public-candidate", candidateId]);
const exportedPath = exportOutput.match(/Exported public candidate draft: (.+SKILL\.md)/)?.[1]?.trim();
assert.ok(exportedPath && fs.existsSync(exportedPath), "exported SKILL.md exists");

const scanOutput = JSON.parse(run(["scan", "--path", path.join(root, "examples", "accepted-report.md"), "--json"]));
assert.ok(scanOutput.privacy.finding_count >= 1, "scan reports expected fixture privacy findings");

const rejectOutput = JSON.parse(run(["reject", "--candidate", structuredCapture.candidate_id, "--reason", "Fixture rejection", "--json"]));
assert.equal(rejectOutput.candidate_id, structuredCapture.candidate_id, "reject returns candidate id");

const archiveOutput = JSON.parse(run(["archive", "--skill", candidateId, "--reason", "Fixture archive", "--json"]));
assert.equal(archiveOutput.id, candidateId, "archive returns skill id");

const validateOutput = JSON.parse(run(["validate", "--json"]));
assert.equal(validateOutput.issue_count, 0, "validate returns no issues");

const reportOutput = JSON.parse(run(["report", "--json"]));
assert.ok(reportOutput.counts.skills >= 1, "report counts skills");

console.log("FlowSkill smoke passed.");
