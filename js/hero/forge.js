// The name, calm. At rest it is crisp off-white Mona Sans, identical to plain DOM text. Where the cursor
// passes (or, when the cursor is away, where the arm's tip passes) individual letters warm faintly toward
// ember and cool back within about a second. Nothing glows, and it never looks like fire.
//
// Contracts: reads ctx.hero.tcp (written by js/arm/stage.js, hero-relative css px). Reduced motion leaves
// the name as plain text with no effect at all.
import { trackPointer } from './pointer.js';

const WARM_MAX = 0.42;    // fraction of the way from off-white to ember at the hottest point
const COOL_RATE = 3.6;    // exp decay per second: ~2% of the peak left after one second
const REACH = 0.5;        // falloff sigma, in font-size units

function splitLetters(h1) {
  return [...h1.querySelectorAll('.hero__word')].flatMap((word) => {
    const text = word.textContent;
    word.textContent = '';
    return [...text].map((ch) => {
      const el = document.createElement('span');
      el.className = 'hero__l';
      el.setAttribute('aria-hidden', 'true');
      el.textContent = ch;
      word.appendChild(el);
      return { el, cx: 0, cy: 0, w: 0, shown: 0 };
    });
  });
}

export async function mount(ctx) {
  const section = document.getElementById('top');
  const h1 = section && section.querySelector('.hero__name');
  if (!section || !h1 || ctx.reduced) return;

  const letters = splitLetters(h1);
  let sigma = 80;
  const measure = () => {
    sigma = parseFloat(getComputedStyle(h1).fontSize) * REACH;
    letters.forEach((l) => {
      l.cx = h1.offsetLeft + l.el.offsetLeft + l.el.offsetWidth / 2;
      l.cy = h1.offsetTop + l.el.offsetTop + l.el.offsetHeight / 2;
    });
  };
  measure();
  document.fonts?.ready.then(measure);
  new ResizeObserver(measure).observe(section);

  const pointer = trackPointer(ctx, section);
  let raf = 0, last = 0, visible = true;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const src = pointer.rel(section.getBoundingClientRect()) || (ctx.hero.tcp.visible ? ctx.hero.tcp : null);
    const decay = Math.exp(-COOL_RATE * dt);
    for (const l of letters) {
      let target = 0;
      if (src) {
        const dx = src.x - l.cx, dy = src.y - l.cy;
        target = WARM_MAX * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
      l.w = target > l.w ? l.w + (target - l.w) * (1 - Math.exp(-14 * dt)) : l.w * decay;
      if (l.w < 0.006) l.w = 0;
      if (Math.abs(l.w - l.shown) > 0.006 || (l.w === 0 && l.shown !== 0)) {
        l.shown = l.w;
        l.el.style.setProperty('--w', l.w.toFixed(3));
      }
    }
  };
  const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(section);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}
