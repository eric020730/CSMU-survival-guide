export const categoryNames = ['值班', '上班', '生活'];
export const fields = ['title', 'category', 'date', 'summary', 'tags', 'body'];
export const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalizeDraft(value, today) {
  const draft = Object.fromEntries(fields.map(name => [name, typeof value?.[name] === 'string' ? value[name] : '']));
  if (!categoryNames.includes(draft.category)) draft.category = '值班';
  if (!draft.date) draft.date = today;
  return draft;
}
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function publicationErrors(draft) {
  const errors = {};
  if (!draft.title.trim()) errors.title = '請先給這篇紀錄一個標題。';
  else if (draft.title.length > 100) errors.title = '標題請控制在 100 字以內。';
  if (!draft.body.trim()) errors.body = '請寫下想保留的內容。';
  if (!validDate(draft.date)) errors.date = '請選擇有效的紀錄日期。';
  return errors;
}
export function noteMarkdown(draft, { backup = false, today } = {}) {
  const incomplete = Object.keys(publicationErrors(draft)).length > 0;
  const date = validDate(draft.date) ? draft.date : today;
  const tags = draft.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
  return `---\ntitle: ${JSON.stringify(draft.title.trim() || '未命名草稿')}\ncategory: ${JSON.stringify(draft.category)}\ndate: ${date}\ntags: ${JSON.stringify(tags)}\nsummary: ${JSON.stringify(draft.summary.trim())}\n${backup && incomplete ? 'draft: true\n' : ''}---\n\n${draft.body.trim()}\n`;
}
export function filterNotes(notes, {category = '全部', query = '', sort = 'newest'} = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return notes.filter(note => {
    const text = [note.title, note.summary, ...note.tags, note.searchText].join(' ').toLocaleLowerCase();
    return (category === '全部' || note.category === category) && terms.every(term => text.includes(term));
  }).sort((a,b) => (sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));
}
export function readingMinutes(text) {
  const cjk = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const words = (text.replace(/[\u3400-\u9fff]/g,' ').match(/\S+/g) ?? []).length;
  return Math.max(1, Math.ceil(cjk / 500 + words / 250));
}
