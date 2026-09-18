import { mkdir, readFile, writeFile, mkdtemp, rename, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
await mkdir(path.join(root, "dist/packages"), { recursive: true });
const manifest = [];
for (const sector of ["manufacturing", "small-business"]) {
  const pages = JSON.parse(await readFile(path.join(root, "dist", sector, "screens.json")));
  const photo = sector === "manufacturing" ? "rgb-part.png" : "tray-task.png";
  const files = [
    "index.html", "image-gallery.html", "screens.json",
    "assets/app.css", "assets/app.mjs", "assets/state.mjs", `assets/${photo}`,
    ...pages.flatMap(page => [`${page.id}.html`, page.reference]),
  ];
  // Package only this build's manifest, not stale files from the preserved importer.
  const filename = `robohood-${sector}-v1-refined.zip`;
  const staging = await mkdtemp(path.join(tmpdir(), "robohood-package-"));
  try {
    const archive = path.join(staging, filename);
    const result = spawnSync("zip", ["-q", archive, ...files], {
      cwd: path.join(root, "dist", sector), encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr || "zip failed");
    await rename(archive, path.join(root, "dist/packages", filename));
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  const data = await readFile(path.join(root, "dist/packages", filename));
  manifest.push({
    file: filename,
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
}
await writeFile(
  path.join(root, "dist/packages/manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log("Packaged two independent refined v1 apps in dist/packages/");
