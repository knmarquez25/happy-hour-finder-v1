import test from "node:test";
import assert from "node:assert/strict";
import { readPublicMenu, parseMenuPage } from "../server/public-source.js";
test("direct source reading retains footer address instead of dropping it as boilerplate", () => {
  const page = parseMenuPage(
    "<html><title>Noon Bistro</title><body><h2>Happy Hour</h2><p>Domestic $3.50</p><footer>123 Main St, Downey, CA 90242</footer><script>secret script</script></body></html>",
    "text/html",
  );
  assert.match(page.raw_content, /Happy Hour/);
  assert.match(page.raw_content, /Downey/);
  assert.doesNotMatch(page.raw_content, /secret script/);
});
test("private, loopback, metadata, mapped IP and nonstandard-port requests never reach transport", async () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ]) {
    let called = false;
    await assert.rejects(
      readPublicMenu("https://example.com/", {
        resolveHost: async () => [
          { address, family: address.includes(":") ? 6 : 4 },
        ],
        requestImpl: () => {
          called = true;
          throw Error();
        },
      }),
    );
    assert.equal(called, false, address);
  }
  await assert.rejects(readPublicMenu("https://example.com:8080/"));
  await assert.rejects(readPublicMenu("http://example.com/"));
});

test("the HTTPS transport uses the validated public IP and rechecks redirects", async () => {
  const { EventEmitter } = await import("node:events");
  let calls = 0,
    resolutions = 0;
  await assert.rejects(
    readPublicMenu("https://example.com/", {
      resolveHost: async () => [
        {
          address: ++resolutions === 1 ? "93.184.216.34" : "127.0.0.1",
          family: 4,
        },
      ],
      requestImpl: (url, options, onResponse) => {
        calls++;
        options.lookup(url.hostname, { all: true }, (err, rows) => {
          assert.equal(err, null);
          assert.deepEqual(rows, [{ address: "93.184.216.34", family: 4 }]);
        });
        const req = new EventEmitter();
        req.end = () => {
          const res = new EventEmitter();
          res.statusCode = 302;
          res.headers = { location: "https://redirect.example/" };
          res.destroy = () => {};
          onResponse(res);
        };
        return req;
      },
    }),
  );
  assert.equal(calls, 1);
  assert.equal(resolutions, 2);
});
test("oversized public pages stop without returning a menu", async () => {
  const { EventEmitter } = await import("node:events");
  let destroyed = false;
  await assert.rejects(
    readPublicMenu("https://example.com/", {
      resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
      requestImpl: (_url, _options, onResponse) => {
        const req = new EventEmitter();
        req.destroy = (err) => {
          destroyed = true;
          req.emit("error", err);
        };
        req.end = () => {
          const res = new EventEmitter();
          res.statusCode = 200;
          res.headers = { "content-type": "text/html" };
          onResponse(res);
          res.emit("data", Buffer.alloc(1000001));
        };
        return req;
      },
    }),
  );
  assert.equal(destroyed, true);
});
