// Nav: glass after 40px, active-section state, and the mobile overlay.
const MOBILE = '(max-width: 900px)';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The mobile menu mirrors the desktop nav (content.nav is the v4 list and is not used here).
const MENU = [
  { id: 'stack', label: 'Stack' },
  { id: 'lab', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

function buildMenu(ctx) {
  const { person } = ctx.content;
  const nav = MENU;
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.id = 'nav-menu';
  menu.inert = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Menu');
  const links = nav
    .map((n, i) => `<a class="menu__link" href="#${n.id}" data-section="${n.id}" style="--i:${i}"><span>${n.label}</span></a>`)
    .join('');
  menu.innerHTML =
    `<nav class="menu__nav" aria-label="Sections">${links}</nav>` +
    `<div class="menu__foot"><a class="menu__mail" href="mailto:${person.email}">${person.email}</a>` +
    `<div class="menu__ext"><a href="${person.links.resume}" target="_blank" rel="noopener">R\u00e9sum\u00e9</a>` +
    `<a href="${person.links.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` +
    `<a href="${person.links.github}" target="_blank" rel="noopener">GitHub</a></div></div>`;
  document.body.appendChild(menu);
  return menu;
}

export function mountNav(ctx) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const html = document.documentElement;

  // Scroll state
  let queued = false;
  const update = () => {
    queued = false;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();

  // Active section
  const links = [...nav.querySelectorAll('.nav__link')];
  const bySection = new Map();
  links.forEach((a) => (a.dataset.sections || '').split(' ').forEach((id) => id && bySection.set(id, a)));
  const menuLinks = [];
  const setActive = (id) => {
    const target = bySection.get(id) || null;
    links.forEach((a) => {
      const on = a === target;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    menuLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.section === id || (id === 'work' && a.dataset.section === 'lab') || (id === 'leadership' && a.dataset.section === 'experience')));
  };
  if ('IntersectionObserver' in window) {
    const live = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? live.add(e.target.id) : live.delete(e.target.id)));
      setActive([...live].pop() || '');
    }, { rootMargin: '-45% 0px -54% 0px' });
    bySection.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  // Mobile overlay
  const burger = nav.querySelector('.nav__menu');
  if (!burger) return;
  const menu = buildMenu(ctx);
  menu.querySelectorAll('.menu__link').forEach((a) => menuLinks.push(a));
  let open = false, back = null;
  // While the overlay is open the page behind it is inert, so Tab cannot wander into hidden content.
  const behind = () => [...document.body.children].filter((el) => !['SCRIPT', 'NOSCRIPT'].includes(el.tagName) && el !== nav && el !== menu);
  let dimmed = [];

  const setOpen = (next) => {
    if (next === open) return;
    open = next;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-menu', open);
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    html.classList.toggle('menu-open', open);
    if (open) { dimmed = behind().filter((el) => !el.inert); dimmed.forEach((el) => { el.inert = true; }); }
    else { dimmed.forEach((el) => { el.inert = false; }); dimmed = []; }
    if (open) {
      back = document.activeElement;
      ctx.lenis?.stop();
      menu.querySelector('.menu__link')?.focus({ preventScroll: true });
    } else {
      ctx.lenis?.start();
      if (back && back !== document.body) back.focus?.({ preventScroll: true });
    }
  };
  burger.addEventListener('click', () => setOpen(!open));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    const stops = [burger, ...menu.querySelectorAll(FOCUSABLE)];
    const first = stops[0], last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  matchMedia(MOBILE).addEventListener('change', (e) => { if (!e.matches) setOpen(false); });
}
