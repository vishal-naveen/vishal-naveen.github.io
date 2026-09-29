// #stack: the tech stack as a 3D circuit board. One chip per skill, wired to a central MCU marked "VN".
// This file owns the DOM (readout, hidden button list, hint, no-WebGL fallback) and hands the picture to
// ./pcb/scene.js, which is loaded lazily so a missing GPU or CDN can only ever cost the picture, not the page.
import { SKILLS, GROUPS, PKG_LABEL } from './pcb/data.js';

const GROUP_ORDER = ['languages', 'ml', 'robotics', 'tools'];
const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export async function mount(ctx) {
  const root = document.getElementById('stack');
  if (!root) return;
  const { lib, reduced } = ctx;
  const { esc } = lib;

  const legend = GROUP_ORDER.map((g) => {
    const n = SKILLS.filter((s) => s.group === g).length;
    const pkg = g === 'ml' ? 'QFN, BGA' : PKG_LABEL[SKILLS.find((s) => s.group === g).pkg];
    return `<div class="pcb__lg"><dt>${esc(GROUPS[g].label)}</dt><dd class="pcb__lgp">${esc(pkg)}</dd><dd class="pcb__lgc">${n}</dd></div>`;
  }).join('');
  const tiles = GROUP_ORDER.map((g) => SKILLS.filter((s) => s.group === g).map((s) =>
    `<button type="button" class="pcb__tile" data-i="${s.index}"><span class="pcb__tref">${s.ref}</span><span class="pcb__tname">${esc(s.name)}</span><span class="pcb__tgrp">${esc(GROUPS[g].label)}</span></button>`).join('')).join('');
  const list = SKILLS.map((s, i) =>
    `<li><button type="button" class="pcb__opt" data-i="${i}" tabindex="${i ? -1 : 0}" aria-label="${esc(s.name)}, ${esc(GROUPS[s.group].label)}. ${esc(s.blurb)}">${esc(s.name)}</button></li>`).join('');

  root.classList.add('pcb');
  root.innerHTML =
    `<div class="container">` +
    `<header class="pcb__head"><h2 class="d1 lines" id="stack-title">${lib.lines(['Tech stack'])}</h2></header>` +
    `<div class="pcb__grid">` +
    `<div class="pcb__board reveal">` +
    `<div class="pcb__stage" data-state="loading"><div class="pcb__gl"></div><div class="pcb__tiles" hidden>${tiles}</div>` +
    `<p class="pcb__hint" aria-hidden="true"><i></i><span>${canHover() ? 'Hover a chip' : 'Tap a chip'}</span></p></div>` +
    `<ul class="pcb__list visually-hidden" aria-label="Tech stack, one control per skill">${list}</ul>` +
    `</div>` +
    `<div class="pcb__readout" aria-live="polite" aria-atomic="true">` +
    `<div class="pcb__idle"><p class="pcb__lead">Every chip is something I've used on a real project. ${canHover() ? 'Hover one' : 'Tap one'} to see where.</p><dl class="pcb__legend">${legend}</dl></div>` +
    `<div class="pcb__detail" hidden><p class="pcb__tag"><i class="pcb__dot"></i><span class="pcb__grp"></span></p>` +
    `<h3 class="pcb__name"></h3><p class="pcb__line"></p><p class="pcb__ref"><span class="pcb__rd"></span><span class="pcb__rp"></span></p></div>` +
    `</div></div></div>`;

  const $ = (sel) => root.querySelector(sel);
  const stage = $('.pcb__stage'); const glHost = $('.pcb__gl'); const tilesEl = $('.pcb__tiles');
  const readout = $('.pcb__readout'); const idle = $('.pcb__idle'); const detail = $('.pcb__detail');
  const nameEl = $('.pcb__name'); const lineEl = $('.pcb__line'); const grpEl = $('.pcb__grp');
  const rdEl = $('.pcb__rd'); const rpEl = $('.pcb__rp'); const listEl = $('.pcb__list');
  const opts = [...listEl.querySelectorAll('.pcb__opt')];
  const tileEls = [...tilesEl.querySelectorAll('.pcb__tile')];

  let api = null; let shown = -1; let visible = false;

  /* ---- readout ---- */
  const show = (i) => {
    if (i < 0) { readout.dataset.live = '0'; return; }
    stage.classList.add('is-used');
    readout.dataset.live = '1';
    if (i === shown) return;
    shown = i;
    const s = SKILLS[i];
    idle.hidden = true; detail.hidden = false;
    nameEl.textContent = s.name; lineEl.textContent = s.blurb; grpEl.textContent = GROUPS[s.group].label;
    rdEl.textContent = s.ref; rpEl.textContent = s.pkg === 'module' ? 'Module' : PKG_LABEL[s.pkg];
    if (!reduced && detail.animate) {
      detail.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  };

  const onActive = (i) => show(i);
  const onPress = (i) => {
    detail.classList.remove('is-pressed'); void detail.offsetWidth; detail.classList.add('is-pressed');
    show(i);
  };

  /* ---- hidden buttons: keyboard and screen readers drive the same highlight ---- */
  const rove = (i) => { opts.forEach((b, k) => { b.tabIndex = k === i ? 0 : -1; }); };
  listEl.addEventListener('focusin', (e) => {
    const b = e.target.closest('.pcb__opt'); if (!b) return;
    const i = +b.dataset.i; rove(i); if (api) api.setActive(i, true); else show(i);
  });
  listEl.addEventListener('focusout', (e) => {
    if (listEl.contains(e.relatedTarget)) return;
    if (api) { api.releaseKeyboard(); api.setActive(-1); }
    readout.dataset.live = '0';
  });
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('.pcb__opt'); if (!b) return;
    const i = +b.dataset.i; if (api) api.press(i); else onPress(i);
  });
  listEl.addEventListener('keydown', (e) => {
    const b = e.target.closest('.pcb__opt'); if (!b) return;
    const i = +b.dataset.i; const n = opts.length;
    const next = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i + n - 1) % n, ArrowUp: (i + n - 1) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault(); opts[next].focus();
  });

  /* ---- fallback: a plain grid of tiles ---- */
  const useTiles = () => {
    stage.dataset.state = 'tiles'; tilesEl.hidden = false; listEl.hidden = true;
    const on = (i) => { show(i); tileEls.forEach((t, k) => t.classList.toggle('is-on', k === i)); };
    tileEls.forEach((t) => {
      const i = +t.dataset.i;
      t.addEventListener('pointerenter', () => on(i));
      t.addEventListener('focus', () => on(i));
      t.addEventListener('click', () => { on(i); onPress(i); });
    });
  };

  /* ---- lifecycle: build the scene when near the viewport, run only while visible ---- */
  const sync = () => { if (api) api.setRunning(visible && !document.hidden); };
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '80px' }).observe(stage);

  const fonts = async () => {
    if (!document.fonts || !document.fonts.load) return;
    const t = new Promise((r) => setTimeout(r, 1800));
    await Promise.race([Promise.all([
      document.fonts.load('600 40px "Mona Sans"'), document.fonts.load('700 40px "Mona Sans"'), document.fonts.load('600 20px "JetBrains Mono"'),
    ]).catch(() => {}), t]);
  };

  let started = false;
  const start = async () => {
    if (started) return; started = true;
    try {
      if (new URLSearchParams(location.search).get('pcb') === 'fallback') throw new Error('fallback requested');
      await fonts();
      // The board sits right under the hero: let the hero's first moments finish before the GPU work starts.
      await Promise.race([ctx.loaded, new Promise((r) => setTimeout(r, 1200))]);
      await new Promise((r) => (window.requestIdleCallback ? window.requestIdleCallback(r, { timeout: 900 }) : setTimeout(r, 200)));
      const { createBoardScene } = await import('./pcb/scene.js');
      api = await createBoardScene(glHost, { reduced, onActive, onPress, onLost: () => { if (api) api.dispose(); api = null; useTiles(); } });
      stage.dataset.state = 'ready';
      ctx.pcb = api; // handy for QA: __site.pcb.screenPos(i)
      sync();
      // The board settles into place the first time it is actually on screen.
      new IntersectionObserver((es, io) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect(); stage.dataset.state = 'gl'; api && api.intro();
      }, { threshold: 0.18 }).observe(stage);
    } catch (err) {
      console.warn('[pcb] using the tile fallback:', err && err.message ? err.message : err);
      useTiles();
    }
  };
  new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '900px 0px' }).observe(stage);
}
