const BASE = '/CSMU-survival-guide/';
const REPO = 'https://github.com/eric020730/CSMU-survival-guide';
const DRAFT_KEY = 'csmu-survival-guide-draft-v1';
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (text) => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let notes = [];
let selectedCategory = '全部';
let loaded = false;
const tagsHTML = tags => tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
function render() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const filtered = notes.filter(note => (selectedCategory === '全部' || note.category === selectedCategory) && [note.title, note.summary, ...note.tags, note.searchText].join(' ').toLocaleLowerCase().includes(query));
  $('#section-title').textContent = selectedCategory === '全部' ? '全部紀錄' : `${selectedCategory}紀錄`;
  $('#result-count').textContent = query ? `找到 ${filtered.length} 篇紀錄` : `${filtered.length} 篇紀錄`;
  for (const button of document.querySelectorAll('.category')) {
    const category = button.dataset.category;
    button.classList.toggle('active', category === selectedCategory);
    button.setAttribute('aria-pressed', String(category === selectedCategory));
    button.querySelector('.count').textContent = category === '全部' ? notes.length : notes.filter(note => note.category === category).length;
  }
  if (!filtered.length) {
    const empty = notes.length === 0 && !query;
    $('#notes').innerHTML = `<div class="empty"><div class="empty-symbol" aria-hidden="true">${empty ? '＋' : '⌕'}</div><h3>${empty ? '第一篇，從一個小訣竅開始。' : query ? '沒有找到相符的紀錄' : '這個分類還沒有紀錄'}</h3><p>${empty ? '點右上方「新增紀錄」，記下想留給自己的經驗。' : query ? '試試其他關鍵字，或清除搜尋看看。' : '之後新增的紀錄，會依分類整理在這裡。'}</p>${query ? '<button class="text-button" id="clear-search">清除搜尋</button>' : ''}</div>`;
    $('#clear-search')?.addEventListener('click', () => { $('#search').value = ''; render(); $('#search').focus(); });
    return;
  }
  $('#notes').innerHTML = filtered.map(note => `<button class="note-item" data-id="${escapeHTML(note.id)}"><span class="note-meta"><span class="note-category">${escapeHTML(note.category)}</span><time datetime="${note.date}">${note.date.replaceAll('-', '.')}</time></span><h3>${escapeHTML(note.title)} <span aria-hidden="true">↗</span></h3>${note.summary ? `<p>${escapeHTML(note.summary)}</p>` : ''}<span class="tags">${tagsHTML(note.tags)}</span></button>`).join('');
}
function route() {
  if (!loaded) return;
  let id;
  try { id = decodeURIComponent(location.hash.replace(/^#note\//, '')); } catch { id = ''; }
  const note = location.hash.startsWith('#note/') ? notes.find(note => note.id === id) : null;
  $('#intro').hidden = Boolean(note);
  $('#collection').hidden = Boolean(note);
  $('#reader').hidden = !note;
  if (note) {
    $('#article-meta').textContent = `${note.category} / ${note.date.replaceAll('-', '.')}`;
    $('#article-title').textContent = note.title;
    $('#article-tags').innerHTML = tagsHTML(note.tags);
    $('#article-body').innerHTML = note.html;
    $('#edit-note').href = `${REPO}/edit/main/content/${encodeURIComponent(note.id)}.md`;
    $('#copy-status').textContent = '';
    document.title = `${note.title} | 中山生存指南`;
    $('#reader').focus({preventScroll: true});
  } else {
    document.title = '中山生存指南 | Eric 的日常筆記';
    render();
    if (location.hash.startsWith('#note/')) {
      $('#notes').innerHTML = '<div class="empty"><h3>這篇紀錄不存在或已移除</h3><p>按「全部紀錄」繼續瀏覽。</p></div>';
    }
  }
}
$('#categories').addEventListener('click', event => {
  const button = event.target.closest('.category');
  if (!button) return;
  selectedCategory = button.dataset.category;
  history.replaceState(null, '', location.pathname + location.search);
  route();
});
$('#search').addEventListener('input', render);
$('#notes').addEventListener('click', event => {
  const button = event.target.closest('[data-id]');
  if (button) { location.hash = `note/${encodeURIComponent(button.dataset.id)}`; window.scrollTo({top: 0}); }
});
$('#back').addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.search);
  route();
  $('#search').focus({preventScroll: true});
});
window.addEventListener('hashchange', route);
$('#copy-link').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); $('#copy-status').textContent = '已複製'; }
  catch { $('#copy-status').textContent = '請複製瀏覽器網址列的連結。'; }
});
const form = $('#note-form');
const fields = ['title', 'category', 'date', 'summary', 'tags', 'body'];
const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Taipei'}).format(new Date());
function draftData() { return Object.fromEntries(fields.map(name => [name, form.elements[name].value])); }
function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData())); $('#draft-status').textContent = '草稿已保留在此瀏覽器，尚未發佈。'; }
  catch { $('#draft-status').textContent = '無法保留本機草稿。關閉前請先下載 Markdown。'; }
}
$('#new-note').addEventListener('click', () => {
  $('#date').value = today();
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    if (draft && typeof draft === 'object') for (const name of fields) if (typeof draft[name] === 'string') form.elements[name].value = draft[name];
  } catch { $('#draft-status').textContent = '無法讀取本機草稿，請重新填寫。'; }
  $('#editor').showModal();
  $('#title').focus();
});
form.addEventListener('input', saveDraft);
form.addEventListener('change', saveDraft);
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
$('#how-to').addEventListener('click', () => $('#help').showModal());
function markdown() {
  const draft = draftData();
  const tags = draft.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
  // JSON strings/arrays are valid YAML and preserve punctuation and newlines safely.
  return `---\ntitle: ${JSON.stringify(draft.title.trim())}\ncategory: ${JSON.stringify(draft.category)}\ndate: ${draft.date}\ntags: ${JSON.stringify(tags)}\nsummary: ${JSON.stringify(draft.summary.trim())}\n---\n\n${draft.body.trim()}\n`;
}
let sessionFilename;
function filename() {
  if (!sessionFilename) sessionFilename = `${$('#date').value}-${crypto.randomUUID().slice(0,8)}.md`;
  return sessionFilename;
}
$('#download').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  const url = URL.createObjectURL(new Blob([markdown()], {type:'text/markdown;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = filename(); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  saveDraft();
  const content = markdown();
  const params = new URLSearchParams({filename: `content/${filename()}`, value: content});
  const url = `${REPO}/new/main?${params}`;
  if (url.length > 16000) {
    $('#draft-status').textContent = '這篇內容較長，請先下載 Markdown，再到 GitHub 的 content 資料夾上傳並提交。';
    return;
  }
  window.open(url, '_blank', 'noopener');
  $('#draft-status').textContent = '已開啟 GitHub；提交並完成發佈後才會更新網站。草稿仍保留在此瀏覽器。';
});
try {
  const response = await fetch(`${BASE}notes.json`, {cache:'no-cache'});
  if (!response.ok) throw new Error('load failed');
  notes = await response.json();
  if (!Array.isArray(notes)) throw new Error('invalid notes');
  loaded = true; route();
} catch {
  $('#result-count').textContent = '紀錄讀取失敗';
  $('#notes').innerHTML = '<div class="empty"><h3>暫時無法讀取紀錄</h3><p>請稍後再試，你的紀錄仍保留在 GitHub。</p><button class="text-button" id="retry">重新讀取</button></div>';
  $('#retry').addEventListener('click', () => location.reload());
}
