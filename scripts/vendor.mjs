import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
const base = new URL("../", import.meta.url);
await mkdir(new URL("src/vendor/", base), { recursive: true });
for (const name of ["latlon-spherical.js", "dms.js"])
  await copyFile(
    new URL(`node_modules/geodesy/${name}`, base),
    new URL(`src/vendor/${name}`, base),
  );
await copyFile(
  new URL("node_modules/geodesy/LICENSE", base),
  new URL("src/vendor/geodesy-LICENSE", base),
);
await copyFile(
  new URL("node_modules/lucide/dist/umd/lucide.min.js", base),
  new URL("src/vendor/lucide.min.js", base),
);
await copyFile(
  new URL("node_modules/lucide/LICENSE", base),
  new URL("src/vendor/lucide-LICENSE", base),
);
const lock = JSON.parse(await readFile(new URL("package-lock.json", base)));
await writeFile(
  new URL("src/vendor/versions.json", base),
  JSON.stringify(
    {
      geodesy: lock.packages["node_modules/geodesy"].version,
      lucide: lock.packages["node_modules/lucide"].version,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Vendored geodesic utility and Lucide browser build with licenses.",
);
