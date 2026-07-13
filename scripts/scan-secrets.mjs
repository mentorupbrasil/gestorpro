import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.endsWith("pnpm-lock.yaml"));

const highSignalPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bsk_(?:live|prod)_[A-Za-z0-9]{16,}\b/,
  /\bsbp_[A-Za-z0-9]{24,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
];

const findings = [];

for (const file of trackedFiles) {
  let content;
  try {
    content = await fs.readFile(file, "utf8");
  } catch {
    continue;
  }

  for (const pattern of highSignalPatterns) {
    if (pattern.test(content)) findings.push(`${file}: ${pattern.source}`);
  }
}

if (findings.length > 0) {
  console.error(`Potential secrets found:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log(`Secret scan passed for ${trackedFiles.length} tracked files.`);
