import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { sectors, screenId } from "../apps/shared/catalog.mjs";

test("HTTP server serves both apps and every screen without exposing source files", async (t) => {
  const child = spawn(process.execPath, ["scripts/serve.mjs", "--port", "0"], {
    cwd: new URL("../", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  const [output] = await once(child.stdout, "data");
  const base = output.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(base);
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /현장의 데이터를/);
  for (const [sector, product] of Object.entries(sectors))
    for (let n = 1; n <= product.names.length; n++) {
      const page = await fetch(`${base}/${sector}/${screenId(sector, n)}.html`);
      assert.equal(page.status, 200);
      assert.match(page.headers.get("content-type"), /text\/html/);
    }
  const css = await fetch(`${base}/small-business/assets/app.css`, {
    method: "HEAD",
  });
  assert.equal(css.status, 200);
  assert.match(css.headers.get("content-type"), /text\/css/);
  assert.equal((await fetch(`${base}/.git/config`)).status, 404);
  assert.equal((await fetch(`${base}/README.md`)).status, 404);
  assert.equal((await fetch(base, { method: "POST" })).status, 405);
});
