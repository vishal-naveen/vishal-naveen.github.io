// Tiny helpers shared by the interactive illustrations in #work.

// Calls step(dt, t) every frame, but only while `el` is on screen, the tab is visible and no case
// study is open.
export function runWhileVisible(el, step, ctx) {
  let raf = 0;
  let last = 0;
  let vis = false;
  let paused = false;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt, now / 1000);
    raf = requestAnimationFrame(frame);
  };
  const update = () => {
    const on = vis && !paused && !document.hidden;
    if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; update(); }, { rootMargin: '60px' }).observe(el);
  } else vis = true;
  document.addEventListener('visibilitychange', update);
  ctx.on('case:open', () => { paused = true; update(); });
  ctx.on('case:close', () => { paused = false; update(); });
}

// Pointer position in an SVG's viewBox units.
export function svgPoint(svg, e, size = 144) {
  const r = svg.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * size, y: ((e.clientY - r.top) / r.height) * size };
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const shortest = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// A point on the heat ramp (t in 0..1) as an rgb() string, for the illustrations' beams.
const RAMP = [
  [0, [28, 6, 4]], [0.16, [94, 11, 7]], [0.34, [181, 23, 15]], [0.52, [255, 65, 21]],
  [0.7, [255, 122, 31]], [0.86, [255, 178, 94]], [1, [255, 238, 222]],
];
export function rampColor(t) {
  const v = clamp(t, 0, 1);
  let i = 1;
  while (i < RAMP.length - 1 && RAMP[i][0] < v) i++;
  const [t0, c0] = RAMP[i - 1];
  const [t1, c1] = RAMP[i];
  const k = (v - t0) / (t1 - t0);
  return `rgb(${c0.map((n, j) => Math.round(n + (c1[j] - n) * k)).join(',')})`;
}
