#!/usr/bin/env node
import {
  archiveRecord,
  captureCandidate,
  deriveSkill,
  evolveSkill,
  exportCandidate,
  initStore,
  listRecords,
  promoteCandidate,
  rejectCandidate,
  reportStore,
  scanPrivacy,
  scoreSkill,
  searchStore,
  showRecord,
  validateStore
} from "./commands.js";
import { printHelp } from "./help.js";

async function main(argv) {
  const { command, args, options } = parseArgs(argv);

  if (!command || options.help || command === "help") {
    printHelp();
    return;
  }

  switch (command) {
    case "init":
      await initStore(options);
      break;
    case "capture":
      await captureCandidate(options);
      break;
    case "search":
      await searchStore(args.join(" "), options);
      break;
    case "list":
      await listRecords(options);
      break;
    case "show":
      await showRecord(options);
      break;
    case "score":
      await scoreSkill(options);
      break;
    case "promote":
      await promoteCandidate(options);
      break;
    case "derive":
      await deriveSkill(options);
      break;
    case "reject":
      await rejectCandidate(options);
      break;
    case "archive":
      await archiveRecord(options);
      break;
    case "evolve":
      await evolveSkill(options);
      break;
    case "export":
      await exportCandidate(options);
      break;
    case "scan":
      await scanPrivacy(options);
      break;
    case "validate":
      await validateStore(options);
      break;
    case "report":
      await reportStore(options);
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

function parseArgs(argv) {
  const args = [];
  const options = {};
  let command = null;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!command && !token.startsWith("-")) {
      command = token;
      continue;
    }
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        options[toCamelCase(key)] = true;
      } else {
        options[toCamelCase(key)] = next;
        index += 1;
      }
      continue;
    }
    args.push(token);
  }

  return { command, args, options };
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

main(process.argv.slice(2)).catch((error) => {
  console.error(`FlowSkill error: ${error.message}`);
  process.exitCode = 1;
});
