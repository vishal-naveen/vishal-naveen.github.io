// One shared pointer tracker for the hero (the name warmth and the arm both read it).
// `rel(rect)` gives hero-relative css px while the pointer is (or was recently) over the hero.
export function trackPointer(ctx, section) {
  if (ctx.hero.pointer) return ctx.hero.pointer;
  const p = { clientX: -1e4, clientY: -1e4, inside: false, touch: false, lastMove: -1e9 };
  const inHero = (x, y) => { const r = section.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
  const seen = (e) => {
    p.clientX = e.clientX; p.clientY = e.clientY;
    p.touch = e.pointerType !== 'mouse';
    p.inside = inHero(e.clientX, e.clientY);
    if (p.inside) p.lastMove = performance.now();
  };
  window.addEventListener('pointermove', seen, { passive: true });
  window.addEventListener('pointerdown', seen, { passive: true });
  document.addEventListener('mouseleave', () => { p.inside = false; });

  /** Hero-relative css px, or null if the pointer has not been over the hero recently. */
  p.rel = (rect, idleMs = 2500) => {
    if (!p.inside || performance.now() - p.lastMove > (p.touch ? Math.max(idleMs, 4500) : idleMs)) return null;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };
  ctx.hero.pointer = p;
  return p;
}
