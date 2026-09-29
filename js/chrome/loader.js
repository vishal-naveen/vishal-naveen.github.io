// Loading screen: the name over a hairline that tracks the arm's real mesh download, then a curtain that
// lifts into the hero. Paused hero entrance animations resume as it lifts, so the page arrives in one motion.
const MAX_WAIT = 10000; // never hold the page longer than this, loaded or not

export function mountLoader(ctx) {
  const root = document.documentElement;
  const el = document.getElementById('loader');
  const release = () => { root.classList.remove('is-loading'); ctx.emit('loader:done'); };
  if (!el || ctx.reduced || !root.classList.contains('is-loading')) { el?.remove(); release(); return; }

  let repeat = false;
  try { repeat = sessionStorage.getItem('vn-seen') === '1'; sessionStorage.setItem('vn-seen', '1'); } catch { /* private mode */ }
  const minShow = repeat ? 350 : 900;
  const bar = el.querySelector('.loader__bar i');
  const pct = el.querySelector('.loader__pct');
  const hero = document.getElementById('top');
  let target = 0.06, shown = 0, armDone = false, fontsDone = false, lifted = false;
  const t0 = performance.now();

  ctx.on('arm:progress', (f) => { target = Math.max(target, 0.06 + 0.86 * f); });
  ctx.on('arm:loaded', () => { armDone = true; });
  if (hero && (hero.classList.contains('arm-loaded') || hero.classList.contains('arm-failed'))) armDone = true;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsDone = true; });

  function tick(now) {
    const elapsed = now - t0;
    const ready = (armDone && fontsDone) || elapsed > MAX_WAIT;
    if (ready) target = 1;
    shown += (target - shown) * (ready ? 0.14 : 0.07);
    bar.style.transform = `scaleX(${shown.toFixed(4)})`;
    if (pct) pct.textContent = `${Math.round(shown * 100)}`;
    if (ready && shown > 0.992 && elapsed > minShow) lift();
    else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function lift() {
    if (lifted) return;
    lifted = true;
    bar.style.transform = 'scaleX(1)';
    if (pct) pct.textContent = '100';
    el.classList.add('is-lifting');
    setTimeout(release, 380);                       // the hero starts rising as the curtain clears it
    setTimeout(() => el.remove(), 1600);
  }
}
