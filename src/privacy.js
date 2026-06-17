const RULES = [
  {
    type: "windows_absolute_path",
    severity: "high",
    pattern: /[A-Za-z]:\\(?:Users|Documents|Projects|Repos|work|workspace)\\[^\s)]+/g,
    message: "Local Windows path found; replace with a generic placeholder before publishing."
  },
  {
    type: "posix_absolute_path",
    severity: "medium",
    pattern: /\/(?:Users|home|mnt|workspace|private)\/[^\s)]+/g,
    message: "Local POSIX path found; replace with a generic placeholder before publishing."
  },
  {
    type: "api_key_like_secret",
    severity: "critical",
    pattern: /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16})\b/g,
    message: "API key shaped token found; remove it from any candidate or export."
  },
  {
    type: "private_repo_reference",
    severity: "high",
    pattern: /\b(?:git@github\.com:[^\s]+|https:\/\/github\.com\/[^\s]+\/(?:private|internal|client)[^\s]*)/gi,
    message: "Private repository reference found; redact owner, repo, and access details."
  },
  {
    type: "customer_placeholder_review",
    severity: "medium",
    pattern: /\b(?:customer|client|tenant|account|Acme|客户|客户名|公司名|甲方)\b/gi,
    message: "Customer/client wording found; verify names are placeholders, not real customer data."
  },
  {
    type: "chat_log_marker",
    severity: "medium",
    pattern: /\b(?:user:|assistant:|system:|developer:|<environment_context>|<INSTRUCTIONS>)\b/gi,
    message: "Chat transcript marker found; summarize lessons instead of publishing raw conversation."
  }
];

export function privacyScan(text) {
  const findings = [];
  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      findings.push({
        type: rule.type,
        severity: rule.severity,
        message: rule.message,
        sample: redactSample(match[0]),
        index: match.index
      });
    }
  }
  return { findings };
}

function redactSample(value) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
