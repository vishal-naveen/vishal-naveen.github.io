// #experience: compact rows. Education first, then the three roles (org, role, period, one or two bullets).
import { esc, hl, secHead } from './util.js';

// Which bullets from content.js to show for each role (all text comes from content.js).
const PICK = { usf: [0, 2] };

function row(x) {
  return (
    `<li class="xp__row"><div class="xp__when"><time>${esc(x.period)}</time><span>${esc(x.location)}</span></div>` +
    `<div class="xp__body"><h3 class="xp__org">${esc(x.org)}</h3><p class="xp__role">${esc(x.role)}</p>` +
    `<ul class="xp__bullets" role="list">${x.bullets.map((b) => `<li>${hl(b)}</li>`).join('')}</ul></div></li>`
  );
}

export function mountExperience(el, ctx) {
  const { experience, education } = ctx.content;
  const rows = [
    {
      period: `Graduating ${education.grad}`, location: education.location,
      org: education.school, role: education.degree,
      bullets: [education.minor, education.honors.join(', ')],
    },
    ...experience.map((x) => ({
      period: x.period, location: x.location, org: x.org, role: x.role,
      bullets: (PICK[x.id] || [0, 1]).map((i) => x.bullets[i]).filter(Boolean),
    })),
  ];
  el.classList.add('xp');
  el.innerHTML =
    `<div class="container">` + secHead('experience-title', ['Experience']) +
    `<ol class="xp__list" role="list">${rows.map(row).join('')}</ol></div>`;
}
