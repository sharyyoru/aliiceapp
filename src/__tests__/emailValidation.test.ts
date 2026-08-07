/**
 * Email Validation Tests
 *
 * Guards the reply_to / recipient validation added to src/lib/email.ts so that
 * malformed addresses can never be sent to Resend (which rejects the whole
 * request with "Invalid reply_to field").
 *
 * Run manually with: npx tsx src/__tests__/emailValidation.test.ts
 */

import { isValidEmail } from "@/lib/email";

type Case = { input: unknown; expected: boolean; label: string };

const cases: Case[] = [
  { input: "patient@example.com", expected: true, label: "simple valid address" },
  { input: "reply+abc123@maisontoa.com", expected: true, label: "plus-addressing (reply alias)" },
  { input: "  spaced@example.com  ", expected: true, label: "valid with surrounding whitespace" },
  { input: "hh@clinic-beethoven-strasse-ag.ch", expected: true, label: "hyphenated domain" },
  { input: "", expected: false, label: "empty string" },
  { input: "not-an-email", expected: false, label: "missing @ and domain" },
  { input: "no-domain@", expected: false, label: "missing domain" },
  { input: "@no-local.com", expected: false, label: "missing local part" },
  { input: "spaces in@example.com", expected: false, label: "space in local part" },
  { input: "two@@example.com", expected: false, label: "double @" },
  { input: "name@nodot", expected: false, label: "domain without TLD" },
  { input: null, expected: false, label: "null" },
  { input: undefined, expected: false, label: "undefined" },
  { input: 12345, expected: false, label: "non-string" },
];

console.log("=== Email Validation Tests ===\n");

let passed = 0;
let failed = 0;

for (const { input, expected, label } of cases) {
  const actual = isValidEmail(input);
  const ok = actual === expected;
  if (ok) passed += 1;
  else failed += 1;
  console.log(
    `  ${ok ? "PASSED ✓" : "FAILED ✗"} ${label} -> expected ${expected}, got ${actual}`,
  );
}

console.log("\n=== Test Summary ===");
console.log(`Total tests: ${cases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`\nOverall: ${failed === 0 ? "ALL TESTS PASSED ✓" : "SOME TESTS FAILED ✗"}`);

if (failed > 0) {
  process.exit(1);
}
