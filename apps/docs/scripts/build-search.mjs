// Builds the Pagefind search index from the prerendered HTML after `next build`.
// Never fails the build: without an index the site works and only search is empty.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const htmlFiles = (dir, suffix) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(suffix))
    : [];

// A plain `next build` (local, `next start`, `vercel build` from the CLI)
// leaves the pages in .next/server/app and serves the index from public/.
let site = '.next/server/app';
let output = 'public/_pagefind';

if (htmlFiles(site, '.html').length === 0) {
  // Vercel's cloud builder moves the pages into its own output layout during
  // `next build`: .next/output/functions/<page>.prerender-fallback.html, with
  // static files in .next/output/static. Rebuild a plain HTML tree from that.
  const functions = '.next/output/functions';
  const suffix = '.prerender-fallback.html';
  const pages = htmlFiles(functions, suffix).filter((f) => !f.startsWith('_'));
  if (pages.length === 0) {
    console.warn('[search] no prerendered HTML found; skipping the search index');
    process.exit(0);
  }
  site = '.next/search-pages';
  output = '.next/output/static/_pagefind';
  rmSync(site, { recursive: true, force: true });
  for (const page of pages) {
    const target = join(site, page.slice(0, -suffix.length) + '.html');
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(functions, page), target);
  }
}

console.log(`[search] indexing ${site} into ${output}`);
const result = spawnSync('pagefind', ['--site', site, '--output-path', output], {
  stdio: 'inherit',
  shell: true,
});
if (result.status !== 0) {
  console.warn('[search] pagefind failed; continuing without a search index');
}
