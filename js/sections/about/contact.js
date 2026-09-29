// footer#contact: the closing line in plain Mona Sans, a large email link with copy-to-clipboard and a toast,
// socials, the résumé button, and a small seven-segment LED clock showing Gainesville local time.
import { esc, ICON } from './util.js';
import { lines } from '../../lib.js';
import { mountLed } from './led.js';

const TITLE = ["Let's build", 'something.'];
const CREDIT_URL = 'https://github.com/TheRobotStudio/SO-ARM100';

function bindCopy(root, email) {
  const btn = root.querySelector('[data-copy]');
  const toast = root.querySelector('.ct__toast');
  const icon = btn.querySelector('.ct__copy-icon');
  const idle = icon.innerHTML;
  let timer = 0;

  const legacy = () => {
    const ta = document.createElement('textarea');
    ta.value = email;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  };
  const flash = (ok) => {
    clearTimeout(timer);
    toast.textContent = '';
    requestAnimationFrame(() => { toast.textContent = ok ? 'Copied to clipboard' : 'Copy failed'; });   // re-announces on repeat copies
    toast.classList.toggle('is-bad', !ok);
    toast.classList.add('is-on');
    if (ok) { icon.innerHTML = ICON.check; btn.classList.add('is-done'); }
    timer = setTimeout(() => {
      toast.classList.remove('is-on');
      icon.innerHTML = idle; btn.classList.remove('is-done');
      toast.textContent = '';
    }, 1900);
  };
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; } catch { ok = legacy(); }
    flash(ok);
  });
}

function zoneName(timeZone) {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName');
    return part ? part.value : '';
  } catch { return ''; }
}

export function mountContact(el, ctx) {
  const { person } = ctx.content;
  const { github, linkedin, resume } = person.links;
  el.classList.add('ct');
  el.innerHTML =
    `<div class="container ct__inner">` +
    `<h2 class="d1 lines ct__title" id="contact-title" aria-label="${esc(TITLE.join(' '))}">${lines(TITLE)}</h2>` +
    `<div class="ct__mailrow"><a class="ct__mail" href="mailto:${esc(person.email)}">${esc(person.email)}</a>` +
    `<span class="ct__copywrap"><button class="ct__copy" type="button" data-copy aria-label="Copy email address"><span class="ct__copy-icon">${ICON.copy}</span></button>` +
    `<span class="ct__toast" role="status" aria-live="polite"></span></span></div>` +
    `<div class="ct__row">` +
    `<div class="ct__links"><a class="btn btn--hot" href="${esc(resume)}" target="_blank" rel="noopener">Résumé</a>` +
    `<a class="link" href="${esc(github)}" target="_blank" rel="noopener">GitHub</a>` +
    `<a class="link" href="${esc(linkedin)}" target="_blank" rel="noopener">LinkedIn</a></div>` +
    `<div class="ct__clock"><span class="led" role="img" aria-label="Seven-segment clock showing the current time in ${esc(person.location)}"></span>` +
    `<p class="ct__place">${esc(person.location)}<span>${esc(zoneName(person.timezone))} local time</span></p></div></div>` +
    `<div class="ct__foot"><p>© 2026 ${esc(person.name)}. Plain JavaScript, GSAP, Lenis and three.js.</p>` +
    `<p>SO-101 arm model by <a class="link" href="${CREDIT_URL}" target="_blank" rel="noopener">TheRobotStudio</a>, Apache-2.0.</p></div></div>`;

  bindCopy(el, person.email);
  mountLed(el.querySelector('.led'), person.timezone, ctx.reduced);
}
