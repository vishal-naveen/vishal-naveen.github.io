// #leadership: Middleton Robotics with three highlight numbers, then the awards as a tidy list beside the activities.
import { esc, hl, secHead } from './util.js';

function award(a) {
  const top = /^1st/.test(a.place);
  return (
    `<li class="aw${top ? ' aw--top' : ''}"><span class="aw__year">${esc(a.year)}</span>` +
    `<div class="aw__title"><h4>${esc(a.title)}</h4><p>${esc(a.org)}</p></div>` +
    `<span class="aw__place">${esc(a.place)}</span></li>`
  );
}

export function mountLeadership(el, ctx) {
  const { leadership: L, awards, activities } = ctx.content;
  el.classList.add('ld');
  const stats = L.highlights.slice(0, 3).map((h) =>
    `<div class="metric"><span class="metric__value">${esc(h.display)}</span><span class="metric__label">${esc(h.label)}</span></div>`).join('');

  el.innerHTML =
    `<div class="container">` + secHead('leadership-title', ['Leadership & awards']) +
    `<article class="ld__feature">` +
    `<div class="ld__intro"><h3 class="ld__org">${esc(L.org)}</h3><p class="ld__role">${esc(L.role)}</p>` +
    `<p class="ld__meta">${esc(L.teams)}, ${esc(L.location)}. ${esc(L.period)}</p></div>` +
    `<div class="ld__main"><div class="ld__stats">${stats}</div>` +
    `<p class="ld__blurb">${hl(L.bullets[0])}</p></div></article>` +
    `<div class="ld__cols">` +
    `<section aria-labelledby="ld-awards"><h3 class="ld__sub" id="ld-awards">Awards</h3>` +
    `<ul class="ld__awards" role="list">${awards.map(award).join('')}</ul></section>` +
    `<section aria-labelledby="ld-acts"><h3 class="ld__sub" id="ld-acts">Activities</h3>` +
    `<ul class="ld__acts" role="list">${activities.map((a) =>
      `<li><h4>${esc(a.title)}</h4><p>${esc(a.detail)}</p></li>`).join('')}</ul></section>` +
    `</div></div>`;
}
