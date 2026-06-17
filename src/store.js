import fs from "node:fs/promises";
import path from "node:path";

const STORE_DIRS = [
  "skills",
  "candidates",
  "failures",
  "metrics",
  "schemas",
  "examples",
  "docs",
  "exports"
];

export function resolveStore(storeOption) {
  if (storeOption && storeOption !== true) {
    return path.resolve(storeOption);
  }
  if (process.env.FLOWSKILL_HOME) {
    return path.resolve(process.env.FLOWSKILL_HOME);
  }
  return process.cwd();
}

export async function ensureStore(store) {
  await fs.mkdir(store, { recursive: true });
  await Promise.all(STORE_DIRS.map((dir) => fs.mkdir(path.join(store, dir), { recursive: true })));
}

export async function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

export async function writeMarkdown(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, ensureTrailingNewline(content), "utf8");
}

export async function removeIfExists(filePath) {
  try {
    await fs.rm(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function appendMarkdown(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, ensureTrailingNewline(content), "utf8");
}

export async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function readJsonRecords(directory) {
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const records = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const filePath = path.join(directory, entry.name);
    records.push({ path: filePath, record: JSON.parse(await fs.readFile(filePath, "utf8")) });
  }
  return records;
}

export async function findSkillRecord(store, id) {
  const locations = [
    path.join(store, "skills", `${id}.json`),
    path.join(store, "candidates", `${id}.json`),
    path.join(store, "failures", `${id}.json`)
  ];
  for (const location of locations) {
    const record = await readJsonIfExists(location);
    if (record) return { path: location, record, kind: path.basename(path.dirname(location)).replace(/s$/, "") };
  }
  return null;
}

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}
