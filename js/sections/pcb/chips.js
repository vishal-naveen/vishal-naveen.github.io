// The five package families, built from the layout records. Everything sits on the board top (y = 0).
import * as THREE from 'three';
import { slab, box, gullWing, leadFrame, mergeGeometries } from './geom.js';
import { chipTexture } from './textures.js';
import { chipMaterial } from './materials.js';

const HALF = Math.PI / 2;
const CAN = [12.6, 10.8]; // module shield can, kept near-square so the name reads upright in either orientation
const at = (g, x, y, z) => g.translate(x, y, z);
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o; };

function qfp(rec, M, tex, rot) {
  const s = rec.spec; const y0 = 0.26; const b = s.body;
  const body = at(slab(b, s.h, b, 0.5), 0, y0, 0);
  const lead = gullWing({ start: -0.2, shoulder: 0.5, drop: 0.85, len: s.pinLen, top: y0 + s.h * 0.5, foot: 0.2, thick: 0.2, width: 0.5 });
  const sides = [0, HALF, Math.PI, Math.PI * 1.5].map((angle) => ({ angle, count: s.pins, pitch: s.pitch, out: b / 2 }));
  const mat = chipMaterial(tex);
  const g = new THREE.Group();
  g.add(mesh(body, mat), mesh(leadFrame(lead, sides), M.tin));
  return { group: g, mats: [mat], height: y0 + s.h };
}

function qfn(rec, M, tex) {
  const s = rec.spec; const b = s.body; const y0 = 0.1;
  const body = at(slab(b, s.h, b, 0.4), 0, y0, 0);
  const pads = [];
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 16; i++) {
      const p = box(0.9, 0.18, 0.5, 0.03);
      at(p, b / 2 - 0.25, 0.05, (i - 7.5) * 0.98);
      p.rotateY(side * HALF);
      pads.push(p);
    }
  }
  const mat = chipMaterial(tex);
  const g = new THREE.Group();
  g.add(mesh(body, mat), mesh(mergeGeometries(pads, false), M.gold));
  return { group: g, mats: [mat], height: y0 + s.h };
}

function bga(rec, M, tex) {
  const s = rec.spec; const b = s.body;
  const sub = at(slab(b, 0.55, b, 0.3), 0, 0.12, 0);
  const cap = at(slab(b - 1.3, 0.95, b - 1.3, 0.4), 0, 0.67, 0);
  const mat = chipMaterial(tex);
  const g = new THREE.Group();
  g.add(mesh(sub, M.substrate), mesh(cap, mat));
  // A ring of solder balls just visible under the substrate lip.
  const balls = [];
  const bg = new THREE.SphereGeometry(0.34, 8, 6);
  for (let i = 0; i < 18; i++) {
    for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const t = (i - 8.5) * 0.88;
      const ball = bg.clone(); at(ball, fx ? fx * (b / 2 - 0.35) : t, 0.12, fz ? fz * (b / 2 - 0.35) : t); balls.push(ball);
    }
  }
  g.add(mesh(mergeGeometries(balls, false), M.tin, false));
  return { group: g, mats: [mat], height: 1.62 };
}

function moduleChip(rec, M, tex) {
  const s = rec.spec; const f = rec.facing;
  const g = new THREE.Group();
  const subZ = -f * (s.hdr / 2);
  const sub = at(slab(s.w, 0.9, s.d, 0.3), 0, 0.14, subZ);
  const can = at(slab(CAN[0], 2.2, CAN[1], 0.32), 0, 1.04, subZ);
  const mat = chipMaterial(tex, { metal: 0.55 });
  // Castellated edge pads.
  const pads = [];
  for (const sz of [-1, 1]) for (let i = 0; i < 7; i++) pads.push(at(box(1.2, 0.5, 0.7, 0.1), (i - 3) * 2.7, 0.2, subZ + sz * (s.d / 2 - 0.15)));
  // Pin header on the MCU-facing edge, its first pin lining up with the trace.
  const col = rec.cell[0];
  const p0 = col === 2 ? 8 : -8; const step = col === 2 ? -3.3 : 3.3;
  const hz = f * 6.25;
  const cx = p0 + step * 2.5;
  const base = at(box(19, 2.3, 2.54, 0.12), cx, 0, hz);
  const posts = [];
  for (let i = 0; i < 6; i++) posts.push(at(box(0.72, 3.4, 0.72, 0.06), p0 + step * i, 1.55, hz));
  g.add(mesh(sub, M.substrate), mesh(can, mat), mesh(mergeGeometries(pads, false), M.gold), mesh(base, M.plastic), mesh(mergeGeometries(posts, false), M.gold));
  return { group: g, mats: [mat], height: 4.9 };
}

function soic(rec, M, tex) {
  const s = rec.spec; const y0 = 0.3;
  const body = at(slab(s.bw, s.h, s.bd, 0.35), 0, y0, 0);
  const lead = gullWing({ start: -0.2, shoulder: 0.45, drop: 0.7, len: s.pinLen, top: y0 + s.h * 0.5, foot: 0.2, thick: 0.19, width: 0.5 });
  const sides = [HALF, -HALF].map((angle) => ({ angle, count: s.pins, pitch: s.pitch, out: s.bd / 2 }));
  const mat = chipMaterial(tex);
  const g = new THREE.Group();
  g.add(mesh(body, mat), mesh(leadFrame(lead, sides), M.tin));
  return { group: g, mats: [mat], height: y0 + s.h };
}

const BUILD = { qfp, qfn, bga, module: moduleChip, soic };

/** Face size (board frame, mm) that carries the etched text for each family. */
function faceSize(rec) {
  const s = rec.spec;
  switch (rec.pkg) {
    case 'qfp': return [s.body, s.body];
    case 'qfn': return [s.body, s.body];
    case 'bga': return [s.body - 1.3, s.body - 1.3];
    case 'module': return [CAN[0], CAN[1]];
    case 'soic': return [s.bw, s.bd];
    default: return [s.body, s.body];
  }
}

export function makeChipTexture(rec, rot, ppm) {
  const [w, d] = faceSize(rec);
  const lines = rot !== 0 && rec.linesP ? rec.linesP : rec.lines;
  return chipTexture({ lines, wmm: w, dmm: d, rot, ppm, kind: rec.pkg === 'module' ? 'module' : 'ic' });
}

export function buildChip(rec, M, rot, ppm) {
  const tex = makeChipTexture(rec, rot, ppm);
  const out = BUILD[rec.pkg](rec, M, tex, rot);
  out.group.position.set(rec.x, 0, rec.z);
  out.tex = tex;
  return out;
}

export function makeMcuTexture(rec, rot, ppm) {
  return chipTexture({ lines: ['VN'], wmm: rec.spec.body, dmm: rec.spec.body, rot, ppm, kind: 'ic', mcu: true });
}

export function buildMcu(rec, M, rot, ppm) {
  const s = rec.spec; const y0 = 0.3; const b = s.body;
  const tex = makeMcuTexture(rec, rot, ppm);
  const body = at(slab(b, s.h, b, 0.7), 0, y0, 0);
  const lead = gullWing({ start: -0.25, shoulder: 0.6, drop: 1.05, len: s.pinLen, top: y0 + s.h * 0.5, foot: 0.22, thick: 0.22, width: 0.55 });
  const sides = [0, HALF, Math.PI, Math.PI * 1.5].map((angle) => ({ angle, count: s.pins, pitch: s.pitch, out: b / 2 }));
  const mat = chipMaterial(tex);
  const g = new THREE.Group();
  g.add(mesh(body, mat), mesh(leadFrame(lead, sides), M.tin));
  g.position.set(0, 0, 0);
  return { group: g, mats: [mat], height: y0 + s.h, tex };
}
