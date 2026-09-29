// Geometry builders for the board: raised rounded traces, gull-wing pins, chip bodies.
// Units are millimetres; the board top is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A copper trace: a half-round bead following a Manhattan / 45 degree polyline [[x,z], ...].
 *  `aT` carries the arc length from the start (mm) so a shader can send a pulse down it. */
export function traceGeometry(pts, { width = 1.2, height = 0.36, seg = 8, base = 0.02 } = {}) {
  const n = pts.length;
  const K = seg;
  const dirs = [];
  const arc = [0];
  for (let i = 1; i < n; i++) {
    const dx = pts[i][0] - pts[i - 1][0]; const dz = pts[i][1] - pts[i - 1][1];
    const l = Math.hypot(dx, dz) || 1;
    dirs.push([dx / l, dz / l]);
    arc.push(arc[i - 1] + l);
  }
  const pos = []; const nor = []; const uv = []; const aT = [];
  const a = width / 2;
  for (let i = 0; i < n; i++) {
    const d0 = dirs[Math.max(0, i - 1)]; const d1 = dirs[Math.min(dirs.length - 1, i)];
    const n0 = [-d0[1], d0[0]]; const n1 = [-d1[1], d1[0]];
    let mx = n0[0] + n1[0]; let mz = n0[1] + n1[1];
    const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const scale = Math.min(2, 1 / Math.max(0.5, mx * n0[0] + mz * n0[1]));
    for (let k = 0; k <= K; k++) {
      const th = (Math.PI * k) / K;
      const c = Math.cos(th); const s = Math.sin(th);
      const lat = -c * a; const y = s * height;
      pos.push(pts[i][0] + mx * scale * lat, base + y, pts[i][1] + mz * scale * lat);
      let nl = -c / a; let ny = s / height;
      const nn = Math.hypot(nl, ny); nl /= nn; ny /= nn;
      nor.push(mx * nl, ny, mz * nl);
      uv.push(arc[i], k / K);
      aT.push(arc[i]);
    }
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < K; k++) {
      const A = i * (K + 1) + k; const B = A + 1; const C = A + (K + 1); const D = C + 1;
      idx.push(A, B, C, B, D, C);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
  g.setIndex(idx);
  g.userData.length = arc[n - 1];
  return g;
}

/** Overwrite UVs with a planar top-down projection so a canvas texture lands on the top face. */
function topUV(g, w, d) {
  const p = g.attributes.position; const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, 0.5 - p.getZ(i) / d);
  uv.needsUpdate = true;
  return g;
}

/** Rounded slab standing on y = 0 with its top face UV-mapped for a canvas texture. */
export function slab(w, h, d, r = 0.35, opts = {}) {
  const g = new RoundedBoxGeometry(w, h, d, opts.segments || 3, Math.min(r, h / 2 - 0.01));
  g.translate(0, h / 2, 0);
  return topUV(g, w, d);
}

/** Plain rounded box (no UV rewrite) standing on y = 0, centred in x and z. */
export function box(w, h, d, r = 0.1) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, h / 2 - 0.005, w / 2 - 0.005, d / 2 - 0.005));
  g.translate(0, h / 2, 0);
  return g;
}

// Thick 2D polyline -> closed polygon (mitre joins), used for the gull-wing profile.
function thickPolyline(pts, t) {
  const left = []; const right = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)]; const p1 = pts[i]; const p2 = pts[Math.min(pts.length - 1, i + 1)];
    const d0 = [p1[0] - p0[0], p1[1] - p0[1]]; const d1 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l0 = Math.hypot(...d0) || 1; const l1 = Math.hypot(...d1) || 1;
    const n0 = [-d0[1] / l0, d0[0] / l0]; const n1 = [-d1[1] / l1, d1[0] / l1];
    let mx = n0[0] + n1[0]; let my = n0[1] + n1[1];
    const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
    const k = (t / 2) / Math.max(0.4, mx * n0[0] + my * n0[1]);
    left.push([p1[0] + mx * k, p1[1] + my * k]);
    right.push([p1[0] - mx * k, p1[1] - my * k]);
  }
  return left.concat(right.reverse());
}

/** One gull-wing lead. Local +x is outward from the package, y up, z along the side. */
export function gullWing({ start = -0.15, shoulder = 0.55, drop = 0.85, len = 2.4, top = 0.95, foot = 0.22, thick = 0.2, width = 0.5 } = {}) {
  const prof = [[start, top], [shoulder, top], [shoulder + drop, foot], [len, foot]];
  const poly = thickPolyline(prof, thick);
  const shape = new THREE.Shape(poly.map((p) => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -width / 2);
  return g;
}

/** Leads for a set of sides. sides: [{angle, count, span, offset}] with angle about Y (0 = +x). */
export function leadFrame(lead, sides) {
  const parts = [];
  const m = new THREE.Matrix4(); const r = new THREE.Matrix4(); const t = new THREE.Matrix4();
  for (const s of sides) {
    r.makeRotationY(s.angle);
    for (let i = 0; i < s.count; i++) {
      const along = (i - (s.count - 1) / 2) * s.pitch;
      t.makeTranslation(s.out, 0, along);
      m.copy(r).multiply(t);
      parts.push(lead.clone().applyMatrix4(m));
    }
  }
  return mergeGeometries(parts, false);
}

export { mergeGeometries };

/** Flat ring lying on the board (for vias, mounting rings, fiducials). */
export function ringFlat(inner, outer, segs = 28) {
  const g = new THREE.RingGeometry(inner, outer, segs, 1);
  g.rotateX(-Math.PI / 2);
  return g;
}

/** Stadium (rounded slot) shape, used by the USB-C shell. */
export function stadium(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x0 = cx - w / 2; const x1 = cx + w / 2; const y0 = cy - h / 2; const y1 = cy + h / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y0 + r, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  return s;
}
