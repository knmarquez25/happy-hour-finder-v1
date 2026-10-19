import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { scoreOutputs } from "../evaluation/rubric.js";

test("empty positive outputs fail; deliberate negatives pass only with no primary results", () => {
  const result = scoreOutputs(
    [
      { id: "yes", negative: false },
      { id: "no", negative: true },
    ],
    { yes: [], no: [] },
    { yes: ["a"], no: [] },
  );
  assert.equal(result.passed, 1);
  assert.equal(result.positivePassed, 0);
  assert.equal(result.negativePassed, 1);
});
test("only independently labeled acceptable venues count as suitable", () => {
  const result = scoreOutputs(
    [{ id: "yes", negative: false }],
    { yes: ["bad", "good", "other"] },
    { yes: ["good"] },
  );
  assert.equal(result.passed, 1);
  assert.equal(result.rows[0].suitable, "good");
});
test("frozen cases have 15 development and 5 held-out distinct IDs", async () => {
  const cases = JSON.parse(
    await readFile(new URL("../evaluation/cases.json", import.meta.url)),
  );
  const holdout = JSON.parse(
    await readFile(new URL("../evaluation/holdout.json", import.meta.url)),
  );
  assert.equal(cases.length, 15);
  assert.equal(holdout.length, 5);
  assert.equal(new Set([...cases, ...holdout].map((c) => c.id)).size, 20);
});
test("a suitable venue with an over-range displayed combo fails; invalid negative output stays nonempty", () => {
  const result = scoreOutputs(
    [
      { id: "yes", negative: false },
      { id: "no", negative: true },
    ],
    { yes: ["good"], no: ["bad"] },
    { yes: ["good"], no: [] },
    { yes: [], no: [] },
  );
  assert.equal(result.passed, 0);
});
