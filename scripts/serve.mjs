import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const index = process.argv.indexOf("--port");
const port = Number(
  index >= 0 ? process.argv[index + 1] : (process.env.PORT ?? 4173),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let target = path.resolve(root, `.${pathname}`);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if ((await stat(target)).isDirectory())
      target = path.join(target, "index.html");
    const content = await readFile(target);
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("화면을 찾을 수 없습니다. 시작 페이지(/)로 이동해 주세요.");
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is in use. Try npm run preview -- --port 4174`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(`RoboHood v1 → http://127.0.0.1:${server.address().port}`),
);
