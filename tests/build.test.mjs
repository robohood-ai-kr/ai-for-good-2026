import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { sectors, screenId } from "../apps/shared/catalog.mjs";
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

test("all imported source files retain their original checksums", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "design/stitch/v1/manifest.json"), "utf8"),
  );
  assert.deepEqual(manifest.counts, {
    manufacturing: 21,
    "small-business": 20,
  });
  for (const file of manifest.files) {
    const data = await readFile(path.join(root, "design/stitch/v1", file.path));
    assert.equal(
      createHash("sha256").update(data).digest("hex"),
      file.sha256,
      file.path,
    );
  }
  assert.equal(manifest.warnings.length, 1);
  assert.equal(manifest.warnings[0].file, "small-business/sb-01/screen.png");
});
for (const [sector, product] of Object.entries(sectors)) {
  for (let number = 1; number <= product.names.length; number++) {
    const id = screenId(sector, number);
    test(`${id}: compiled screen, local dependencies, safe links and isolated navigation`, async () => {
      const base = path.join(root, "dist", sector),
        html = await readFile(path.join(base, `${id}.html`), "utf8"),
        $ = load(html);
      assert.equal($("html").attr("lang"), "ko");
      const config = JSON.parse($("#rh-config").text());
      assert.equal(config.sector, sector);
      assert.equal(config.id, id);
      assert.equal($("#rh-screen-select option").length, product.names.length);
      assert.equal($("script").length, 2);
      assert.equal($("script[type=module]").attr("src"), "./assets/app.mjs");
      assert.equal($("[id=tailwind-config],iframe,object,embed").length, 0);
      assert.equal($('a[href="#"]').length, 0);
      assert.equal($("#rh-main").length, 1);
      assert.ok(
        !$("meta[name=viewport]").attr("content").includes("user-scalable=no"),
      );
      $("*").each((_, node) => {
        for (const attribute of Object.keys(node.attribs ?? {}))
          assert.ok(!/^on/i.test(attribute), `${id}: ${attribute}`);
      });
      const urls = $("[href],[src],[data-route]")
        .toArray()
        .flatMap((node) =>
          [
            node.attribs.href,
            node.attribs.src,
            node.attribs["data-route"],
          ].filter(Boolean),
        );
      for (const url of urls) {
        if (url.startsWith("https://")) {
          assert.ok(
            /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|lh3\.googleusercontent\.com)(\/|$)/.test(
              url,
            ),
          );
          continue;
        }
        if (url.startsWith("#")) {
          assert.ok(
            $("[id]")
              .toArray()
              .some((node) => node.attribs.id === url.slice(1)),
            `${id}: ${url}`,
          );
          continue;
        }
        assert.ok(url.startsWith("./"), `${id}: ${url}`);
        const target = path.resolve(base, url.split("#")[0]);
        assert.ok(target.startsWith(base + path.sep));
        assert.ok((await stat(target)).isFile(), `${id}: ${url}`);
      }
      const css = await readFile(
        path.join(base, "assets", `${id}.css`),
        "utf8",
      );
      assert.ok(css.length > 5000);
      assert.ok(!/@tailwind\s/.test(css));
    });
  }
}
test("primary request buttons save a task instead of just navigating", async () => {
  for (const [sector, product] of Object.entries(sectors)) {
    const $ = load(
      await readFile(
        path.join(
          root,
          "dist",
          sector,
          `${screenId(sector, product.newPage)}.html`,
        ),
        "utf8",
      ),
    );
    assert.ok($("[data-action=create-task]").length >= 1);
  }
});
test("manufacturing deployment action footer is preserved", async () => {
  const $ = load(
    await readFile(path.join(root, "dist/manufacturing/mf-14.html"), "utf8"),
  );
  assert.equal($("#btn-run-sim").attr("data-action"), "simulate");
});
