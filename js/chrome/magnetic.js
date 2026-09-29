// Buttons: `.btn` and `[data-magnetic]` lean a few pixels toward the pointer, then settle back.
// Hover-capable, fine pointers only.
const SEL = '.btn, [data-magnetic]';
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function mountMagnetic(ctx) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const { gsap } = ctx;
  const magnet = !ctx.reduced;
  const quick = new WeakMap();
  const mover = (el) => {
    if (!quick.has(el)) {
      quick.set(el, gsap
        ? { x: gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' }) }
        : { x: (v) => { el.style.translate = `${v}px ${el.__y || 0}px`; }, y: (v) => { el.__y = v; } });
    }
    return quick.get(el);
  };
  let cur = null;
  const release = () => { if (cur) { const m = mover(cur); m.x(0); m.y(0); cur = null; } };

  addEventListener('pointermove', (e) => {
    const t = e.target;
    if (!magnet) return;
    const el = t.closest?.(SEL);
    if (el !== cur) release();
    if (!el) return;
    cur = el;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const m = mover(el);
    m.x(clamp(dx * 0.16, -6, 6));
    m.y(clamp(dy * 0.22, -4, 4));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', release);
  addEventListener('blur', release);
}
