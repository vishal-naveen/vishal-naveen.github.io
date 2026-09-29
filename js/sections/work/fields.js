// Two top-down FTC field illustrations (144 in square). Both are labelled illustrative: the aim
// simulation and the Bezier chain are drawn for effect, not from the robots' telemetry or routines.
//   aim:  DECODE. The robot glides to the pointer, keeps its shooter turned to the goal, and
//         fires artifacts. Distance is clamped 12 to 144 in, like ShooterCalculator.
//   path: Into the Deep. A chain of Bezier segments the robot follows, the way Pedro Pathing
//         drives a path. Drag a handle to reshape it.
import { rampColor, runWhileVisible, svgPoint, clamp, shortest } from './sim.js';

const TILES = [24, 48, 72, 96, 120].map((v) => `M${v} 0V144M0 ${v}H144`).join('');
const fmt = (n) => n.toFixed(1);

/* ── DECODE: aim at the goal ─────────────────────────────── */
export function aimHTML() {
  const spokes = [0, 60, 120].map((a) => `<path d="M-4.4 0H4.4" transform="rotate(${a})"/>`).join('');
  return (
    `<div class="fld-wrap" data-fld="aim">` +
    `<svg class="fld" viewBox="0 0 144 144" aria-hidden="true">` +
    `<defs><filter id="fa-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>` +
    `<rect class="fld-bg" width="144" height="144" rx="3"/><path class="fld-tiles" d="${TILES}"/>` +
    `<g transform="translate(124 20)"><circle class="fa-pulse" r="7"/><circle class="fa-ring" r="12"/><circle class="fa-ring" r="7.5"/><circle class="fa-core" r="3"/></g>` +
    `<line class="fa-glow" filter="url(#fa-blur)"/><line class="fa-beam"/>` +
    `<g>${'<circle class="fa-shot" r="1.6"/>'.repeat(4)}</g>` +
    `<g class="fa-bot"><rect class="fa-body" x="-9" y="-9" width="18" height="18" rx="2"/><path class="fa-front" d="M9 -6V6"/>` +
    `<g class="fa-wheel" transform="translate(3 0)"><circle r="4.4"/>${spokes}</g></g>` +
    `</svg>` +
    `<p class="fld-read"><span>Distance to goal</span><b data-read>0 in</b></p>` +
    `<p class="fld-note">Illustrative simulation. Move the pointer over the field.</p></div>`
  );
}

export function mountAim(host, ctx) {
  const wrap = host.querySelector('[data-fld="aim"]');
  if (!wrap) return;
  const svg = wrap.querySelector('svg');
  const $ = (s) => svg.querySelector(s);
  const bot = $('.fa-bot');
  const wheel = $('.fa-wheel');
  const beam = $('.fa-beam');
  const glow = $('.fa-glow');
  const pulse = $('.fa-pulse');
  const shots = [...svg.querySelectorAll('.fa-shot')].map((el) => ({ el, u: -1, x0: 0, y0: 0, dur: 1 }));
  const read = wrap.querySelector('[data-read]');
  const GOAL = { x: 124, y: 20 };
  const s = { x: 40, y: 104, a: -0.6, w: 0, cool: 0.6, hit: 0 };
  let target = { x: 60, y: 96 };
  let over = false;
  let lastShown = -1;

  function render() {
    const dx = GOAL.x - s.x;
    const dy = GOAL.y - s.y;
    const dist = clamp(Math.hypot(dx, dy), 12, 144);
    const heat = 1 - clamp((dist - 12) / 120, 0, 1);
    const col = rampColor(0.34 + heat * 0.62);
    const fx = s.x + Math.cos(s.a) * 12;
    const fy = s.y + Math.sin(s.a) * 12;
    bot.setAttribute('transform', `translate(${fmt(s.x)} ${fmt(s.y)}) rotate(${fmt((s.a * 180) / Math.PI)})`);
    wheel.setAttribute('transform', `translate(3 0) rotate(${fmt(s.w)})`);
    [beam, glow].forEach((l) => {
      l.setAttribute('x1', fmt(fx)); l.setAttribute('y1', fmt(fy));
      l.setAttribute('x2', GOAL.x); l.setAttribute('y2', GOAL.y);
      l.style.stroke = col;
    });
    shots.forEach((sh) => {
      if (sh.u < 0) { sh.el.style.opacity = '0'; return; }
      sh.el.setAttribute('cx', fmt(sh.x0 + (GOAL.x - sh.x0) * sh.u));
      sh.el.setAttribute('cy', fmt(sh.y0 + (GOAL.y - sh.y0) * sh.u));
      sh.el.setAttribute('r', fmt(1.3 + Math.sin(Math.PI * sh.u) * 1.5));
      sh.el.style.opacity = '1';
    });
    pulse.style.opacity = String(s.hit);
    pulse.setAttribute('r', fmt(7 + (1 - s.hit) * 9));
    const shown = Math.round(dist);
    if (shown !== lastShown) { lastShown = shown; read.textContent = `${shown} in`; }
  }

  function step(dt, t) {
    if (!over) { target = { x: 64 + 44 * Math.cos(t * 0.42), y: 96 + 26 * Math.sin(t * 0.61) }; }
    const px = s.x;
    const py = s.y;
    const k = 1 - Math.exp(-dt * 3.4);
    s.x += (target.x - s.x) * k;
    s.y += (target.y - s.y) * k;
    const speed = dt > 0 ? Math.hypot(s.x - px, s.y - py) / dt : 0;
    const want = Math.atan2(GOAL.y - s.y, GOAL.x - s.x);
    s.a += shortest(want - s.a) * (1 - Math.exp(-dt * 9));
    const dist = clamp(Math.hypot(GOAL.x - s.x, GOAL.y - s.y), 12, 144);
    s.w += dt * (260 + (dist / 144) * 420);
    s.cool -= dt;
    if (s.cool <= 0 && speed < 16) {
      const free = shots.find((sh) => sh.u < 0);
      if (free) { free.u = 0; free.x0 = s.x + Math.cos(s.a) * 12; free.y0 = s.y + Math.sin(s.a) * 12; free.dur = 0.45 + (dist / 144) * 0.5; }
      s.cool = 1.05;
    }
    shots.forEach((sh) => {
      if (sh.u < 0) return;
      sh.u += dt / sh.dur;
      if (sh.u >= 1) { sh.u = -1; s.hit = 1; }
    });
    s.hit = Math.max(0, s.hit - dt * 2.2);
    render();
  }

  const move = (e) => { over = true; target = { x: clamp(svgPoint(svg, e).x, 12, 132), y: clamp(svgPoint(svg, e).y, 12, 132) }; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', () => { over = false; });

  if (ctx.reduced) {
    // No loop: place the robot, then only respond to the pointer.
    target = { x: 62, y: 96 }; s.x = 62; s.y = 96; s.a = Math.atan2(GOAL.y - 96, GOAL.x - 62);
    render();
    svg.addEventListener('pointermove', (e) => { const p = svgPoint(svg, e); s.x = clamp(p.x, 12, 132); s.y = clamp(p.y, 12, 132); s.a = Math.atan2(GOAL.y - s.y, GOAL.x - s.x); render(); });
    return;
  }
  runWhileVisible(wrap, step, ctx);
}

/* ── Into the Deep: follow a Bezier chain ────────────────── */
// Illustrative. The first segment borrows the control coordinates printed in the Push3Specimen
// excerpt; every endpoint is invented for the drawing.
const SEGS = [
  [[12, 116], [21.8, 96], [13.2, 52], [20, 30]],
  [[20, 30], [70, 20], [118, 26]],
  [[118, 26], [132, 31], [118, 37]],
  [[118, 37], [26, 37]],
  [[26, 37], [10, 52], [118, 51]],
  [[118, 51], [26, 51]],
  [[26, 51], [10, 66], [118, 65]],
  [[118, 65], [26, 65]],
  [[26, 65], [8, 86], [34, 108], [12, 116]],
];
const HANDLES = [[0, 1], [0, 2], [1, 1], [2, 1], [4, 1], [6, 1], [8, 1], [8, 2]];
const SAMPLES = 26;
const SPEED = 34; // in per second, purely visual

const bez = (pts, t) => {
  let p = pts.map((q) => q.slice());
  while (p.length > 1) p = p.slice(1).map((q, i) => [p[i][0] + (q[0] - p[i][0]) * t, p[i][1] + (q[1] - p[i][1]) * t]);
  return p[0];
};

export function pathHTML() {
  return (
    `<div class="fld-wrap" data-fld="path">` +
    `<svg class="fld fld--path" viewBox="0 0 144 144" aria-hidden="true">` +
    `<defs><filter id="fp-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>` +
    `<rect class="fld-bg" width="144" height="144" rx="3"/><path class="fld-tiles" d="${TILES}"/>` +
    `<path class="fp-guides"/><path class="fp-path"/>` +
    `<path class="fp-trail-glow" pathLength="1000" filter="url(#fp-blur)"/><path class="fp-trail" pathLength="1000"/>` +
    `<g class="fp-ends"></g><g class="fp-handles"></g>` +
    `<g class="fp-bot"><rect x="-7" y="-7" width="14" height="14" rx="1.6"/><path d="M7 -4.6V4.6"/></g>` +
    `</svg><p class="fld-note">Illustrative path. Drag a handle to reshape the curve.</p></div>`
  );
}

export function mountPath(host, ctx) {
  const wrap = host.querySelector('[data-fld="path"]');
  if (!wrap) return;
  const svg = wrap.querySelector('svg');
  const $ = (s) => svg.querySelector(s);
  const segs = SEGS.map((sg) => sg.map((p) => p.slice()));
  const guides = $('.fp-guides');
  const pathEl = $('.fp-path');
  const trail = $('.fp-trail');
  const trailGlow = $('.fp-trail-glow');
  const bot = $('.fp-bot');
  const ends = $('.fp-ends');
  const handleLayer = $('.fp-handles');
  let pts = [];
  let total = 1;
  let s = 0;
  let a = 0;
  let drag = null;

  ends.innerHTML = segs.map((sg) => `<circle class="fp-end" cx="${sg[0][0]}" cy="${sg[0][1]}" r="1.5"/>`).join('');
  handleLayer.innerHTML = HANDLES.map(([i, j], k) => `<g class="fp-handle" data-h="${k}"><circle class="fp-hit" r="6.5"/><circle class="fp-dot" r="2.2"/></g>`).join('');
  const handleEls = [...handleLayer.querySelectorAll('.fp-handle')];

  function rebuild() {
    let d = `M${fmt(segs[0][0][0])} ${fmt(segs[0][0][1])}`;
    let g = '';
    segs.forEach((sg) => {
      const e = sg[sg.length - 1];
      if (sg.length === 2) d += `L${fmt(e[0])} ${fmt(e[1])}`;
      else if (sg.length === 3) { d += `Q${fmt(sg[1][0])} ${fmt(sg[1][1])} ${fmt(e[0])} ${fmt(e[1])}`; g += `M${fmt(sg[0][0])} ${fmt(sg[0][1])}L${fmt(sg[1][0])} ${fmt(sg[1][1])}L${fmt(e[0])} ${fmt(e[1])}`; }
      else { d += `C${fmt(sg[1][0])} ${fmt(sg[1][1])} ${fmt(sg[2][0])} ${fmt(sg[2][1])} ${fmt(e[0])} ${fmt(e[1])}`; g += `M${fmt(sg[0][0])} ${fmt(sg[0][1])}L${fmt(sg[1][0])} ${fmt(sg[1][1])}M${fmt(e[0])} ${fmt(e[1])}L${fmt(sg[2][0])} ${fmt(sg[2][1])}`; }
    });
    pathEl.setAttribute('d', d);
    trail.setAttribute('d', d);
    trailGlow.setAttribute('d', d);
    guides.setAttribute('d', g);
    handleEls.forEach((el, k) => { const [i, j] = HANDLES[k]; el.setAttribute('transform', `translate(${fmt(segs[i][j][0])} ${fmt(segs[i][j][1])})`); });
    pts = [];
    total = 0;
    segs.forEach((sg) => {
      for (let n = 0; n < SAMPLES; n++) {
        const p = bez(sg, n / SAMPLES);
        const prev = pts[pts.length - 1];
        if (prev) total += Math.hypot(p[0] - prev.x, p[1] - prev.y);
        pts.push({ x: p[0], y: p[1], c: total });
      }
    });
    const first = pts[0];
    total += Math.hypot(first.x - pts[pts.length - 1].x, first.y - pts[pts.length - 1].y);
  }

  function place() {
    let i = pts.findIndex((p) => p.c >= s);
    if (i < 0) i = pts.length - 1;
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const r = pts[(i - 1 + pts.length) % pts.length];
    const want = Math.atan2(q.y - r.y, q.x - r.x);
    a += shortest(want - a) * 0.2;
    bot.setAttribute('transform', `translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt((a * 180) / Math.PI)})`);
    const f = (s / total) * 1000;
    const dash = `260 1000`;
    [trail, trailGlow].forEach((el) => { el.setAttribute('stroke-dasharray', dash); el.setAttribute('stroke-dashoffset', fmt(260 - f)); });
  }

  function step(dt) {
    s += SPEED * dt;
    if (s > total) s -= total;
    place();
  }

  const nearest = (p) => {
    let best = -1;
    let bd = 8;
    HANDLES.forEach(([i, j], k) => { const d = Math.hypot(segs[i][j][0] - p.x, segs[i][j][1] - p.y); if (d < bd) { bd = d; best = k; } });
    return best;
  };
  svg.addEventListener('pointerdown', (e) => {
    const k = nearest(svgPoint(svg, e));
    if (k < 0) return;
    drag = k;
    handleEls[k].classList.add('is-on');
    svg.setPointerCapture(e.pointerId);
    wrap.classList.add('is-dragging');
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    const p = svgPoint(svg, e);
    if (drag === null) { wrap.classList.toggle('is-near', nearest(p) >= 0); return; }
    const [i, j] = HANDLES[drag];
    segs[i][j] = [clamp(p.x, 4, 140), clamp(p.y, 4, 140)];
    rebuild();
    if (ctx.reduced) place();
  });
  const end = () => { drag = null; wrap.classList.remove('is-dragging'); handleEls.forEach((el) => el.classList.remove('is-on')); };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('dblclick', () => { SEGS.forEach((sg, i) => sg.forEach((p, j) => { segs[i][j] = p.slice(); })); rebuild(); if (ctx.reduced) place(); });

  rebuild();
  if (ctx.reduced) { s = total * 0.18; place(); return; }
  s = total * 0.05;
  runWhileVisible(wrap, step, ctx);
}
