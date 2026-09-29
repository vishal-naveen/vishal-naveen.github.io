// Canvas textures: laser-etched chip tops, the silkscreen layer, mask grain and a soft floor fade.
import * as THREE from 'three';

const SANS = '"Mona Sans", ui-sans-serif, system-ui, -apple-system, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

const rand = (() => { let s = 12345; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
  return c;
}

function tex(c, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function fitLines(ctx, lines, boxW, boxH, weight, maxPx) {
  const ref = 100;
  ctx.font = `${weight} ${ref}px ${SANS}`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const lineH = ref * 1.08;
  const k = Math.min(boxW / widest, boxH / (lineH * lines.length - ref * 0.08), maxPx / ref);
  return ref * k;
}

/**
 * The top of one package. `wmm` x `dmm` is the face in the board frame; `rot` turns the text so it stays
 * upright on screen when the board is yawed a quarter turn.
 */
export function chipTexture({ lines, wmm, dmm, ppm = 34, rot = 0, kind = 'ic', mcu = false }) {
  const W = wmm * ppm; const H = dmm * ppm;
  const c = canvas(W, H); const ctx = c.getContext('2d');
  const isModule = kind === 'module';
  ctx.fillStyle = isModule ? '#121212' : '#0b0b0c';
  ctx.fillRect(0, 0, c.width, c.height);

  // Mould-compound grain.
  const n = Math.round((c.width * c.height) / 14);
  for (let i = 0; i < n; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.02 + rand() * 0.035})` : `rgba(0,0,0,${0.15 + rand() * 0.2})`;
    ctx.fillRect(rand() * c.width, rand() * c.height, 1, 1);
  }
  if (isModule) { // brushed can
    for (let i = 0; i < c.height / 2; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rand() * 0.035})`;
      ctx.fillRect(0, i * 2 + rand() * 2, c.width, 1);
    }
  }
  // Moulded top step, a hair lighter than the body.
  const inset = 0.055 * Math.min(c.width, c.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = Math.max(1, ppm * 0.09);
  ctx.strokeRect(inset, inset, c.width - inset * 2, c.height - inset * 2);

  // Pin-1 dimple, top-left in the board frame.
  const pr = Math.min(c.width, c.height) * (mcu ? 0.028 : 0.05);
  const px = inset + pr * 2.3; const py = inset + pr * 2.3;
  const g = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
  g.addColorStop(0, '#050505'); g.addColorStop(0.75, '#1a1a1a'); g.addColorStop(1, '#3d3d3d');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();

  // Etched name.
  const quarter = Math.abs(Math.sin(rot)) > 0.5;
  const boxW = (quarter ? c.height : c.width) * (mcu ? 0.7 : 0.86);
  const boxH = (quarter ? c.width : c.height) * (mcu ? 0.34 : 0.62);
  const weight = mcu ? 700 : 600;
  const maxPx = ppm * (mcu ? 11 : 3.7);
  const size = fitLines(ctx, lines, boxW, boxH, weight, maxPx);
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2 + (mcu ? -ppm * 1.1 : 0));
  ctx.rotate(rot);
  ctx.font = `${weight} ${size}px ${SANS}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * 0.012}px`;
  const lh = size * 1.08;
  ctx.fillStyle = '#c9c6c1';
  lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lh));
  if (mcu) {
    ctx.font = `600 ${ppm * 1.55}px ${MONO}`; ctx.fillStyle = '#7b7873';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${ppm * 0.18}px`;
    ctx.fillText('VN-01', 0, ppm * 7.4);
  }
  ctx.restore();
  return tex(c);
}

/** Off-white silkscreen on transparent: outlines, reference designators, the board label. */
export function silkTexture(L, { ppm = 12 } = {}) {
  const { w: BW, d: BD } = L.board;
  const c = canvas(BW * ppm, BD * ppm); const ctx = c.getContext('2d');
  const U = (x) => (x + BW / 2) * ppm; const V = (z) => (z + BD / 2) * ppm;
  ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // Edge keep-out line.
  const ins = 2.3;
  ctx.lineWidth = 0.32 * ppm;
  roundRect(ctx, U(-BW / 2 + ins), V(-BD / 2 + ins), (BW - ins * 2) * ppm, (BD - ins * 2) * ppm, 2.2 * ppm);
  ctx.stroke();

  const outline = (r, m = 0.55) => {
    ctx.lineWidth = 0.22 * ppm;
    ctx.strokeRect(U(r.x - r.hx - m), V(r.z - r.hz - m), (r.hx + m) * 2 * ppm, (r.hz + m) * 2 * ppm);
  };
  const label = (s, x, z, mm, o = {}) => {
    ctx.save();
    ctx.font = `${o.weight || 500} ${mm * ppm}px ${o.font || MONO}`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${(o.track || 0) * ppm}px`;
    ctx.fillText(s, U(x), V(z));
    ctx.restore();
  };

  outline(L.mcu.rect, 0.7);
  ctx.beginPath(); ctx.arc(U(-L.mcu.hx - 0.6), V(-L.mcu.hz - 0.6), 0.55 * ppm, 0, Math.PI * 2); ctx.fill();
  label('U1', L.mcu.hx + 0.9, -L.mcu.hz + 1.6, 1.8);
  for (const ch of L.chips) {
    outline(ch.rect);
    ctx.beginPath(); ctx.arc(U(ch.x - ch.hx - 0.55 - 0.1), V(ch.z - ch.hz - 0.55 - 0.9), 0.36 * ppm, 0, Math.PI * 2); ctx.fill();
    label(ch.ref, ch.x + ch.hx + 0.9, ch.z - ch.hz + 1.7, 1.7);
    label(`D${ch.index + 1}`, ch.led.x + 1.2, ch.led.z + 0.5, 1.15, { weight: 500 });
  }
  if (L.passives.crystal) { outline(L.passives.crystal, 0.5); label('Y1', L.passives.crystal.x - 1.2, L.passives.crystal.z - 2.6, 1.5); }
  outline(L.usb, 0.6); label('J1', L.usb.x - 12.2, L.usb.z - 3, 1.7);
  label('5V', L.powerRoute[4][0] + 1.6, 40, 1.5);

  // Board label.
  const lb = L.label;
  label('VN-01 rev A', lb.x - lb.hx, lb.z + 1.9, 4.6, { weight: 700, track: 0.1 });
  label('Vishal Naveen', lb.x - lb.hx, lb.z + 5.2, 1.9, { weight: 500, track: 0.35 });
  return tex(c);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Fine orange-peel grain for the soldermask (roughness + a whisper of bump). UVs are in mm, tile = 12 mm. */
export function grainTexture() {
  const c = canvas(512, 512); const ctx = c.getContext('2d');
  const img = ctx.createImageData(512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 190 + rand() * 65;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = tex(c, { srgb: false, repeat: true });
  t.repeat.set(1 / 12, 1 / 12);
  return t;
}

/** Radial fade so the floor dissolves into the page. */
export function fadeTexture() {
  const c = canvas(256, 256); const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#fff'); g.addColorStop(0.3, 'rgba(255,255,255,0.6)'); g.addColorStop(0.65, 'rgba(255,255,255,0.12)'); g.addColorStop(1, '#000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return tex(c, { srgb: false });
}

/** Soft round glow for the lit LED. */
export function glowTexture() {
  const c = canvas(64, 64); const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return tex(c);
}
