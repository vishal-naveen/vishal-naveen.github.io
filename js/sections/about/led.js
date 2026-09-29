// A seven-segment LED clock (SVG) in ember, showing Gainesville local time. The one quiet EE easter egg.
const NS = 'http://www.w3.org/2000/svg';
// Segments a-g as [orientation, x, y]; digit cell is 10 x 18, segment thickness 1.7.
const T = 1.7;
const SEGS = [
  ['h', 1.4, 0.85], ['v', 9.15, 4.9], ['v', 9.15, 13.1], ['h', 1.4, 17.15], ['v', 0.85, 13.1], ['v', 0.85, 4.9], ['h', 1.4, 9],
];
const LEN = 7.2;
const DIGITS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];

function horizontalPoly([, x, y]) {
  const h = T / 2, c = T * 0.6;
  return [[x, y], [x + c, y - h], [x + LEN - c, y - h], [x + LEN, y], [x + LEN - c, y + h], [x + c, y + h]];
}

function verticalPoly([, x, cy]) {
  const h = T / 2, half = LEN / 2, c = T * 0.6;
  return [[x, cy - half], [x + h, cy - half + c], [x + h, cy + half - c], [x, cy + half], [x - h, cy + half - c], [x - h, cy - half + c]];
}

function digitSvg() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 18');
  svg.setAttribute('class', 'led__d');
  svg.setAttribute('aria-hidden', 'true');
  SEGS.forEach((s, i) => {
    const pts = s[0] === 'h' ? horizontalPoly(s) : verticalPoly(s);
    const el = document.createElementNS(NS, 'polygon');
    el.setAttribute('points', pts.map((q) => q.map((n) => n.toFixed(2)).join(',')).join(' '));
    el.dataset.s = 'abcdefg'[i];
    svg.appendChild(el);
  });
  return svg;
}

function colonSvg() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 4 18');
  svg.setAttribute('class', 'led__c');
  svg.setAttribute('aria-hidden', 'true');
  [6.2, 11.8].forEach((y) => {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', '1'); r.setAttribute('y', String(y - 1)); r.setAttribute('width', '2'); r.setAttribute('height', '2'); r.setAttribute('rx', '0.4');
    svg.appendChild(r);
  });
  return svg;
}

/** Mounts HH:MM:SS into `host` and keeps it ticking (only while the tab is visible). */
export function mountLed(host, timeZone, reduced) {
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return; }
  const digits = [];
  [0, 1, ':', 2, 3, ':', 4, 5].forEach((k) => {
    if (k === ':') { host.appendChild(colonSvg()); return; }
    const d = digitSvg();
    digits[k] = d;
    host.appendChild(d);
  });
  const shown = new Array(6).fill(-1);
  const paint = () => {
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    const str = `${parts.hour}${parts.minute}${parts.second}`.replace(/\D/g, '').padStart(6, '0');
    for (let i = 0; i < 6; i++) {
      const n = Number(str[i]);
      if (n === shown[i]) continue;
      shown[i] = n;
      const on = DIGITS[n];
      digits[i].querySelectorAll('polygon').forEach((p) => p.classList.toggle('on', on.includes(p.dataset.s)));
    }
  };
  paint();
  if (reduced) return;
  let id = 0;
  const run = () => { paint(); id = setInterval(paint, 1000); };
  run();
  document.addEventListener('visibilitychange', () => { clearInterval(id); if (!document.hidden) run(); });
}
