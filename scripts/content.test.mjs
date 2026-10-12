import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNote } from './content.mjs';
const source = (extra='', body='## 重點\n\n真實經驗。') => `---\ntitle: 測試紀錄\ncategory: 值班\ndate: 2026-10-12\ntags: [交班]\n${extra}\n---\n${body}`;
test('Valid notes retain category, tags, Markdown and searchable text', () => {
  const note = parseNote('test-note.md', source());
  assert.equal(note.category, '值班');
  assert.deepEqual(note.tags, ['交班']);
  assert.match(note.html, /<h2>重點<\/h2>/);
  assert.match(note.searchText, /真實經驗/);
});
test('Drafts are excluded', () => assert.equal(parseNote('draft.md', source('draft: true')), null));
test('Invalid category or calendar date fails before publication', () => {
  assert.throws(() => parseNote('note.md', source().replace('值班','其他')), /分類/);
  assert.throws(() => parseNote('note.md', source().replace('2026-10-12','2026-02-30')), /日期/);
});
test('Markdown strips executable HTML and unsafe links', () => {
  const note = parseNote('note.md', source('', '<script>alert(1)</script><img src="x" onerror="alert(1)">\n\n[bad](javascript:alert)'));
  assert.doesNotMatch(note.html, /script|onerror|javascript:/);
});
