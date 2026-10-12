import {categoryNames, fields, escapeHTML, normalizeDraft, publicationErrors, noteMarkdown, filterNotes, readingMinutes} from './note-tools.mjs';
const BASE = '/CSMU-survival-guide/';
const REPO = 'https://github.com/eric020730/CSMU-survival-guide';
const DRAFT_KEY = 'csmu-survival-guide-draft-v1';
const FILENAME_KEY = 'csmu-survival-guide-draft-filename-v1';
const $ = selector => document.querySelector(selector);
const form = $('#note-form');
const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Taipei'}).format(new Date());
let notes = [], loaded = false, draftInitialized = false, previewRequest = 0;
let sessionFilename, editorReturnURL, listScroll = 0, previousView;
const initialURL = new URL(location.href);
let selectedCategory = categoryNames.includes(initialURL.searchParams.get('category')) ? initialURL.searchParams.get('category') : '全部';
$('#search').value = initialURL.searchParams.get('q') ?? '';
$('#sort').value = initialURL.searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
let archiveURL = location.pathname + location.search;
const icon = name => `<span class="icon icon-${name}" aria-hidden="true"></span>`;
const tagsHTML = tags => tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
function updateFilterURL() {
  const url = new URL(location.href);
  url.hash = '';
  if (selectedCategory !== '全部') url.searchParams.set('category', selectedCategory); else url.searchParams.delete('category');
  const query = $('#search').value.trim();
  if (query) url.searchParams.set('q',query); else url.searchParams.delete('q');
  if ($('#sort').value === 'oldest') url.searchParams.set('sort','oldest'); else url.searchParams.delete('sort');
  archiveURL = url.pathname + url.search;
  history.replaceState(null,'',archiveURL);
}
function renderArchive() {
  if (!loaded) return;
  const query = $('#search').value.trim();
  const filtered = filterNotes(notes,{category:selectedCategory,query,sort:$('#sort').value});
  $('#section-title').textContent = selectedCategory === '全部' ? '所有筆記' : `${selectedCategory}筆記`;
  $('#result-count').textContent = query ? `找到 ${filtered.length} 篇相符紀錄` : `${filtered.length} 篇紀錄`;
  $('#latest-update').textContent = notes.length ? `最近紀錄 ${notes[0].date.replaceAll('-','.')}` : '持續更新中';
  for (const button of document.querySelectorAll('.category')) {
    const category = button.dataset.category;
    button.classList.toggle('active', category === selectedCategory);
    button.setAttribute('aria-pressed', String(category === selectedCategory));
    button.querySelector('.count').textContent = category === '全部' ? notes.length : notes.filter(note => note.category === category).length;
  }
  $('#active-filter').hidden = !query && selectedCategory === '全部';
  $('#filter-description').textContent = [selectedCategory === '全部' ? '' : selectedCategory, query ? `搜尋「${query}」` : ''].filter(Boolean).join(' / ');
  if (!filtered.length) {
    const first = notes.length === 0 && !query && selectedCategory === '全部';
    const heading = first ? '第一篇，從一個小訣竅開始。' : query ? '還沒找到這個關鍵字。' : '這個分類，等你慢慢填滿。';
    const message = first ? '不用一次整理完這幾年的經驗。<br>先留下最近想記住的一件事就好。' : query ? '換個關鍵字，或清除篩選再看看。' : '之後新增的紀錄，會自動整理在這裡。';
    $('#notes').innerHTML = `<div class="empty"><div class="empty-visual">${icon(first ? 'notebook' : 'search')}</div><div><h3>${heading}</h3><p>${message}</p><button class="text-button" id="empty-action">${first ? '寫下第一篇' : query ? '清除篩選' : '新增一篇紀錄'}${icon(first || !query ? 'next' : 'close')}</button></div></div>`;
    $('#empty-action').addEventListener('click', first || !query ? openEditor : clearFilters);
    return;
  }
  $('#notes').innerHTML = filtered.map(note => `<a class="note-item" href="#note/${encodeURIComponent(note.id)}"><div><span class="note-meta"><span class="note-category">${escapeHTML(note.category)}</span><time datetime="${note.date}">${note.date.replaceAll('-','.')}</time><span>約 ${readingMinutes(note.searchText)} 分鐘</span></span><h3>${escapeHTML(note.title)}</h3>${note.summary ? `<p>${escapeHTML(note.summary)}</p>` : ''}<span class="tags">${tagsHTML(note.tags)}</span></div>${icon('next')}</a>`).join('');
}
function clearFilters() {
  selectedCategory = '全部'; $('#search').value = ''; updateFilterURL(); route(); $('#search').focus({preventScroll:true});
}
$('#clear-filters').addEventListener('click',clearFilters);
$('#categories').addEventListener('click',event => {
  const button = event.target.closest('.category'); if (!button) return;
  selectedCategory = button.dataset.category; updateFilterURL(); route();
});
$('#search').addEventListener('input',() => { updateFilterURL(); renderArchive(); });
$('#sort').addEventListener('change',() => { updateFilterURL(); renderArchive(); });
$('#notes').addEventListener('click',event => { if (event.target.closest('.note-item')) listScroll = window.scrollY; });
function showView(view) {
  $('#intro').hidden = view !== 'archive'; $('#collection').hidden = view !== 'archive';
  $('#reading-view').hidden = view !== 'reader'; $('#editor').hidden = view !== 'editor';
  $('#new-note').hidden = view === 'editor';
}
function makeOutline(note) {
  const headings = [...$('#article-body').querySelectorAll('h2,h3')];
  const prefix = `heading-${note.id}-`;
  for (const [index,heading] of headings.entries()) heading.id = `${prefix}${index}`;
  $('#outline').hidden = !headings.length;
  $('#outline-links').innerHTML = headings.map(heading => `<a href="#${heading.id}" data-heading="${heading.id}"${heading.tagName === 'H3' ? ' class="subheading"' : ''}>${escapeHTML(heading.textContent)}</a>`).join('');
  $('#outline-details').open = matchMedia('(min-width:768px)').matches;
}
$('#outline-links').addEventListener('click',event => {
  const link = event.target.closest('[data-heading]'); if (!link) return;
  event.preventDefault();
  const heading = document.getElementById(link.dataset.heading);
  if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); heading.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth',block:'start'}); }
});
function route() {
  if (location.hash === '#write') {
    showView('editor'); initializeDraft(); document.title = '寫一篇紀錄 | 中山生存指南';
    if (previousView !== 'editor') window.scrollTo(0,0);
    previousView = 'editor'; return;
  }
  if (!loaded) { showView('archive'); return; }
  let id = ''; try { if (location.hash.startsWith('#note/')) id = decodeURIComponent(location.hash.slice(6)); } catch {}
  const note = notes.find(note => note.id === id);
  if (note) {
    showView('reader');
    $('#article-meta').textContent = `${note.category} / ${note.date.replaceAll('-','.')} / 約 ${readingMinutes(note.searchText)} 分鐘`;
    $('#article-title').textContent = note.title;
    $('#article-summary').textContent = note.summary; $('#article-summary').hidden = !note.summary;
    $('#article-tags').innerHTML = note.tags.map(tag => `<button class="tag" type="button" data-search-tag="${escapeHTML(tag)}">${escapeHTML(tag)}</button>`).join('');
    $('#article-body').innerHTML = note.html;
    $('#edit-note').href = `${REPO}/edit/main/content/${encodeURIComponent(note.id)}.md`;
    $('#copy-status').textContent = ''; makeOutline(note);
    document.title = `${note.title} | 中山生存指南`;
    if (previousView !== `note:${note.id}`) { window.scrollTo(0,0); $('#reader').focus({preventScroll:true}); }
    previousView = `note:${note.id}`;
  } else {
    showView('archive'); renderArchive(); document.title = '中山生存指南 | Eric 的日常筆記';
    if (location.hash.startsWith('#note/')) {
      $('#notes').innerHTML = `<div class="empty"><div class="empty-visual">${icon('notebook')}</div><div><h3>這篇紀錄不存在或已移除</h3><p>你的其他筆記仍然在這裡。</p><button id="missing-back" class="text-button">回到所有紀錄${icon('next')}</button></div></div>`;
      $('#missing-back').addEventListener('click',() => { history.replaceState(null,'',archiveURL); route(); });
    }
    if (previousView?.startsWith('note:')) window.scrollTo(0,listScroll);
    previousView = 'archive';
  }
}
$('#back').addEventListener('click',() => { history.replaceState(null,'',archiveURL); route(); $('#section-title').tabIndex = -1; $('#section-title').focus({preventScroll:true}); });
$('#article-tags').addEventListener('click',event => {
  const button = event.target.closest('[data-search-tag]'); if (!button) return;
  $('#search').value = button.dataset.searchTag; selectedCategory = '全部'; updateFilterURL(); route();
});
window.addEventListener('hashchange',route);
window.addEventListener('popstate',() => {
  const url = new URL(location.href);
  selectedCategory = categoryNames.includes(url.searchParams.get('category')) ? url.searchParams.get('category') : '全部';
  $('#search').value = url.searchParams.get('q') ?? ''; $('#sort').value = url.searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
  archiveURL = url.pathname + url.search; route();
});
$('#copy-link').addEventListener('click',async () => {
  try { await navigator.clipboard.writeText(location.href); $('#copy-status').textContent = '已複製連結'; }
  catch { $('#copy-status').textContent = '請複製網址列的連結。'; }
});
function draftData() { return Object.fromEntries(fields.map(name => [name,form.elements[name].value])); }
function updateWordCount() { $('#word-count').textContent = `${[...$('#body').value.trim()].length} 字`; }
function initializeDraft() {
  if (draftInitialized) return;
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    const filename = localStorage.getItem(FILENAME_KEY);
    if (/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(filename ?? '')) sessionFilename = filename;
  } catch { $('#draft-status').textContent = '無法讀取本機草稿，請先下載目前內容備份。'; }
  const draft = normalizeDraft(saved,today());
  for (const name of fields) form.elements[name].value = draft[name];
  if (saved) $('#draft-status').textContent = '已接續此瀏覽器的草稿，尚未發佈。';
  draftInitialized = true; updateWordCount();
}
function filename() {
  if (!sessionFilename) sessionFilename = `${today()}-${crypto.randomUUID().slice(0,8)}.md`;
  return sessionFilename;
}
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY,JSON.stringify(draftData()));
    localStorage.setItem(FILENAME_KEY,filename());
    $('#draft-status').textContent = '草稿已保留在此瀏覽器，尚未發佈。'; return true;
  } catch { $('#draft-status').textContent = '無法保留本機草稿。離開前請先下載備份。'; return false; }
}
function openEditor() {
  editorReturnURL = location.pathname + location.search + (location.hash.startsWith('#note/') ? location.hash : '');
  history.pushState({editorReturnURL},'',`${location.pathname}${location.search}#write`);
  route(); setPreview(false); $('#title').focus({preventScroll:true});
}
$('#new-note').addEventListener('click',openEditor);
$('#close-editor').addEventListener('click',() => {
  saveDraft(); history.replaceState(null,'',editorReturnURL || history.state?.editorReturnURL || archiveURL); route();
});
async function updatePreview() {
  const request = ++previewRequest;
  const draft = draftData();
  $('#preview-title').textContent = draft.title.trim() || '還沒有標題';
  $('#preview-meta').textContent = `${draft.category} / ${draft.date.replaceAll('-','.')}`;
  $('#preview-summary').textContent = draft.summary; $('#preview-summary').hidden = !draft.summary.trim();
  $('#preview-tags').innerHTML = tagsHTML(draft.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean));
  try {
    const {previewHTML} = await import('./preview.mjs');
    if (request !== previewRequest) return;
    $('#preview-body').innerHTML = previewHTML(draft.body || '內容會出現在這裡。');
  } catch { $('#preview-body').textContent = '暫時無法顯示預覽，草稿仍然保留。可以返回撰寫或下載備份。'; }
}
function setPreview(preview) {
  $('#write-panel').hidden = preview; $('#preview-panel').hidden = !preview;
  for (const [id,selected] of [['write-tab',!preview],['preview-tab',preview]]) { $( `#${id}`).setAttribute('aria-selected',String(selected)); $(`#${id}`).tabIndex = selected ? 0 : -1; }
  if (preview) void updatePreview();
}
$('#write-tab').addEventListener('click',() => setPreview(false));
$('#preview-tab').addEventListener('click',() => setPreview(true));
$('.editor-tabs').addEventListener('keydown',event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); const preview = event.key === 'End' || (event.key !== 'Home' && $('#write-tab').getAttribute('aria-selected') === 'true');
  setPreview(preview); $(preview ? '#preview-tab' : '#write-tab').focus();
});
function clearError(name) { const error = $(`#${name}-error`); if (error) { error.hidden = true; form.elements[name].removeAttribute('aria-invalid'); } }
form.addEventListener('input',event => { if (fields.includes(event.target.name)) clearError(event.target.name); saveDraft(); updateWordCount(); $('#publish-error').hidden = true; });
form.addEventListener('change',saveDraft);
function insertFormat(text) {
  const body = $('#body'); const start = body.selectionStart; const end = body.selectionEnd;
  const spacer = start && body.value[start-1] !== '\n' ? '\n\n' : '';
  body.setRangeText(spacer+text,start,end,'end'); body.focus(); clearError('body'); saveDraft(); updateWordCount();
}
$('#insert-heading').addEventListener('click',() => insertFormat('## '));
$('#insert-list').addEventListener('click',() => insertFormat('- '));
$('#clear-draft').addEventListener('click',() => { $('#clear-confirm').hidden = false; });
$('#cancel-clear').addEventListener('click',() => { $('#clear-confirm').hidden = true; });
$('#confirm-clear').addEventListener('click',() => {
  // Clear only after the explicitly confirmed removal succeeds. Keep in-memory text on storage failure.
  try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(FILENAME_KEY); }
  catch { $('#draft-status').textContent = '無法移除本機草稿，內容仍保留。請先下載備份。'; return; }
  $('#clear-confirm').hidden = true; form.reset(); $('#date').value = today(); sessionFilename = undefined;
  for (const name of ['title','body','date']) clearError(name);
  $('#publish-error').hidden = true; $('#upload-link').hidden = true;
  $('#draft-status').textContent = '草稿已清空，可以開始新的紀錄。'; updateWordCount(); setPreview(false); $('#title').focus();
});
$('#download').addEventListener('click',() => {
  const draft = draftData();
  const source = noteMarkdown(draft,{backup:true,today:today()});
  const url = URL.createObjectURL(new Blob([source],{type:'text/markdown;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = filename(); link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  $('#draft-status').textContent = '已開始下載 Markdown 備份；草稿仍保留在此瀏覽器。';
});
form.addEventListener('submit',event => {
  event.preventDefault();
  const draft = draftData(); const errors = publicationErrors(draft);
  for (const name of ['title','body','date']) {
    clearError(name);
    if (errors[name]) { $(`#${name}-error`).textContent = errors[name]; $(`#${name}-error`).hidden = false; form.elements[name].setAttribute('aria-invalid','true'); }
  }
  if (Object.keys(errors).length) {
    setPreview(false);
    if (errors.date) $('.optional-fields').open = true;
    const field = form.elements[Object.keys(errors)[0]]; field.focus(); return;
  }
  saveDraft();
  const params = new URLSearchParams({filename:`content/${filename()}`,value:noteMarkdown(draft)});
  const url = `${REPO}/new/main?${params}`;
  if (url.length > 16000) {
    $('#publish-error').textContent = '這篇內容較長，請下載備份，再到 GitHub 上傳檔案並提交。';
    $('#publish-error').hidden = false; $('#upload-link').hidden = false; return;
  }
  // Real link click avoids popup blockers while preserving this page and its local draft.
  const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.click();
  $('#publish-error').hidden = true;
  $('#draft-status').textContent = '請在 GitHub 確認提交。發佈完成後，重新整理網站即可看到紀錄。';
});
$('#how-to').addEventListener('click',() => $('#help').showModal());
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click',() => document.getElementById(button.dataset.close).close());
// Help remains available on phones in the footer without crowding the header.
const mobileHelp = document.createElement('button'); mobileHelp.className = 'text-button footer-help'; mobileHelp.textContent = '如何更新'; mobileHelp.addEventListener('click',() => $('#help').showModal()); $('.main-footer>div').append(mobileHelp);
try { const theme = localStorage.getItem('csmu-survival-guide-theme'); if (['light','dark'].includes(theme)) { document.documentElement.dataset.theme = theme; $('#theme').value = theme; } } catch {}
$('#theme').addEventListener('change',() => {
  const theme = $('#theme').value;
  if (theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('csmu-survival-guide-theme',theme); } catch {}
});
route();
try {
  const response = await fetch(`${BASE}notes.json`,{cache:'no-cache'});
  if (!response.ok) throw new Error('load failed');
  notes = await response.json();
  if (!Array.isArray(notes)) throw new Error('invalid notes');
  loaded = true; route();
} catch {
  $('#result-count').textContent = '暫時無法讀取紀錄';
  $('#notes').innerHTML = `<div class="empty"><div class="empty-visual">${icon('notebook')}</div><div><h3>筆記暫時讀取不到。</h3><p>請稍後再試，已提交的原稿仍保留在 GitHub。</p><button class="text-button" id="retry">重新讀取${icon('next')}</button></div></div>`;
  $('#retry').addEventListener('click',() => location.reload());
}
