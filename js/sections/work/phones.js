// Sixth Sense: the four real screenshots as a fan of phones that spreads and tilts with the pointer.
const ORDER = ['navigation', 'detection-dark', 'mapping', 'detection-indoor'];

export function phonesHTML(p, dims) {
  const find = (f) => p.media.find((m) => m.src.includes(f));
  const items = ORDER.map(find).filter(Boolean);
  const offs = [-1.5, -0.5, 0.5, 1.5].slice(0, items.length);
  return (
    `<div class="ph" data-phones><div class="ph-floor" aria-hidden="true"></div><div class="ph-fan">` +
    items.map((m, i) => {
      const [w, h] = dims(m.src);
      return (
        `<figure class="ph-unit${m.src.includes('detection-dark') ? ' is-lead' : ''}" style="--i:${offs[i]};--z:${Math.round((2 - Math.abs(offs[i])) * 20 + (m.src.includes('detection-dark') ? 34 : 0))}">` +
        `<div class="ph-body"><img src="${m.src}" alt="${m.caption}" width="${w}" height="${h}" loading="lazy" decoding="async"><span class="ph-glare" aria-hidden="true"></span></div></figure>`
      );
    }).join('') +
    `</div></div>`
  );
}

export function mountPhones(host, ctx) {
  const root = host.querySelector('[data-phones]');
  if (!root || ctx.reduced) return;
  const panel = root.closest('.wk') || root;
  const s = { x: 0, y: 0, sp: 0.86, tx: 0, ty: 0, tsp: 0.86 };
  let raf = 0;
  let vis = false;
  const set = () => {
    root.style.setProperty('--px', s.x.toFixed(3));
    root.style.setProperty('--py', s.y.toFixed(3));
    root.style.setProperty('--sp', s.sp.toFixed(3));
  };
  const loop = () => {
    s.x += (s.tx - s.x) * 0.08;
    s.y += (s.ty - s.y) * 0.08;
    s.sp += (s.tsp - s.sp) * 0.07;
    set();
    const settled = Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) + Math.abs(s.tsp - s.sp) < 0.002;
    raf = settled || !vis ? 0 : requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && vis) raf = requestAnimationFrame(loop); };
  panel.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect();
    s.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    s.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    s.tsp = 1.3;
    kick();
  }, { passive: true });
  panel.addEventListener('pointerleave', () => { s.tx = 0; s.ty = 0; s.tsp = 0.86; kick(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); }, { rootMargin: '60px' }).observe(root);
  else vis = true;
  set();
}
