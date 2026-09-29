// Shared helpers for every section: escaping, inline emphasis, Prism line highlighting,
// scroll reveals, and the pointer spotlight on .card elements.

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// **bold** only; everything else escaped.
export const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// Prism tokens split per line so each line can carry its real line number.
export function highlightLines(code, lang) {
  const P = window.Prism;
  const grammar = P && P.languages[lang];
  if (!grammar) return code.split('\n').map(esc);
  const lines = [''];
  const emit = (text, cls) =>
    text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push('');
      if (part) lines[lines.length - 1] += cls.length ? `<span class="${cls.join(' ')}">${esc(part)}</span>` : esc(part);
    });
  const walk = (t, cls) => {
    if (typeof t === 'string') return emit(t, cls);
    if (Array.isArray(t)) return t.forEach((x) => walk(x, cls));
    walk(t.content, cls.concat(['token', t.type], t.alias || []));
  };
  walk(P.tokenize(code, grammar), []);
  return lines;
}

// A complete .code block for an excerpt from js/data/excerpts.js.
export function codeBlock(ex) {
  if (!ex) return '';
  const numbered = ex.lang !== 'diff' && ex.start > 0;
  const lines = highlightLines(ex.code, ex.lang)
    .map((l, i) => `<div class="code__line"><span class="code__no">${numbered ? ex.start + i : ''}</span><span class="code__src">${l || ' '}</span></div>`)
    .join('');
  const name = `${ex.repo.split('/')[1]}/${ex.path}`;
  return (
    `<figure class="code"><figcaption class="code__head"><span class="code__dots" aria-hidden="true"><i></i><i></i><i></i></span>` +
    `<span class="code__path" title="${esc(name)}">${esc(name)}${numbered ? ` · L${ex.start}–${ex.end}` : ''}</span>` +
    `<a class="code__gh" href="${ex.url}" target="_blank" rel="noopener">View on GitHub</a></figcaption>` +
    `<div class="code__body"><code>${lines}</code></div></figure>`
  );
}

// Display-title lines for the mask reveal: lines(['Selected', 'work']) → .line > span markup.
// Put class "lines" on the title so observeReveals() adds .is-in when it scrolls into view.
export const lines = (list) => list.map((l) => `<span class="line"><span>${esc(l)}</span></span>`).join('');

// Adds .is-in to .reveal and .lines elements as they enter the viewport (once).
export function observeReveals(root = document) {
  const els = root.querySelectorAll('.reveal:not(.is-in), .lines:not(.is-in)');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

// Pointer spotlight for every .card (delegated, so cards rendered later work too).
export function enableSpotlight() {
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}
