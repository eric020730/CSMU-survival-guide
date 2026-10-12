import { mkdir, readdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseNote } from './content.mjs';
import { build } from 'esbuild';
const notes = [];
for (const filename of await readdir('content')) {
  if (!filename.endsWith('.md') || filename === 'README.md') continue;
  const note = parseNote(filename, await readFile(`content/${filename}`, 'utf8'));
  if (note) notes.push(note);
}
notes.sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
await rm('dist', {recursive: true, force: true});
await mkdir('dist', {recursive: true});
await cp('public', 'dist', {recursive: true});
await build({entryPoints:['public/app.js'], bundle:true, splitting:true, format:'esm', platform:'browser', target:['safari16','chrome110'], outdir:'dist', entryNames:'app', chunkNames:'assets/[name]-[hash]', minify:true});
// Browser imports are bundled; do not expose unbundled dependency entry points.
await rm('dist/preview.mjs');
await rm('dist/note-tools.mjs');
await writeFile('dist/notes.json', JSON.stringify(notes));
let commit = process.env.GITHUB_SHA;
if (!commit) { try { commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { commit = 'local'; } }
await writeFile('dist/version.json', JSON.stringify({commit, builtAt: new Date().toISOString(), notes: notes.length}));
console.log(`Built ${notes.length} published notes.`);
