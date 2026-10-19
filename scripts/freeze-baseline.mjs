import { execFileSync } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
const sha = "865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8";
const directory = new URL("../evaluation/baseline/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const name of ["data.js", "scoring.js", "presets.js"]) {
  const target = new URL(name, directory);
  try {
    await access(target);
    throw new Error(`Refusing to overwrite baseline ${name}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(target, execFileSync("git", ["show", `${sha}:src/${name}`]));
}
await writeFile(
  new URL("metadata.json", directory),
  JSON.stringify(
    {
      sha,
      frozenOn: "2026-10-19",
      note: "Unmodified original modules. Match scores are not evaluation accuracy.",
    },
    null,
    2,
  ) + "\n",
);
console.log(`Frozen original modules at ${sha}`);
