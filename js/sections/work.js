// #work: the four supporting projects as a calm 2x2 grid of cards (robotics first), plus the
// case-study overlay for all five projects (including TactileVLA-Edge, whose featured card
// lives in #lab). Deep links: #work/<id>.
//
// Every fact renders from content.js / excerpts.js. The only local data are the per-project result
// lines and media pixel sizes (verified), and the illustrative graphics, which are labelled as such.
import { aimHTML, mountAim, pathHTML, mountPath } from './work/fields.js';
import { chartHTML, tannerHTML, mountTanner, armCharts } from './work/ldpc.js';
import { phonesHTML, mountPhones } from './work/phones.js';

const RESULTS = {
  tactilevla: [
    'ACT: **18/20** successful pick-and-place trials on a deformable object',
    'SmolVLA (450M, fine-tuned): **16/20**',
    'Both policies solved held-out cell **B2**, which appears in none of the 160 training episodes',
    'Hardware: an SO-101 leader-follower rig built for under **$300**',
  ],
  sixthsense: [
    '**15 fps** sustained detection on an iPhone 14 Pro',
    '**12.7 MB** YOLOv8n Core ML model, running fully on device',
    'Distance from a single camera: pinhole geometry over a **21-class** reference-size table',
    'Requirements scoped with the City of Tampa ADA coordinator',
  ],
  ldpc: [
    'Evaluation time: **103 min → 5.4 s**, a **1,100×** speedup',
    'Syndrome success: DQN **25.9%** vs greedy bit-flipping **93.7%**, a gap traced to the parity-check matrix rather than the policy',
    '**270** seeded trials per decoder; **810** trial records and a **3,600**-trial sweep published with verification scripts',
  ],
  decode: [
    'Six autonomous routines, scoring from **0** to **18** artifacts',
    'Flywheel shooter aimed with Limelight vision',
    'Twelve tuning opmodes for the shooter and drivetrain',
    'FTC Innovate Award, **1st place** (2026)',
  ],
  intothedeep: [
    '**105**-point five-specimen autonomous on Pedro Pathing: the state record, and tied for the world record at the time',
    '**0.8 s** intake-to-outtake transfer',
    'Florida Championship finalist',
  ],
};

// Extra headline numbers for the case-study strip (each one appears in RESULTS / content.js above).
const EXTRA_METRICS = {
  tactilevla: [
    { value: '16/20', label: 'SmolVLA-450M success' },
    { value: '160', label: 'Teleop demonstrations' },
    { value: '<$300', label: 'SO-101 leader-follower rig' },
  ],
  sixthsense: [
    { value: '12.7 MB', label: 'Core ML model, fully on device' },
    { value: '21', label: 'classes in the reference-size table' },
  ],
  ldpc: [
    { value: '270', label: 'seeded trials per decoder' },
    { value: '3,600', label: 'trial parameter sweep' },
  ],
  decode: [
    { value: '12', label: 'tuning opmodes' },
    { value: '1st', label: 'FTC Innovate Award, 2026' },
  ],
  intothedeep: [
    { value: 'Tied', label: 'world record at the time' },
    { value: '0.8 s', label: 'intake-to-outtake transfer' },
    { value: 'Finalist', label: 'Florida Championship' },
  ],
};

// Intrinsic pixel sizes of the shipped media, keyed by file name.
const DIMS = {
  'act-b2.mp4': [540, 960],
  'smolvla-b2.mp4': [540, 960],
  'recording-timelapse.mp4': [848, 464],
  'grid-session-b2.jpg': [900, 1242],
  'detection-dark.jpg': [443, 960],
  'detection-indoor.jpg': [443, 960],
  'navigation.jpg': [443, 960],
  'mapping.jpg': [443, 960],
  'ldpc-decoder-comparison.png': [1116, 664],
};

// Read off the chart itself (bar labels), so screen readers get what sighted users see.
const CHART_ALT =
  'Bar chart, three decoders with 270 trials each. Syndrome satisfied: DQN 25.9%, greedy bit-flipping 93.7%, BP+LSD 100%. ' +
  'Codeword actually recovered: DQN 0.0%, greedy bit-flipping 22.6%, BP+LSD 17.0%.';

const PR_NOTE = 'closed without merging';

// From the original chart's own annotation.
const COMPARE_NOTE =
  '270 seeded trials per decoder. As the original chart notes, BP+LSD scores 100% on syndrome satisfaction by construction, so codeword recovered is the metric that means something.';

const ICON = {
  ext: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11 11 5M6 4.5h5.5V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 3.5 9 9m0-9-9 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.5 8H3M7.5 3.5 3 8l4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10.5M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const CASE_HASH = /^#work\/([\w-]+)$/;
const SHOWCASE = ['decode', 'intothedeep', 'ldpc', 'sixthsense'];

export async function mount(ctx) {
  const root = document.getElementById('work');
  const modalRoot = document.getElementById('modal-root');
  if (!root || !modalRoot) return;
  const { content, excerpts, lib, reduced } = ctx;
  const { esc, inline, codeBlock } = lib;
  const projects = content.projects;
  const byId = (id) => projects.find((p) => p.id === id);
  const indexOf = (id) => projects.findIndex((p) => p.id === id);
  const fileName = (src) => src.split('/').pop();
  const dims = (src) => DIMS[fileName(src)] || [16, 9];
  const stat = (id) => content.stats.find((s) => s.id === id);

  /* ── Shared fragments ────────────────────────────────────────────── */
  const chips = (list) => `<ul class="chips" aria-label="Stack">${list.map((s) => `<li class="chip">${esc(s)}</li>`).join('')}</ul>`;
  const metric = (value, label, extra = '') =>
    `<div class="metric ${extra}"><span class="metric__value">${esc(value)}</span><span class="metric__label">${esc(label)}</span></div>`;
  const isPr = (l) => /pull\/\d+/.test(l.href);
  const linkItem = (l, cls) =>
    `<a class="${cls}" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}` +
    (isPr(l) ? `<span class="wk-tag" aria-hidden="true">closed</span><span class="visually-hidden"> (${PR_NOTE})</span>` : '') +
    `${cls.includes('btn') ? ICON.ext : ''}</a>`;
  const kicker = (k) => esc(k.replace(' · ', ', '));
  const titleHTML = (t) => {
    const i = t.indexOf(' · ');
    return i < 0 ? esc(t) : `<span class="wk__pre">${esc(t.slice(0, i))}</span> ${esc(t.slice(i + 3))}`;
  };

  /* ── Project cards ───────────────────────────────────────────────── */
  const plates = {
    decode: () => `<div class="wk-plate__fld">${aimHTML()}</div><div class="wk-code" aria-hidden="true">${codeBlock(excerpts.decode)}</div>`,
    intothedeep: () => `<div class="wk-plate__fld">${pathHTML()}</div><div class="wk-code" aria-hidden="true">${codeBlock(excerpts.intothedeep)}</div>`,
    ldpc: () => tannerHTML(),
    sixthsense: (p) => phonesHTML(p, dims),
  };

  function card(p) {
    const repo = p.links.find((l) => l.label === 'Repository');
    return (
      `<article class="card wk wk--${p.id}" data-case="${p.id}" aria-labelledby="wk-t-${p.id}">` +
      `<div class="wk-plate" data-nocase>${plates[p.id](p)}</div>` +
      `<div class="wk__body">` +
      `<div class="wk__head"><h3 class="wk__title" id="wk-t-${p.id}">${titleHTML(p.title)}</h3><span class="wk__period">${esc(p.period)}</span></div>` +
      `<p class="wk__sum">${esc(p.summary)}</p>` +
      `<div class="wk__foot">` +
      `<p class="wk__metric"><b>${esc(p.metric.display)}</b><span>${esc(p.metric.label)}</span></p>` +
      `<div class="wk__actions"><button class="btn btn--sm" type="button" data-case-open="${p.id}" aria-label="Read the case study: ${esc(p.title)}">Case study</button>` +
      (repo ? `<a class="link" href="${esc(repo.href)}" target="_blank" rel="noopener">Repository</a>` : '') +
      `</div></div></div></article>`
    );
  }

  function renderSection() {
    return (
      `<div class="container">` +
      `<h3 class="visually-hidden">More projects</h3>` +
      `<div class="wk-grid">${SHOWCASE.map(byId).filter(Boolean).map(card).join('')}</div>` +
      `<p class="wk-more">More on <a class="link" href="${esc(content.person.links.github)}" target="_blank" rel="noopener">GitHub</a></p>` +
      `</div>`
    );
  }

  /* ── Case-study overlay ──────────────────────────────────────────── */
  let overlay = null;

  function caseMetrics(p) {
    const first = p.id === 'tactilevla' ? { value: stat('act').display, label: 'ACT policy success' } : { value: p.metric.display, label: p.metric.label };
    return [first, ...(EXTRA_METRICS[p.id] || [])];
  }

  function figure(m, kind) {
    const [w, h] = dims(m.src);
    const paper = m.src.endsWith('.png'); // the original matplotlib chart is a white-background PNG
    const el =
      m.type === 'video'
        ? `<video controls playsinline preload="metadata" poster="${esc(m.poster || '')}" src="${esc(m.src)}" aria-label="${esc(m.caption)}"></video>`
        : `<img src="${esc(m.src)}" alt="${esc(paper ? CHART_ALT : m.caption)}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
    return (
      `<figure class="cs-fig cs-fig--${kind}${paper ? ' cs-fig--paper' : ''}">` +
      `<div class="cs-fig__frame" style="aspect-ratio:${w}/${h}">${el}</div>` +
      `<figcaption>${esc(m.caption)}${paper ? ', the original matplotlib figure' : ''}</figcaption></figure>`
    );
  }

  // Consecutive portrait items become a "stage"; a lone landscape item next to a lone portrait one becomes a "duo".
  function mediaHTML(p) {
    if (!p.media.length) return '';
    const groups = [];
    p.media.forEach((m) => {
      const [w, h] = dims(m.src);
      const portrait = h > w;
      const last = groups[groups.length - 1];
      if (portrait && last && last.kind === 'stage') last.items.push(m);
      else groups.push({ kind: portrait ? 'stage' : 'wide', items: [m] });
    });
    const merged = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const nx = groups[i + 1];
      if (g.kind === 'wide' && nx && nx.kind === 'stage' && nx.items.length === 1) {
        merged.push({ kind: 'duo', items: [g.items[0], nx.items[0]] });
        i++;
      } else merged.push(g);
    }
    const out = merged.map((g) => {
      if (g.kind === 'stage') return `<div class="cs-stage reveal">${g.items.map((m) => figure(m, 'tall')).join('')}</div>`;
      if (g.kind === 'duo') return `<div class="cs-duo reveal">${figure(g.items[0], 'wide')}${figure(g.items[1], 'tall')}</div>`;
      return `<div class="cs-wide reveal">${figure(g.items[0], 'wide')}</div>`;
    });
    return `<div class="container cs-media">${out.join('')}</div>`;
  }

  function evalGrid() {
    const cols = ['A', 'B', 'C'];
    let cells = '<span></span>' + cols.map((c) => `<span class="cs-eval__axis">${c}</span>`).join('');
    for (let r = 1; r <= 3; r++) {
      cells += `<span class="cs-eval__axis">${r}</span>`;
      cols.forEach((c) => {
        cells += c === 'B' && r === 2
          ? `<div class="cs-eval__cell cs-eval__cell--held"><b>${c}${r}</b><span>held out, 0 demos</span></div>`
          : `<div class="cs-eval__cell"><b>${c}${r}</b><span>20 demos</span></div>`;
      });
    }
    return (
      `<figure class="cs-evalwrap">` +
      `<div class="cs-eval" role="img" aria-label="3 by 3 workspace grid. Eight outer cells have 20 training demonstrations each; center cell B2 was held out.">${cells}</div>` +
      `<figcaption>Training data per workspace cell. Neither policy saw B2 during training; both solved it.</figcaption></figure>`
    );
  }

  function codeSection(p) {
    const ex = excerpts[p.id];
    if (!ex) return '';
    const block = (e, note = '') =>
      `<div class="cs-codeblock reveal"><p class="cs-cap">${esc(e.title)}</p>${codeBlock(e)}${note}</div>`;
    let html = block(ex);
    if (p.id === 'tactilevla' && excerpts.lerobotpr) {
      const pr = excerpts.lerobotpr;
      const note =
        `<p class="cs-prnote"><span class="wk-tag wk-tag--lg">Closed, not merged</span>` +
        `Upstream patch to Hugging Face LeRobot, PR #3798. The maintainers closed it without merging after an overlapping fix (#3644) landed.</p>`;
      html += block(pr, note);
    }
    return (
      `<section class="container cs-section" aria-labelledby="cs-h-code"><h3 class="cs-h" id="cs-h-code">In the code</h3>` +
      `<div class="cs-codes">${html}</div></section>`
    );
  }

  function compareSection(p) {
    if (p.id !== 'ldpc') return '';
    return (
      `<section class="container cs-section" aria-labelledby="cs-h-cmp"><h3 class="cs-h" id="cs-h-cmp">The comparison</h3>` +
      `<div class="cs-col reveal cs-native">${chartHTML({ alt: CHART_ALT, caption: COMPARE_NOTE })}</div></section>`
    );
  }

  function caseHTML(p) {
    const i = indexOf(p.id);
    const next = projects[(i + 1) % projects.length];
    const ms = caseMetrics(p);
    const results = RESULTS[p.id] || [];
    return (
      `<div class="cs-bar"><div class="cs-bar__in">` +
      `<button class="cs-back" type="button" data-cs-close>${ICON.back}<span>Selected work</span></button>` +
      `<span class="cs-bar__title" aria-hidden="true">${esc(p.title)}</span>` +
      `<span class="cs-bar__count" aria-label="Project ${i + 1} of ${projects.length}">${i + 1} <i>/</i> ${projects.length}</span>` +
      `<button class="cs-close" type="button" data-cs-close aria-label="Close case study">${ICON.close}</button>` +
      `</div><span class="cs-bar__progress" aria-hidden="true"></span></div>` +
      `<div class="cs-inner">` +
      `<header class="container cs-hero">` +
      `<p class="cs-kicker reveal"><span>${kicker(p.kicker)}</span><span class="wk__period">${esc(p.period)}</span></p>` +
      `<h2 class="d1 cs-title lines" id="cs-title">${lib.lines([p.title])}</h2>` +
      `<p class="lead cs-summary reveal">${esc(p.summary)}</p>` +
      `<div class="reveal">${chips(p.stack)}</div>` +
      `</header>` +
      `<div class="container"><div class="cs-metrics reveal" style="--n:${ms.length}">${ms.map((m) => metric(m.value, m.label)).join('')}</div></div>` +
      `<div class="container cs-links reveal">${p.links.map((l) => linkItem(l, 'btn cs-linkbtn')).join('')}</div>` +
      compareSection(p) +
      mediaHTML(p) +
      `<section class="container cs-section" aria-labelledby="cs-h-res"><h3 class="cs-h" id="cs-h-res">Results</h3><div class="cs-col reveal">` +
      `<ul class="cs-results">${results.map((r) => `<li><span>${inline(r)}</span></li>`).join('')}</ul>` +
      (p.id === 'tactilevla' ? evalGrid() : '') +
      `</div></section>` +
      `<section class="container cs-section" aria-labelledby="cs-h-did"><h3 class="cs-h" id="cs-h-did">What I did</h3>` +
      `<ul class="cs-did reveal">${p.bullets.map((b) => `<li><span>${inline(b)}</span></li>`).join('')}</ul></section>` +
      codeSection(p) +
      `<div class="container"><button class="card cs-next reveal" type="button" data-cs-next="${next.id}" aria-label="Next project: ${esc(next.title)}">` +
      `<span class="cs-next__label">Next project</span>` +
      `<span class="cs-next__title">${esc(next.title)}</span>` +
      `<span class="cs-next__sum">${esc(next.summary)}</span>` +
      `<span class="cs-next__arrow" aria-hidden="true">${ICON.arrow}</span></button></div>` +
      `</div>`
    );
  }

  const focusables = (el) =>
    [...el.querySelectorAll('a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])')]
      .filter((n) => n.getClientRects().length);

  let inerted = [];
  const setInert = (on) => {
    if (on) {
      const skip = new Set(['modal-root', 'palette-root']);
      inerted = [...document.body.children].filter((n) =>
        !skip.has(n.id) && !['SCRIPT', 'NOSCRIPT'].includes(n.tagName) && !n.hasAttribute('inert'));
      inerted.forEach((n) => n.setAttribute('inert', ''));
    } else {
      inerted.forEach((n) => n.removeAttribute('inert'));
      inerted = [];
    }
  };

  function onKey(e) {
    if (!overlay) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); requestClose(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables(overlay.el);
    if (!items.length) { e.preventDefault(); overlay.panel.focus({ preventScroll: true }); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = overlay.el.contains(active);
    if (e.shiftKey && (active === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !inside)) { e.preventDefault(); first.focus(); }
  }

  function bindScroll(panel) {
    let ticking = false;
    panel.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = panel.scrollHeight - panel.clientHeight;
        panel.style.setProperty('--cs-p', max > 0 ? (panel.scrollTop / max).toFixed(4) : '0');
        panel.classList.toggle('is-scrolled', panel.scrollTop > 220);
      });
    }, { passive: true });
  }

  const fill = (panel) => { lib.observeReveals(panel); armCharts(panel); };

  function show(id, opener) {
    const p = byId(id);
    if (!p || overlay) return;
    const el = document.createElement('div');
    el.className = 'cs';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'cs-title');
    el.innerHTML = `<div class="cs-backdrop" data-cs-close></div><div class="cs-panel" data-lenis-prevent tabindex="-1">${caseHTML(p)}</div>`;
    modalRoot.appendChild(el);
    const panel = el.querySelector('.cs-panel');
    overlay = { el, panel, id, opener: opener || document.activeElement, closing: false, pushed: false };
    bindScroll(panel);

    ctx.lenis?.stop();
    if (!ctx.lenis) document.documentElement.style.overflow = 'hidden';
    setInert(true);
    document.addEventListener('keydown', onKey, true);
    ctx.emit('case:open', { id });

    fill(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    panel.querySelector('.cs-close')?.focus({ preventScroll: true });
  }

  function hide() {
    if (!overlay) return;
    const { el, opener } = overlay;
    overlay = null;
    document.removeEventListener('keydown', onKey, true);
    el.classList.remove('is-open');
    el.classList.add('is-closing');
    setInert(false);
    ctx.lenis?.start();
    if (!ctx.lenis) document.documentElement.style.overflow = '';
    ctx.emit('case:close', {});
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    setTimeout(() => el.remove(), reduced ? 0 : 520);
  }

  function swap(id) {
    const p = byId(id);
    if (!p || !overlay) return;
    const { panel } = overlay;
    overlay.id = id;
    const apply = () => {
      panel.innerHTML = caseHTML(p);
      panel.scrollTop = 0;
      panel.style.setProperty('--cs-p', '0');
      panel.classList.remove('is-scrolled');
      fill(panel);
      panel.querySelector('.cs-close')?.focus({ preventScroll: true });
    };
    if (reduced) { apply(); return; }
    panel.classList.add('is-swapping');
    setTimeout(() => { apply(); requestAnimationFrame(() => panel.classList.remove('is-swapping')); }, 240);
  }

  const hashId = () => (location.hash.match(CASE_HASH) || [])[1] || null;

  function openCase(id, opener) {
    if (!byId(id) || overlay) return;
    const pushed = hashId() !== id;
    if (pushed) history.pushState({ work: id }, '', `#work/${id}`);
    show(id, opener);
    if (overlay) overlay.pushed = pushed;
  }

  function requestClose() {
    if (!overlay || overlay.closing) return;
    overlay.closing = true;
    const pushed = overlay.pushed && history.state && history.state.work;
    hide();
    if (pushed) {
      // Undo the entry openCase pushed, then make sure the URL rests on #work.
      const settle = () => { if (!location.hash) history.replaceState(null, '', '#work'); };
      window.addEventListener('popstate', settle, { once: true });
      history.back();
      setTimeout(settle, 600);
    } else {
      history.replaceState(null, '', '#work');
    }
  }

  function syncFromHash() {
    const id = hashId();
    if (id && byId(id)) {
      if (!overlay) show(id);
      else if (overlay.id !== id) swap(id);
    } else if (overlay) {
      hide();
      if (!location.hash) history.replaceState(null, '', '#work');
    }
  }

  /* ── Wire up ─────────────────────────────────────────────────────── */
  root.classList.add('work');
  root.innerHTML = renderSection();

  // Each illustration mounts on its own so one failure never blanks the section.
  const safe = (fn, ...args) => { try { fn(...args); } catch (err) { console.error('[work]', err); } };
  safe(mountAim, root, ctx);
  safe(mountPath, root, ctx);
  safe(mountTanner, root, ctx);
  safe(mountPhones, root, ctx);
  safe(armCharts, root);

  root.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-nocase], button:not([data-case-open])')) return;
    const cardEl = e.target.closest('[data-case]');
    if (!cardEl) return;
    openCase(cardEl.dataset.case, cardEl.querySelector('[data-case-open]'));
  });

  modalRoot.addEventListener('click', (e) => {
    if (!overlay) return;
    if (e.target.closest('[data-cs-close]')) { requestClose(); return; }
    const next = e.target.closest('[data-cs-next]');
    if (next) {
      const id = next.dataset.csNext;
      history.replaceState({ work: id }, '', `#work/${id}`);
      swap(id);
    }
  });

  window.addEventListener('hashchange', syncFromHash);
  window.addEventListener('popstate', syncFromHash);

  ctx.openCase = (id) => openCase(id);
  ctx.closeCase = requestClose;

  lib.observeReveals(root);

  // Deep link on load. The pinned lab section above adds height once it mounts, so re-anchor
  // a couple of times while the (scroll-locked) overlay is open.
  const initial = hashId();
  if (initial && byId(initial)) {
    const anchor = () => { if (ctx.lenis) ctx.lenis.scrollTo(root, { immediate: true, force: true }); else root.scrollIntoView(); };
    anchor();
    show(initial);
    [400, 1400].forEach((ms) => setTimeout(() => { if (overlay) anchor(); }, ms));
  }
}
