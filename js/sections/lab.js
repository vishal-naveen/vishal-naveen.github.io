// #lab: the "Selected work" heading and the featured project, TactileVLA-Edge, as one compact card (no pin, no
// scroll narrative). The four other projects are the 2x2 grid in #work (work.js).
//
// Every fact renders from content.js. Vision-only: nothing here claims tactile sensing. No B2 rate, no Hz.

const SMOLVLA = '16/20'; // verified result (content.js bullets); stats[] only carries ACT.

// A 3x3 glyph of the workspace grid: eight trained cells, B2 held out (dashed, marked).
function gridGlyph() {
  const cell = 20, gap = 4;
  let out = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = c * (cell + gap), y = r * (cell + gap);
      if (c === 1 && r === 1) {
        out += `<rect class="gg-held" x="${x + 0.5}" y="${y + 0.5}" width="${cell - 1}" height="${cell - 1}" rx="4"/>` +
          `<circle class="gg-dot" cx="${x + cell / 2}" cy="${y + cell / 2}" r="2.4"/>`;
      } else {
        out += `<rect class="gg-cell" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4"/>`;
      }
    }
  }
  return `<svg class="fx__glyph" viewBox="0 0 68 68" role="img" aria-label="3 by 3 workspace grid: eight outer cells trained, centre cell B2 held out">${out}</svg>`;
}

export async function mount(ctx) {
  const root = document.getElementById('lab');
  if (!root) return;
  const { content, lib, reduced } = ctx;
  const { esc } = lib;
  const p = content.projects.find((x) => x.id === 'tactilevla');
  if (!p) return;

  const act = content.stats.find((s) => s.id === 'act');
  const demos = content.stats.find((s) => s.id === 'demos');
  const [vAct, vSmol] = p.media.filter((m) => m.type === 'video' && m.portrait);
  const link = (label) => p.links.find((l) => l.label === label);
  const repo = link('Repository');
  const site = link('Project site');
  const pr = link('LeRobot PR #3798');

  const video = (m) =>
    `<figure class="fx__vid"><div class="fx__frame">` +
    `<video muted loop playsinline preload="none" poster="${esc(m.poster)}" src="${esc(m.src)}" aria-label="${esc(m.caption)}" disablepictureinpicture${reduced ? ' controls' : ''}></video>` +
    `</div><figcaption>${esc(m.caption)}</figcaption></figure>`;

  const metrics = [
    [act.display, 'ACT policy success'],
    [SMOLVLA, 'SmolVLA-450M success'],
    [demos.display, 'teleoperated demos'],
  ];

  root.innerHTML =
    `<div class="container">` +
    `<header class="sec-head"><h2 class="d1 lines" id="lab-title">${lib.lines(['Selected work'])}</h2>` +
    `<p class="lead reveal">Robot learning first, then competition robot code, coding-theory research and an iOS aid for blind and low-vision users.</p></header>` +
    `<article class="card fx reveal" data-case="tactilevla" aria-labelledby="fx-title">` +
    `<div class="fx__main">` +
    `<h3 class="fx__title" id="fx-title">${esc(p.title)}</h3>` +
    `<p class="fx__sum">Imitation-learning policies on a sub-$300 SO-101 arm, tested on a workspace cell they never saw in training.</p>` +
    `<ul class="chips fx__chips" aria-label="Stack">${['Vision only', ...p.stack].map((s) => `<li class="chip">${esc(s)}</li>`).join('')}</ul>` +
    `<div class="fx__metrics">${metrics.map(([v, l]) => `<div class="metric"><span class="metric__value">${esc(v)}</span><span class="metric__label">${esc(l)}</span></div>`).join('')}</div>` +
    `<div class="fx__grid">${gridGlyph()}<p>8 outer cells, 20 demos each. Cell B2 was held out of training.</p></div>` +
    `<div class="fx__cta">` +
    `<button class="btn btn--hot btn--sm" type="button" data-open-case>Case study</button>` +
    (site ? `<a class="btn btn--sm" href="${esc(site.href)}" target="_blank" rel="noopener">Project site</a>` : '') +
    (repo ? `<a class="btn btn--sm" href="${esc(repo.href)}" target="_blank" rel="noopener">Repository</a>` : '') +
    `</div>` +
    (pr ? `<p class="fx__pr"><a class="link" href="${esc(pr.href)}" target="_blank" rel="noopener">LeRobot PR #3798</a>, submitted and closed, not merged</p>` : '') +
    `</div>` +
    `<div class="fx__media">${video(vAct)}${video(vSmol)}</div>` +
    `</article></div>`;

  const card = root.querySelector('.fx');
  root.querySelector('[data-open-case]').addEventListener('click', () => ctx.openCase && ctx.openCase('tactilevla'));
  // The card opens the case study too, except where a link, button or video control was hit.
  card.addEventListener('click', (e) => {
    if (e.target.closest('a, button, video')) return;
    ctx.openCase && ctx.openCase('tactilevla');
  });

  /* ── Video: muted loops that play only while in view, and never while a case study is open ── */
  const state = { caseOpen: false };
  const recs = [...root.querySelectorAll('video')].map((el) => {
    el.muted = true;
    el.defaultMuted = true;
    return { el, vis: false };
  });
  const sync = () => recs.forEach((r) => {
    const go = !reduced && r.vis && !document.hidden && !state.caseOpen;
    if (go && r.el.paused) { r.el.preload = 'auto'; r.el.play().catch(() => {}); }
    else if (!go && !r.el.paused && !reduced) r.el.pause();
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { recs.find((r) => r.el === e.target).vis = e.intersectionRatio >= 0.35; });
      sync();
    }, { threshold: [0, 0.35, 0.7] });
    recs.forEach((r) => io.observe(r.el));
    // Warm the rollouts a little before the card arrives so they start without a stall.
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) recs.forEach((r) => { if (r.el.preload === 'none') r.el.preload = 'metadata'; });
    }, { rootMargin: '1200px 0px' }).observe(root);
  } else recs.forEach((r) => { r.vis = true; });
  document.addEventListener('visibilitychange', sync);
  ctx.on('case:open', () => { state.caseOpen = true; sync(); });
  ctx.on('case:close', () => { state.caseOpen = false; sync(); });
}
