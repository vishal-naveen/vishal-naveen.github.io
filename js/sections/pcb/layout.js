// Board layout: pure geometry, no DOM and no three.js, so it can be checked in Node.
// Units are millimetres. X runs right, Z runs toward the viewer, Y is up. The board is laid out
// landscape; on narrow screens the scene simply yaws the whole board a quarter turn.
import { SKILLS } from './data.js';

export const BOARD = { w: 186, d: 124, t: 1.6, r: 4.2 };
const PX = 30;
const PZ = 28;
const cellX = (c) => (c - 2.5) * PX;
const cellZ = (r) => (r - 1.5) * PZ;

// Package specs. hx/hz are the half-extents of the whole footprint, pins included.
export const PKG = {
  qfp: { body: 14.5, h: 1.7, pins: 12, pitch: 1.05, pinLen: 2.4, hx: 9.65, hz: 9.65 },
  qfn: { body: 16.6, h: 1.0, hx: 8.5, hz: 8.5 },
  bga: { body: 17, h: 1.5, hx: 8.5, hz: 8.5 },
  module: { w: 20, d: 12.5, hdr: 2.6, h: 3.1, hx: 10, hz: 7.55 },
  soic: { bw: 12.5, bd: 7, h: 1.7, pins: 8, pitch: 1.4, pinLen: 2.2, hx: 6.25, hz: 5.7 },
  mcu: { body: 28.2, h: 2.2, pins: 20, pitch: 1.2, pinLen: 3.3, hx: 17.4, hz: 17.4 },
};

// Trace slots on the MCU's four sides (mm along the side), in the order that keeps buses from crossing.
const MCU_EDGE = 16.6;
const R = {
  // left side, top to bottom
  swift: [[-MCU_EDGE, -10], [-24, -10], [-28, -14], [-36, -14]],
  java: [[-MCU_EDGE, -2.2], [-58, -2.2], [-62, -6.2], [-62, -12], [-64, -14], [-67, -14]],
  javascript: [[-MCU_EDGE, 2.2], [-58, 2.2], [-62, 6.2], [-62, 12], [-64, 14], [-67, 14]],
  sql: [[-MCU_EDGE, 10], [-24, 10], [-28, 14], [-36, 14]],
  // right side
  huggingface: [[MCU_EDGE, -10], [24, -10], [28, -14], [37, -14]],
  sb3: [[MCU_EDGE, -2.2], [58, -2.2], [62, -6.2], [62, -12], [64, -14], [67, -14]],
  coreml: [[MCU_EDGE, 2.2], [58, 2.2], [62, 6.2], [62, 12], [64, 14], [67, 14]],
  opencv: [[MCU_EDGE, 10], [24, 10], [28, 14], [37, 14]],
  // top side: two lanes out to each far corner, straight runs up to the modules' headers
  python: [[-13.5, -MCU_EDGE], [-13.5, -23.6], [-16.5, -26.6], [-72, -26.6], [-75, -29.6], [-75, -33]],
  cpp: [[-10.25, -MCU_EDGE], [-10.25, -26.4], [-13.25, -29.4], [-43.5, -29.4], [-45, -30.9], [-45, -33]],
  imitation: [[-7, -MCU_EDGE], [-7, -35.75]],
  teleop: [[7, -MCU_EDGE], [7, -35.75]],
  pytorch: [[10.25, -MCU_EDGE], [10.25, -26.4], [13.25, -29.4], [41.6, -29.4], [45, -32.8], [45, -34.6]],
  lerobot: [[13.5, -MCU_EDGE], [13.5, -23.6], [16.5, -26.6], [72, -26.6], [75, -29.6], [75, -34.6]],
  // bottom side
  git: [[-13.5, MCU_EDGE], [-13.5, 23.6], [-16.5, 26.6], [-68.5, 26.6], [-75, 33.1], [-75, 37]],
  arkit: [[-10.25, MCU_EDGE], [-10.25, 26.4], [-13.25, 29.4], [-39.5, 29.4], [-45, 34.9], [-45, 37]],
  pid: [[-7, MCU_EDGE], [-7, 35.75]],
  bezier: [[7, MCU_EDGE], [7, 35.75]],
  node: [[10.25, MCU_EDGE], [10.25, 26.4], [13.25, 29.4], [39.5, 29.4], [45, 34.9], [45, 37]],
};
// The USB-C power run (decorative: it is the board's supply, not a skill).
const POWER = [[13.5, MCU_EDGE], [13.5, 23.6], [16.5, 26.6], [72, 26.6], [75, 29.6], [75, 53]];

export function polyLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

/* ---- tiny geometry helpers (also used by the validator) ---- */
const ptSeg = (px, pz, a, b) => {
  const dx = b[0] - a[0]; const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)) : 0;
  return Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz));
};
const segCross = (a, b, c, d) => {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};
export const segSegDist = (a, b, c, d) => (segCross(a, b, c, d) ? 0
  : Math.min(ptSeg(a[0], a[1], c, d), ptSeg(b[0], b[1], c, d), ptSeg(c[0], c[1], a, b), ptSeg(d[0], d[1], a, b)));
// distance from a segment to an axis-aligned rect {x,z,hx,hz}
export function segRectDist(a, b, r) {
  const x0 = r.x - r.hx; const x1 = r.x + r.hx; const z0 = r.z - r.hz; const z1 = r.z + r.hz;
  const inside = (p) => p[0] >= x0 && p[0] <= x1 && p[1] >= z0 && p[1] <= z1;
  if (inside(a) || inside(b)) return 0;
  const cs = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  let m = Infinity;
  for (let i = 0; i < 4; i++) {
    const c = cs[i]; const d = cs[(i + 1) % 4];
    m = Math.min(m, segSegDist(a, b, c, d));
  }
  return m;
}
const rectRectGap = (p, q) => Math.max(Math.abs(p.x - q.x) - p.hx - q.hx, Math.abs(p.z - q.z) - p.hz - q.hz);

// Small seeded PRNG so the decorative parts land in the same place every visit.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function buildLayout() {
  const chips = SKILLS.map((s) => {
    const spec = PKG[s.pkg];
    const x = cellX(s.cell[0]); const z = cellZ(s.cell[1]);
    // Modules carry their header on the side that faces the MCU.
    const facing = s.pkg === 'module' ? (s.cell[1] === 0 ? 1 : -1) : 0;
    const rect = { x, z, hx: spec.hx, hz: spec.hz };
    // 0603 LED and its series resistor sit at the pin-1 side, in the corner.
    const led = { x: x - spec.hx - 2.0, z: z - spec.hz + 1.6, hx: 0.6, hz: 1.2 };
    const res = { x: led.x, z: z - spec.hz + 4.7, hx: 0.6, hz: 1.0 };
    const route = R[s.id];
    return { ...s, x, z, hx: spec.hx, hz: spec.hz, spec, facing, rect, led, res, route, length: polyLength(route) };
  });
  const mcu = { id: 'mcu', name: 'VN', x: 0, z: 0, hx: PKG.mcu.hx, hz: PKG.mcu.hz, spec: PKG.mcu, rect: { x: 0, z: 0, hx: PKG.mcu.hx, hz: PKG.mcu.hz } };

  // Decorative parts: decoupling caps at the MCU corners and a crystal, each kept only if it clears the traces.
  const usb = { x: 75, z: 58.6, hx: 6.5, hz: 6.2 };
  const crystal = { x: 24.5, z: -21.6, hx: 2.7, hz: 1.7 };
  const caps = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    for (let k = 0; k < 2; k++) caps.push({ x: sx * (20.5 + k * 2.6), z: sz * 20.6, hx: 0.5, hz: 0.9, rot: 1 });
  }
  const powerRoute = POWER;
  const routes = chips.map((c) => c.route).concat([powerRoute]);
  const clearOf = (item, margin) => routes.every((r) => {
    for (let i = 1; i < r.length; i++) if (segRectDist(r[i - 1], r[i], item) < margin) return false;
    return true;
  }) && chips.every((c) => rectRectGap(item, c.rect) > margin) && rectRectGap(item, mcu.rect) > margin - 0.2;

  const passives = { caps: caps.filter((c) => clearOf(c, 1.6)), crystal: clearOf(crystal, 1.6) ? crystal : null };

  const W = BOARD.w; const D = BOARD.d;
  const holes = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ x: sx * (W / 2 - 5.6), z: sz * (D / 2 - 5.6), r: 1.75, ring: 3.3 }));
  const fids = [{ x: -78, z: -58 }, { x: 80, z: -58 }];

  // Ground-stitching vias inset from the edge, where the space is free.
  const rand = rng(7);
  const stitch = [];
  const inset = 5.4; const step = 7.2;
  const per = [];
  for (let x = -W / 2 + 12; x <= W / 2 - 12; x += step) { per.push([x, -D / 2 + inset]); per.push([x, D / 2 - inset]); }
  for (let z = -D / 2 + 12; z <= D / 2 - 12; z += step) { per.push([-W / 2 + inset, z]); per.push([W / 2 - inset, z]); }
  const label = { x: -55, z: 54.3, hx: 27, hz: 5.4 };
  for (const [x, z] of per) {
    const item = { x, z, hx: 0.6, hz: 0.6 };
    const nearHole = holes.some((h) => Math.hypot(h.x - x, h.z - z) < 6.5);
    const nearLed = chips.some((c) => rectRectGap(item, { x: c.led.x, z: c.led.z, hx: 0.6, hz: 1.2 }) < 2.2 || rectRectGap(item, { x: c.res.x, z: c.res.z, hx: 0.6, hz: 1.0 }) < 2.2);
    if (!nearHole && !nearLed && clearOf(item, 2.6) && rectRectGap(item, usb) > 2.4 && rectRectGap(item, label) > 1.2) stitch.push({ x, z, r: 0.62, j: rand() });
  }
  // A handful of vias sitting on the traces themselves, where a bus changes layer.
  const onTrace = ['python', 'lerobot', 'git', 'node', 'java', 'coreml'].map((id) => {
    const r = R[id]; const p = r[3] ? r[3] : r[1];
    const q = id === 'java' || id === 'coreml' ? r[3] : r[2];
    return { x: q[0], z: q[1], r: 1.05, big: true };
  });

  return { board: BOARD, chips, mcu, routes: routes.slice(0, chips.length), powerRoute, usb, passives, holes, fids, stitch, onTrace, label, PKG };
}

// Node-side sanity check: reports any trace that runs too close to another trace or a part.
export function validate(L) {
  const issues = [];
  const rs = L.chips.map((c) => ({ id: c.id, r: c.route })).concat([{ id: 'power', r: L.powerRoute }]);
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      let m = Infinity;
      for (let a = 1; a < rs[i].r.length; a++) for (let b = 1; b < rs[j].r.length; b++) m = Math.min(m, segSegDist(rs[i].r[a - 1], rs[i].r[a], rs[j].r[b - 1], rs[j].r[b]));
      if (m < 2.0) issues.push(`trace ${rs[i].id} vs ${rs[j].id}: ${m.toFixed(2)} mm`);
    }
  }
  const parts = L.chips.map((c) => ({ id: c.id, rect: c.rect })).concat([{ id: 'mcu', rect: L.mcu.rect }, { id: 'usb', rect: L.usb }]);
  for (const t of rs) {
    for (const p of parts) {
      if (p.id === t.id || p.id === 'mcu' || (t.id === 'power' && p.id === 'usb')) continue;
      let m = Infinity;
      for (let a = 1; a < t.r.length; a++) m = Math.min(m, segRectDist(t.r[a - 1], t.r[a], p.rect));
      if (m < 1.4) issues.push(`trace ${t.id} vs part ${p.id}: ${m.toFixed(2)} mm`);
    }
    for (const c of L.chips) {
      for (const k of ['led', 'res']) {
        let m = Infinity;
        for (let a = 1; a < t.r.length; a++) m = Math.min(m, segRectDist(t.r[a - 1], t.r[a], c[k]));
        if (m < 1.6) issues.push(`trace ${t.id} vs ${k} of ${c.id}: ${m.toFixed(2)} mm`);
      }
    }
  }
  for (const c of L.chips) {
    for (const k of ['led', 'res']) {
      const q = c[k];
      if (Math.abs(q.x) + q.hx > L.board.w / 2 - 2 || Math.abs(q.z) + q.hz > L.board.d / 2 - 2) issues.push(`${k} of ${c.id} off the board`);
    }
  }
  return issues;
}
