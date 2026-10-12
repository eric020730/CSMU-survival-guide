import { parse } from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const categories = ['值班', '上班', '生活'];
export const escapeHTML = (text) => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseNote(filename, source) {
  const id = filename.replace(/\.md$/, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`${filename}: 檔名須使用小寫英文、數字與連字號`);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: 缺少 YAML 設定區塊`);
  const meta = parse(match[1]);
  if (!meta || typeof meta !== 'object') throw new Error(`${filename}: 設定格式錯誤`);
  if (meta.draft === true) return null;
  if (typeof meta.title !== 'string' || !meta.title.trim()) throw new Error(`${filename}: 缺少標題`);
  if (!categories.includes(meta.category)) throw new Error(`${filename}: 分類須是值班、上班或生活`);
  const date = String(meta.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) throw new Error(`${filename}: 日期格式錯誤`);
  if (meta.tags != null && (!Array.isArray(meta.tags) || meta.tags.some(t => typeof t !== 'string'))) throw new Error(`${filename}: tags 須是文字陣列`);
  if (meta.summary != null && typeof meta.summary !== 'string') throw new Error(`${filename}: summary 須是文字`);
  if (!match[2].trim()) throw new Error(`${filename}: 內文不能空白`);
  const html = sanitizeHtml(marked.parse(match[2]), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src','alt','width','height','loading'], a: ['href','title'] },
    allowedSchemes: ['https','http','mailto'],
  });
  return { id, title: meta.title.trim(), category: meta.category, date, tags: meta.tags ?? [], summary: meta.summary ?? '', html, searchText: sanitizeHtml(html, {allowedTags: [], allowedAttributes: {}}) };
}
