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
  // Diagnostic: show where the builder put the prerendered pages.
  for (const root of ['.next', '.vercel', '../../.vercel', '../../.next']) {
    if (!existsSync(root)) continue;
    const hits = readdirSync(root, { recursive: true })
      .map(String)
      .filter((f) => /(^|\/)(sdk|guides)(\.|\/|$)/.test(f) && !f.includes('node_modules'))
      .slice(0, 25);
    console.log(`[search] ${root}:`, hits);
  }
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
