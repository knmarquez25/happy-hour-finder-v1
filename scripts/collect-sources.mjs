import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { load } from "cheerio";
import robotsParser from "robots-parser";
import { fileURLToPath } from "node:url";

const directory = new URL("../research/cache/", import.meta.url);
const userAgent = "HappyHourFinderClassProject/1.0";
export async function collectSource(url) {
  const target = new URL(url);
  if (target.protocol !== "https:")
    throw new Error("Only public HTTPS sources are supported.");
  await mkdir(directory, { recursive: true });
  const key = createHash("sha256").update(url).digest("hex").slice(0, 20);
  const path = new URL(`${key}.json`, directory);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const policyResponse = await fetch(new URL("/robots.txt", target), {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!policyResponse.ok && policyResponse.status !== 404)
    throw new Error(`Cannot confirm access policy: ${policyResponse.status}`);
  const policy = robotsParser(
    new URL("/robots.txt", target).href,
    policyResponse.status === 404 ? "" : await policyResponse.text(),
  );
  if (policy.isAllowed(url, userAgent) === false)
    throw new Error(
      "Automated collection disallowed by robots policy. Use manual review.",
    );
  const delay = Math.max(1000, (policy.getCrawlDelay(userAgent) || 1) * 1000);
  await new Promise((resolve) => setTimeout(resolve, delay));
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(25000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Source unavailable: ${response.status}. No bypass attempted.`,
    );
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html"))
    throw new Error("Review PDFs and other non-HTML sources manually.");
  const html = await response.text();
  const $ = load(html);
  const structured = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      structured.push(JSON.parse($(element).text()));
    } catch {
      /* Invalid publisher JSON is not evidence. */
    }
  });
  $("script,style,nav,footer,header").remove();
  const result = {
    url,
    accessedOn: "2026-10-19",
    reviewedOn: null,
    title: $("title").text(),
    structured,
    html,
    text: $("body").text().replace(/\s+/g, " ").trim(),
    note: "Collected only. Human review is required before facts become primary-supported.",
  };
  await writeFile(path, JSON.stringify(result, null, 2) + "\n");
  return result;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2])
    throw new Error(
      "Usage: node scripts/collect-sources.mjs https://public-restaurant/menu",
    );
  const result = await collectSource(process.argv[2]);
  console.log(
    JSON.stringify(
      {
        url: result.url,
        title: result.title,
        characters: result.text.length,
        reviewedOn: result.reviewedOn,
      },
      null,
      2,
    ),
  );
}
