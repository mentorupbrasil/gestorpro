import { readFileSync } from "node:fs";

const reportPath = process.argv[2];
if (!reportPath) {
  console.error("Usage: node scripts/assert-e2e-no-skips.mjs <playwright-json-report>");
  process.exit(2);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));

function walkSuites(suites, acc) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) {
          acc.push({
            ok: result.status === "passed" || result.status === "expected",
            status: result.status,
            title: `${suite.title} › ${spec.title}`,
          });
        }
      }
    }
    walkSuites(suite.suites, acc);
  }
}

const cases = [];
walkSuites(report.suites, cases);

const skipped = cases.filter((item) => item.status === "skipped");
const passed = cases.filter((item) => item.status === "passed" || item.status === "expected");
const failed = cases.filter((item) => item.status === "failed" || item.status === "timedOut");

console.log(
  `E2E auth gate: total=${cases.length} passed=${passed.length} failed=${failed.length} skipped=${skipped.length}`,
);

if (skipped.length > 0) {
  console.error("Authenticated E2E forbids skipped tests:");
  for (const item of skipped.slice(0, 20)) console.error(` - ${item.title}`);
  process.exit(1);
}

if (passed.length === 0) {
  console.error("Authenticated E2E executed zero passed tests.");
  process.exit(1);
}

if (failed.length > 0) {
  process.exit(1);
}
