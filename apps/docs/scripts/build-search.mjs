// Builds the Pagefind search index from the prerendered HTML after `next build`.
// Never fails the build: without an index the site works and only search is empty.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const countHtml = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.html')).length
    : 0;

const candidates = [
  '.next/server/app',
  '.vercel/output/static',
  '.vercel/output/functions',
  '../../.vercel/output/static',
  '../../.vercel/output/functions',
];
for (const dir of candidates) {
  console.log(`[search] ${dir}: ${countHtml(dir)} html files`);
}

const site = '.next/server/app';
if (countHtml(site) === 0) {
  console.warn(`[search] no prerendered HTML in ${site}; skipping the search index`);
  process.exit(0);
}

const result = spawnSync(
  'pagefind',
  ['--site', site, '--output-path', 'public/_pagefind'],
  { stdio: 'inherit', shell: true },
);
if (result.status !== 0) {
  console.warn('[search] pagefind failed; continuing without a search index');
}
