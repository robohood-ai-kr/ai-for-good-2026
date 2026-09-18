// Build Output API v3: publish an explicit file allowlist, never the repository root.
import { mkdir, mkdtemp, readFile, writeFile, copyFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sectors, screenId } from '../apps/shared/catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export function publicPaths() {
  const paths = ['index.html'];
  for (const [sector, spec] of Object.entries(sectors)) {
    paths.push(`${sector}/index.html`, `${sector}/image-gallery.html`, `${sector}/screens.json`);
    for (const asset of ['app.css', 'app.mjs', 'state.mjs', sector === 'manufacturing' ? 'rgb-part.png' : 'tray-task.png']) paths.push(`${sector}/assets/${asset}`);
    for (let n = 1; n <= spec.names.length; n++) {
      const id = screenId(sector, n);
      paths.push(`${sector}/${id}.html`, `${sector}/references/${id}.png`);
    }
  }
  return paths;
}

export const outputConfig = {
  version: 3,
  routes: [
    { src: '/(.*)', headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY', 'Cache-Control': 'public, max-age=0, must-revalidate' }, continue: true },
    { src: '/(.*)\\.mjs$', headers: { 'Content-Type': 'text/javascript; charset=utf-8' }, continue: true },
    { src: '^/$', dest: '/index.html' },
    { src: '^/(manufacturing|small-business)$', headers: { Location: '/$1/' }, status: 308 },
    { src: '^/(manufacturing|small-business)/$', dest: '/$1/index.html' },
    { handle: 'filesystem' },
    { src: '/.*', status: 404, dest: '/404.html' }
  ]
};

export async function prepare() {
  await mkdir(resolve(root, 'tmp'), { recursive: true });
  const directory = await mkdtemp(resolve(root, 'tmp/vercel-robohood-v1-'));
  const output = resolve(directory, '.vercel/output'), staticRoot = resolve(output, 'static');
  const files = [];
  for (const path of [...publicPaths(), '404.html']) {
    const source = resolve(root, path === '404.html' ? 'deploy/404.html' : `dist/${path}`);
    if (!(await lstat(source)).isFile()) throw Error(`Refuse non-regular file: ${path}`);
    const content = await readFile(source);
    if (/\.(html|mjs|css|json)$/.test(path) && /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|sbp_[a-zA-Z0-9]{20,}|postgres(?:ql)?:\/\/|-----BEGIN .*PRIVATE KEY-----|(?:localhost|127\.0\.0\.1):\d+/.test(content.toString())) throw Error(`Unsafe deployment content: ${path}`);
    const target = resolve(staticRoot, path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    files.push({ path, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
  }
  await writeFile(resolve(output, 'config.json'), `${JSON.stringify(outputConfig, null, 2)}\n`);
  // This report lives outside the public output and is never uploaded as a page.
  const report = { directory, preparedAt: new Date().toISOString(), fileCount: files.length, totalBytes: files.reduce((n, f) => n + f.bytes, 0), files };
  await writeFile(resolve(directory, 'deployment-manifest.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(root, 'tmp/vercel-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await prepare();
  console.log(JSON.stringify({ directory: report.directory, files: report.fileCount, bytes: report.totalBytes, format: 'Vercel Build Output API v3' }, null, 2));
}
