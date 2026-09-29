// RL LDPC decoding, drawn natively in heat colours.
//   chart:  the three decoders' numbers, read off the original comparison chart (270 seeded trials
//           each). The original PNG stays in the case study.
//   tanner: an ILLUSTRATIVE Tanner graph (10 bits, 5 parity checks). Not from the study's code. It
//           runs greedy bit-flipping so you can see a syndrome being satisfied; click a bit to flip it.

const CHART = [
  {
    head: 'Syndrome satisfied',
    rows: [['DQN (this project)', 25.9], ['Greedy bit-flipping', 93.7], ['BP+LSD', 100]],
  },
  {
    head: 'Codeword recovered',
    rows: [['DQN (this project)', 0.0], ['Greedy bit-flipping', 22.6], ['BP+LSD', 17.0]],
  },
];

const label = (v) => (v === 100 ? '100%' : `${v.toFixed(1)}%`);

export function chartHTML({ alt, caption = true } = {}) {
  let n = 0;
  const groups = CHART.map((g) => (
    `<div class="ldpc-grp"><p class="ldpc-grp__h">${g.head}</p>` +
    g.rows.map(([k, v]) => {
      const d = (n++ * 0.11).toFixed(2);
      return (
        `<div class="ldpc-row" style="--v:${v};--d:${d}s"><span class="ldpc-row__k">${k}</span>` +
        `<span class="ldpc-row__bar"><i></i></span><span class="ldpc-row__v">${label(v)}</span></div>`
      );
    }).join('') + `</div>`
  )).join('');
  return (
    `<figure class="ldpc-chart" role="img" aria-label="${alt || ""}">${groups}` +
    (caption ? `<figcaption>${typeof caption === 'string' ? caption : '270 seeded trials per decoder. Values read off the original comparison chart.'}</figcaption>` : '') +
    `</figure>`
  );
}

/* ── Tanner graph ────────────────────────────────────────── */
const CHECKS = [[0, 1, 2, 3], [0, 4, 5, 6], [1, 4, 7, 8], [2, 5, 7, 9], [3, 6, 8, 9]];
const N = 10;
const VX = (v) => 34 + v * 40;
const CX = (c) => 74 + c * 73;
const VY = 46;
const CY = 168;

export function tannerHTML() {
  const edges = CHECKS.map((vs, c) => vs.map((v) => `<line class="tg-edge" data-v="${v}" data-c="${c}" x1="${VX(v)}" y1="${VY + 9}" x2="${CX(c)}" y2="${CY - 9}"/>`).join('')).join('');
  const vars = Array.from({ length: N }, (_, v) => `<g class="tg-var" data-v="${v}"><circle class="tg-hit" cx="${VX(v)}" cy="${VY}" r="15"/><circle class="tg-node" cx="${VX(v)}" cy="${VY}" r="9"/></g>`).join('');
  const checks = CHECKS.map((_, c) => `<rect class="tg-check" data-c="${c}" x="${CX(c) - 9}" y="${CY - 9}" width="18" height="18" rx="3"/>`).join('');
  return (
    `<div class="tg" data-tanner>` +
    `<svg class="tg-svg" viewBox="0 0 448 214" aria-hidden="true">` +
    `<text class="tg-lbl" x="4" y="14">bits</text><text class="tg-lbl" x="4" y="208">parity checks</text>` +
    `<g>${edges}</g><g>${checks}</g><g>${vars}</g></svg>` +
    `<p class="tg-read" aria-hidden="true"><span data-tg-state>Syndrome satisfied</span><b data-tg-w>0</b></p>` +
    `<p class="tg-note">Illustrative Tanner graph, not from the study's code. Click a bit to flip it.</p></div>`
  );
}

export function mountTanner(host, ctx) {
  const root = host.querySelector('[data-tanner]');
  if (!root) return;
  const vEls = [...root.querySelectorAll('.tg-var')];
  const cEls = [...root.querySelectorAll('.tg-check')];
  const eEls = [...root.querySelectorAll('.tg-edge')];
  const stateEl = root.querySelector('[data-tg-state]');
  const weightEl = root.querySelector('[data-tg-w]');
  const bits = new Array(N).fill(0);
  const syn = () => CHECKS.map((vs) => vs.reduce((a, v) => a ^ bits[v], 0));
  let phase = 'idle';
  let steps = 0;
  let timer = 0;
  let running = false;
  let hovered = -1;
  let note = '';

  function paint() {
    const sy = syn();
    vEls.forEach((el, v) => el.classList.toggle('is-err', bits[v] === 1));
    cEls.forEach((el, c) => el.classList.toggle('is-unsat', sy[c] === 1));
    eEls.forEach((el) => {
      const v = Number(el.dataset.v);
      const c = Number(el.dataset.c);
      el.classList.toggle('is-hot', sy[c] === 1 && bits[v] === 1);
      el.classList.toggle('is-warm', sy[c] === 1 && bits[v] === 0);
      el.classList.toggle('is-hover', hovered === v);
    });
    const w = sy.reduce((a, b) => a + b, 0);
    weightEl.textContent = String(w);
    stateEl.textContent = note || (w === 0 ? 'Syndrome satisfied' : 'Unsatisfied checks');
    root.classList.toggle('is-ok', w === 0);
  }

  const bestBit = () => {
    const sy = syn();
    let best = [];
    let top = 0;
    for (let v = 0; v < N; v++) {
      const s = CHECKS.reduce((a, vs, c) => a + (vs.includes(v) && sy[c] ? 1 : 0), 0);
      if (s > top) { top = s; best = [v]; } else if (s === top && s > 0) best.push(v);
    }
    return best.length ? best[Math.floor(Math.random() * best.length)] : -1;
  };

  function tick() {
    timer = 0;
    if (!running) return;
    const w = syn().reduce((a, b) => a + b, 0);
    let wait = 800;
    if (phase === 'idle') {
      bits.fill(0);
      const k = Math.random() < 0.4 ? 2 : 1;
      while (bits.reduce((a, b) => a + b, 0) < k) bits[Math.floor(Math.random() * N)] = 1;
      note = 'Error injected';
      phase = 'decode';
      steps = 0;
      wait = 1100;
    } else if (w > 0 && steps < 7) {
      const v = bestBit();
      if (v < 0) { steps = 99; } else { bits[v] ^= 1; steps++; note = `Flipping bit ${v}`; }
      wait = 850;
    } else {
      // Syndrome satisfied on a nonzero word means a different valid codeword, which is exactly
      // the gap the study measured between syndrome success and codeword recovery.
      note = w === 0 && bits.some(Boolean) ? 'Satisfied, but not the sent codeword' : '';
      if (w > 0) bits.fill(0);
      phase = 'idle';
      wait = 1900;
    }
    paint();
    timer = setTimeout(tick, wait);
  }

  const setRunning = (on) => {
    running = on && !ctx.reduced;
    if (running && !timer) timer = setTimeout(tick, 400);
    if (!running && timer) { clearTimeout(timer); timer = 0; }
  };

  root.addEventListener('pointerover', (e) => { const g = e.target.closest('.tg-var'); const v = g ? Number(g.dataset.v) : -1; if (v !== hovered) { hovered = v; paint(); } });
  root.addEventListener('pointerleave', () => { hovered = -1; paint(); });
  root.addEventListener('click', (e) => {
    const g = e.target.closest('.tg-var');
    if (!g) return;
    bits[Number(g.dataset.v)] ^= 1;
    note = '';
    phase = 'decode';
    steps = 0;
    paint();
    if (running) { clearTimeout(timer); timer = setTimeout(tick, 1000); }
  });

  // Start from a visible error so the still frame already says something.
  bits[4] = 1;
  phase = 'decode';
  paint();

  if (ctx.reduced) return;
  let vis = false;
  let paused = false;
  const update = () => setRunning(vis && !paused && !document.hidden);
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { vis = e.isIntersecting; update(); }, { rootMargin: '40px' }).observe(root);
  else vis = true;
  document.addEventListener('visibilitychange', update);
  ctx.on('case:open', () => { paused = true; update(); });
  ctx.on('case:close', () => { paused = false; update(); });
}

// Grow the chart bars once, when their figure first scrolls into view.
export function armCharts(scope = document) {
  const figs = scope.querySelectorAll('.ldpc-chart:not([data-armed])');
  const grow = (el) => el.classList.add('is-in');
  if (!('IntersectionObserver' in window)) { figs.forEach(grow); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { grow(e.target); io.unobserve(e.target); } }), { threshold: 0.35 });
  figs.forEach((f) => { f.dataset.armed = '1'; io.observe(f); });
}
