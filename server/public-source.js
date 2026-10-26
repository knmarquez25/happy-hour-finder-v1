import https from "node:https";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { load } from "cheerio";
import { publicUrl } from "../src/candidates.js";
const forbidden = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
])
  forbidden.addSubnet(address, prefix, "ipv4");
const global6 = new BlockList();
global6.addSubnet("2000::", 3, "ipv6");
for (const [address, prefix] of [
  ["2001:db8::", 32],
  ["2001::", 32],
  ["2002::", 16],
])
  forbidden.addSubnet(address, prefix, "ipv6");
function safeAddress(address) {
  const family = isIP(address);
  return family === 4
    ? !forbidden.check(address, "ipv4")
    : family === 6 &&
        global6.check(address, "ipv6") &&
        !forbidden.check(address, "ipv6");
}
export function parseMenuPage(body, type) {
  if (type.includes("text/plain"))
    return { title: "Public menu page", raw_content: body.slice(0, 100000) };
  const $ = load(body);
  const title = $("title").first().text().trim().slice(0, 200);
  $("script,style,noscript,svg").remove();
  $("br").replaceWith("\n");
  $("p,div,li,section,footer,h1,h2,h3,h4").append("\n");
  return {
    title,
    raw_content: $("body")
      .text()
      .replace(/[\t ]+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim()
      .slice(0, 100000),
  };
}
// Pins a validated public DNS answer into the HTTPS connection. Each redirect is
// checked anew; no cookies, credentials, proxy, custom ports or private IPs.
export async function readPublicMenu(
  value,
  { resolveHost = lookup, requestImpl = https.request } = {},
) {
  let next = publicUrl(value);
  for (let hop = 0; hop < 4; hop++) {
    const url = new URL(next);
    if (
      (url.port && url.port !== "443") ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)
    )
      throw Error("Use a public HTTPS menu page.");
    let timer;
    const addresses = await Promise.race([
      resolveHost(url.hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error("Menu lookup timed out.")), 8000);
        timer.unref?.();
      }),
    ]).finally(() => clearTimeout(timer));
    if (!addresses.length || addresses.some((r) => !safeAddress(r.address)))
      throw Error("Private network sources are not allowed.");
    const page = await new Promise((resolve, reject) => {
      const req = requestImpl(
        url,
        {
          method: "GET",
          agent: false,
          signal: AbortSignal.timeout(10000),
          headers: {
            "User-Agent": "HappyHourFinder/1.0 (public menu source reader)",
            Accept: "text/html,text/plain;q=0.9",
          },
          lookup(_host, options, callback) {
            const available = addresses.filter(
              (r) =>
                !options.family ||
                options.family === 0 ||
                r.family === options.family,
            );
            if (!available.length)
              return callback(Error("No supported public address."));
            if (options.all) callback(null, available);
            else callback(null, available[0].address, available[0].family);
          },
        },
        (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
            res.destroy();
            resolve({ redirect: res.headers.location });
            return;
          }
          const type = String(res.headers["content-type"] || "").toLowerCase();
          if (res.statusCode !== 200 || !/text\/(?:html|plain)/.test(type)) {
            res.destroy();
            reject(Error("Not a readable HTML menu."));
            return;
          }
          const chunks = [];
          let bytes = 0;
          res.on("data", (chunk) => {
            bytes += chunk.length;
            if (bytes > 1000000) req.destroy(Error("Menu page is too large."));
            else chunks.push(chunk);
          });
          res.on("error", reject);
          res.on("end", () =>
            resolve({ body: Buffer.concat(chunks).toString("utf8"), type }),
          );
        },
      );
      req.on("error", reject);
      req.end();
    });
    if (Object.hasOwn(page, "redirect")) {
      if (!page.redirect) throw Error("Unreadable redirect.");
      next = publicUrl(new URL(page.redirect, url).href);
      continue;
    }
    return { ...parseMenuPage(page.body, page.type), url: next };
  }
  throw Error("Too many redirects.");
}
