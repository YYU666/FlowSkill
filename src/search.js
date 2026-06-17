import path from "node:path";
import { readJsonRecords } from "./store.js";

export async function searchRecords(store, query) {
  const [skills, candidates] = await Promise.all([
    readJsonRecords(path.join(store, "skills")),
    readJsonRecords(path.join(store, "candidates"))
  ]);
  const terms = tokenize(query);
  const records = [
    ...skills.map((item) => ({ ...item, kind: "skill" })),
    ...candidates.map((item) => ({ ...item, kind: "candidate" }))
  ].filter((item) => {
    if (item.kind === "skill") return item.record.status !== "archived";
    return !["promoted", "rejected", "archived"].includes(item.record.status);
  });

  return records
    .map((item) => ({ ...item, score: scoreRecord(item.record, terms) }))
    .filter((item) => item.score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

function scoreRecord(record, terms) {
  if (terms.length === 0) return 1;
  const weightedText = [
    repeat(record.name, 4),
    repeat(record.summary, 3),
    repeat([record.applies_to, record.tags].flat().join(" "), 3),
    [record.reusable_pattern, record.do_not_apply_to].flat().join(" ")
  ].join(" ").toLowerCase();

  return terms.reduce((score, term) => score + occurrences(weightedText, term), 0);
}

function tokenize(query) {
  return query.toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/).filter(Boolean);
}

function occurrences(text, term) {
  return text.split(term).length - 1;
}

function repeat(value = "", times = 1) {
  return Array(times).fill(value || "").join(" ");
}
