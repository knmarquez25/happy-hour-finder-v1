import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fixture, now } from "./fixtures.mjs";

const tool = (name) =>
  fileURLToPath(new URL(`../tools/${name}.mjs`, import.meta.url));

async function withBatch(batch, action) {
  const directory = await mkdtemp(join(tmpdir(), "hh-countywide-test-"));
  try {
    for (const [key, value] of Object.entries(batch)) {
      await writeFile(
        join(directory, `${key === "manifest" ? "batch" : key}.json`),
        JSON.stringify(value),
      );
    }
    await action(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function run(name, directory, extra = []) {
  return spawnSync(
    process.execPath,
    [tool(name), directory, "--now", now, ...extra],
    { encoding: "utf8", timeout: 10000 },
  );
}

test("validation_and_report_clis_read_without_rewriting_staging", async () => {
  await withBatch(fixture(), async (directory) => {
    const names = (await readdir(directory)).sort();
    const before = await Promise.all(
      names.map((name) => readFile(join(directory, name), "utf8")),
    );
    const validation = run("validate", directory);
    assert.equal(validation.status, 0, validation.stderr);
    assert.deepEqual(JSON.parse(validation.stdout).eligibleIds, ["cw-example"]);
    const report = run("report", directory);
    assert.equal(report.status, 0, report.stderr);
    assert.equal(JSON.parse(report.stdout).admitted, 1);
    const markdown = run("report", directory, ["--markdown"]);
    assert.match(markdown.stdout, /Admitted: 1/);
    assert.deepEqual((await readdir(directory)).sort(), names);
    assert.deepEqual(
      await Promise.all(
        names.map((name) => readFile(join(directory, name), "utf8")),
      ),
      before,
    );
  });
});

test("invalid_json_and_bad_options_return_nonzero_exit", async () => {
  await withBatch(fixture(), async (directory) => {
    await writeFile(join(directory, "candidates.json"), "{not json");
    const invalid = run("report", directory);
    assert.notEqual(invalid.status, 0);
    assert.ok(invalid.stderr.length);
    assert.notEqual(run("validate", directory, ["--unknown"]).status, 0);
  });
});

test("imports_have_no_cli_output_or_file_side_effects", async () => {
  const directory = await mkdtemp(join(tmpdir(), "hh-countywide-import-"));
  try {
    const imports = ["validate", "review", "report", "identity"]
      .map(
        (name) =>
          `await import(${JSON.stringify(new URL(`../tools/${name}.mjs`, import.meta.url).href)})`,
      )
      .join(";");
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", imports],
      { cwd: directory, encoding: "utf8", timeout: 10000 },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.deepEqual(await readdir(directory), []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
