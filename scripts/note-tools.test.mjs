import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDraft, publicationErrors, noteMarkdown, filterNotes, readingMinutes } from '../public/note-tools.mjs';
import { parseNote } from './content.mjs';
const today = '2026-10-12';
const draft = {title:'保留原來的草稿',category:'生活',date:today,summary:'一段摘要',tags:'甲, 乙，丙',body:'## 重點\n\n我的原文。'};
test('Original v1 draft text and optional fields remain intact', () => {
  assert.deepEqual(normalizeDraft(draft,today),draft);
  assert.equal(normalizeDraft({...draft,category:'unknown'},today).body,draft.body);
});
test('Incomplete backups remain drafts and cannot accidentally become published notes', () => {
  const incomplete = normalizeDraft({body:'還沒寫完'},today);
  const source = noteMarkdown(incomplete,{backup:true,today});
  assert.match(source,/draft: true/);
  assert.match(source,/還沒寫完/);
  assert.equal(parseNote('backup.md',source),null);
  assert.deepEqual(Object.keys(publicationErrors(incomplete)),['title']);
});
test('Publication Markdown round-trips categories, punctuation, tags and body', () => {
  const note = parseNote('note.md',noteMarkdown(draft));
  assert.equal(note.title,draft.title);
  assert.equal(note.category,'生活');
  assert.deepEqual(note.tags,['甲','乙','丙']);
  assert.match(note.html,/<h2>重點<\/h2>/);
});
test('Filter combines category, multiple terms and deterministic date order', () => {
  const notes = [
    {id:'a',title:'夜班紀錄',category:'值班',date:today,summary:'',tags:['交班'],searchText:'隨身物品'},
    {id:'b',title:'上班紀錄',category:'上班',date:'2026-10-11',summary:'',tags:[],searchText:'其他'},
  ];
  assert.deepEqual(filterNotes(notes,{query:'交班 隨身'}).map(n=>n.id),['a']);
  assert.equal(filterNotes(notes,{category:'生活'}).length,0);
  assert.deepEqual(filterNotes(notes,{sort:'oldest'}).map(n=>n.id),['b','a']);
});
test('Invalid calendar dates and whitespace fail publication but still export safely', () => {
  const bad = {...draft,title:'  ',date:'2026-02-30',body:'  '};
  assert.deepEqual(Object.keys(publicationErrors(bad)),['title','body','date']);
  assert.match(noteMarkdown(bad,{backup:true,today}),/date: 2026-10-12/);
});
test('Reading-time estimates support Chinese and English without zero minutes', () => {
  assert.equal(readingMinutes(''),1);
  assert.equal(readingMinutes('中'.repeat(1000)),2);
  assert.equal(readingMinutes('word '.repeat(750)),3);
});
