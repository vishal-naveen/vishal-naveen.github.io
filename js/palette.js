// ⌘K command menu: jump to a section, open a project, copy the email, open links.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function match(q, text) {
  if (!q) return [];
  const t = text.toLowerCase(), s = q.toLowerCase();
  const i = t.indexOf(s);
  if (i >= 0) return [...s].map((_, k) => i + k);
  const idx = [];
  let j = 0;
  for (let k = 0; k < t.length && j < s.length; k++) if (t[k] === s[j]) { idx.push(k); j++; }
  return j === s.length ? idx : null;
}

export async function mount(ctx) {
  const root = document.getElementById('palette-root');
  if (!root) return;
  const { person, projects } = ctx.content;
  const go = (sel) => () => ctx.scrollTo(sel);
  const items = [
    ...[['Tech stack', '#stack'], ['Selected work', '#lab'], ['More projects', '#work'], ['Experience', '#experience'], ['Leadership & awards', '#leadership'], ['Contact', '#contact']]
      .map(([label, sel]) => ({ group: 'Go to', label, run: go(sel) })),
    ...projects.map((p) => ({
      group: 'Projects', label: p.title, hint: p.kicker,
      run: () => (ctx.openCase ? ctx.openCase(p.id) : (location.hash = `#work/${p.id}`)),
    })),
    { group: 'Actions', label: 'Copy email address', hint: person.email, run: async () => { try { await navigator.clipboard.writeText(person.email); flash('Copied'); } catch { flash(person.email); } } },
    { group: 'Actions', label: 'Open r\u00e9sum\u00e9 (PDF)', run: () => window.open(person.links.resume, '_blank', 'noopener') },
    { group: 'Actions', label: 'Open GitHub', hint: 'github.com/vishal-naveen', run: () => window.open(person.links.github, '_blank', 'noopener') },
    { group: 'Actions', label: 'Open LinkedIn', hint: 'linkedin.com/in/vishalnaveen', run: () => window.open(person.links.linkedin, '_blank', 'noopener') },
  ];

  root.innerHTML = `
    <div class="pal" hidden>
      <div class="pal__box" role="dialog" aria-modal="true" aria-label="Command menu">
        <div class="pal__search">
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.5"/></svg>
          <input class="pal__input" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="Jump to a section, open a project…" spellcheck="false">
          <kbd class="pal__esc">esc</kbd>
        </div>
        <div class="pal__list" id="pal-list" role="listbox" data-lenis-prevent></div>
        <div class="pal__foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span class="pal__flash" aria-live="polite"></span></div>
      </div>
    </div>`;
  const overlay = root.querySelector('.pal');
  const input = root.querySelector('.pal__input');
  const list = root.querySelector('.pal__list');
  const flashEl = root.querySelector('.pal__flash');
  let shown = [], sel = 0, back = null;

  function flash(msg) { flashEl.textContent = msg; setTimeout(() => (flashEl.textContent = ''), 1600); }

  function render() {
    const q = input.value.trim();
    shown = items.map((it) => ({ ...it, idx: q ? match(q, it.label) : [] })).filter((it) => !q || it.idx);
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    let group = '';
    list.innerHTML = shown.length
      ? shown.map((it, i) => {
          const head = it.group !== group ? `<div class="pal__group">${esc((group = it.group))}</div>` : '';
          const label = [...it.label].map((c, k) => (it.idx.includes(k) ? `<mark>${esc(c)}</mark>` : esc(c))).join('');
          return `${head}<div class="pal__item" role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === sel}"><span>${label}</span>${it.hint ? `<span class="pal__hint">${esc(it.hint)}</span>` : ''}</div>`;
        }).join('')
      : `<p class="pal__empty">Nothing matches “${esc(q)}”.</p>`;
    if (shown.length) input.setAttribute('aria-activedescendant', `pal-${sel}`);
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function open() { back = document.activeElement; overlay.hidden = false; input.value = ''; sel = 0; render(); input.focus(); ctx.lenis?.stop(); }
  function close() { overlay.hidden = true; ctx.lenis?.start(); back?.focus?.({ preventScroll: true }); }
  function choose(i) { const it = shown[i]; if (!it) return; close(); it.run(); }

  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length; render(); } }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') e.preventDefault();
  });
  list.addEventListener('click', (e) => { const it = e.target.closest('.pal__item'); if (it) choose(Number(it.dataset.i)); });
  list.addEventListener('mousemove', (e) => { const it = e.target.closest('.pal__item'); if (it && Number(it.dataset.i) !== sel) { sel = Number(it.dataset.i); render(); } });
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); }
  });
  document.querySelectorAll('[data-palette]').forEach((b) => b.addEventListener('click', open));
}
