// Shared helpers for the about-page sections.
import { esc, inline, lines } from '../../lib.js';

export { esc, inline };

// Makes figures in already-escaped bullet text scan first (plain weight, no colour).
const NUM_RE = /\$?\d+(?:,\d{3})*(?:\.\d+)?(?:[%×+]|K\b)?/g;
export const hl = (s) => inline(s).replace(NUM_RE, (m) => `<span class="hl">${m}</span>`);

// Section head: a masked title on the left, an optional one-line lead on the right.
export const secHead = (id, titleLines, lead, cls = 'd2') =>
  `<div class="sec-head${lead ? '' : ' sec-head--solo'}"><h2 class="${cls} lines sec-title" id="${id}">${lines(titleLines)}</h2>` +
  (lead ? `<p class="lead reveal">${esc(lead)}</p>` : '') + `</div>`;

// Runs `fn(el)` once, the first time each element is at least `threshold` visible.
export function whenSeen(els, fn, threshold = 0.3) {
  if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } });
  }, { threshold });
  els.forEach((el) => io.observe(el));
}

const svg = (d) =>
  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  copy: svg('<rect x="5.5" y="5.5" width="8" height="8" rx="2"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/>'),
  mail: svg('<rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2"/><path d="M2.5 4.5l5.5 4.2 5.5-4.2"/>'),
  check: svg('<path d="M3.25 8.5l3.25 3.25 6.25-7.5"/>'),
  trophy: svg('<path d="M5 2.5h6v3.2a3 3 0 0 1-6 0V2.5Z"/><path d="M5 3.6H3.2c0 2 .8 3 2.2 3.2M11 3.6h1.8c0 2-.8 3-2.2 3.2"/><path d="M8 8.7v2.3M5.5 13.5h5M6.5 13.5v-1.2a1.3 1.3 0 0 1 1.3-1.3h.4a1.3 1.3 0 0 1 1.3 1.3v1.2"/>'),
};
