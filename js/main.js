// Boot: smooth scroll driven by the GSAP ticker, a shared context, then mount each part
// independently so one failure never blanks the page.
//
// Module contract: every part exports `async mount(ctx)` and finds its own root by id.
import { content } from './content.js';
import { excerpts } from './data/excerpts.js';
import * as lib from './lib.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const { gsap, ScrollTrigger } = window;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  if (gsap) {
    if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

// Tiny event bus. Events: 'loader:done' (preloader has lifted; the hero may ignite).
// ctx.hero is the forge <-> arm handshake: forge writes ctx.hero.heat, the arm writes ctx.hero.tcp.
const listeners = new Map();
let loaderDone = false;
const ctx = {
  content, excerpts, lib, reduced, lenis, gsap, ScrollTrigger,
  hero: { heat: { level: 0, x: 0, y: 0 }, tcp: { x: 0, y: 0, visible: false }, torch: false },
  on(name, fn) { (listeners.get(name) || listeners.set(name, []).get(name)).push(fn); },
  emit(name, data) {
    if (name === 'loader:done') { if (loaderDone) return; loaderDone = true; }
    (listeners.get(name) || []).forEach((fn) => { try { fn(data); } catch (err) { console.error(`[${name}]`, err); } });
  },
  get loaderDone() { return loaderDone; },
  scrollTo(target, opts = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4, ...opts });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  },
};
// Resolves once the preloader has lifted (or immediately after it if already done).
ctx.loaded = new Promise((resolve) => ctx.on('loader:done', resolve));
window.__site = ctx;
// Never let a stuck preloader hold the hero hostage.
setTimeout(() => ctx.emit('loader:done'), 11000);

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2 || a.getAttribute('href').startsWith('#work/')) return;
  const el = document.querySelector(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  ctx.scrollTo(el);
  history.replaceState(null, '', a.getAttribute('href'));
});

lib.enableSpotlight();

const parts = [
  ['chrome', () => import('./chrome/chrome.js')],
  ['hero', () => import('./hero/forge.js')],
  ['arm', () => import('./arm/stage.js')],
  ['lab', () => import('./sections/lab.js')],
  ['work', () => import('./sections/work.js')],
  ['about', () => import('./sections/about.js')],
  ['pcb', () => import('./sections/pcb.js')],
  ['palette', () => import('./palette.js')],
];
Promise.allSettled(parts.map(([name, load]) => load().then((m) => m.mount(ctx)).catch((err) => { console.error(`[${name}]`, err); throw err; })))
  .then(() => {
    lib.observeReveals();
    if (ScrollTrigger) ScrollTrigger.refresh();
  });
