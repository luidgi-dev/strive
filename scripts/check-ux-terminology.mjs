import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();

// Keep this conservative: we mostly want to catch copy strings/comments.
const forbiddenPatterns = [
  { label: "`Task` / `Tasks`", regex: /\btask(s)?\b/i, hint: "Use `Ritual` (or `Ritual board`)." },
  { label: "`Streak`", regex: /\bstreak\b/i, hint: "Use `Momentum`." },
  { label: "`Completed`", regex: /\bcompleted\b/i, hint: "Use `Logged`." },
  { label: "`Dashboard`", regex: /\bdashboard\b/i, hint: "Use `The Flow`." },
  // Only the action label. Avoid flagging `done` inside words/variables.
  { label: "`Done` action label", regex: /\bDone\b/, hint: "Use `Logged` or `Nailed it` depending on intent." },
  { label: "`To-do list`", regex: /\bto-?do list\b/i, hint: "Use `Ritual board` / `The Flow`." },
];

const allowedExts = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".json"]);
const excludeDirNames = new Set([
  "node_modules",
  ".next",
  ".git",
  "docs",
  "scripts",
  ".agents",
  ".claude",
  ".junie",
]);

// Only check app/product code paths (avoid repository boilerplate).
const includeRoots = ["app", "components", "lib", "design", "web", "data", "public"];

async function walk(dir) {
  /** @type {string[]} */
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludeDirNames.has(entry.name)) continue;
      results.push(...(await walk(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (allowedExts.has(ext)) results.push(fullPath);
  }
  return results;
}

function findMatchesInText({ text, forbidden }) {
  const lines = text.split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!forbidden.regex.test(line)) continue;
    matches.push({ lineNumber: i + 1, lineContent: line.trimEnd() });
  }
  return matches;
}

async function main() {
  /** @type {{filePath: string, label: string, hint: string, matches: any[]}[]} */
  const findings = [];

  for (const root of includeRoots) {
    const full = path.join(rootDir, root);
    try {
      const stat = await fs.stat(full);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    const files = await walk(full);
    for (const filePath of files) {
      const text = await fs.readFile(filePath, "utf8");
      for (const forbidden of forbiddenPatterns) {
        // Fast pre-check.
        if (!forbidden.regex.test(text)) continue;
        const matches = findMatchesInText({ filePath, text, forbidden });
        if (matches.length) {
          findings.push({ filePath, label: forbidden.label, hint: forbidden.hint, matches });
        }
      }
    }
  }

  if (findings.length === 0) {
    console.log("UX terminology check: OK (no forbidden terms found).");
    return;
  }

  console.error(`UX terminology check: FAILED (${findings.length} finding(s))`);
  for (const finding of findings) {
    console.error(`\nFile: ${path.relative(rootDir, finding.filePath)}`);
    console.error(`Rule: ${finding.label}`);
    console.error(`Hint: ${finding.hint}`);
    for (const m of finding.matches.slice(0, 20)) {
      console.error(`  L${m.lineNumber}: ${m.lineContent}`);
    }
    if (finding.matches.length > 20) {
      console.error(`  ... and ${finding.matches.length - 20} more line(s)`);
    }
  }

  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

