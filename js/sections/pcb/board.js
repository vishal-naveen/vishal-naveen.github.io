// The physical board: soldermask slab, silkscreen, raised traces, vias, passives and the USB-C receptacle.
import * as THREE from 'three';
import { traceGeometry, box, ringFlat, stadium, mergeGeometries } from './geom.js';
import { traceMaterial } from './materials.js';

const at = (g, x, y, z) => g.translate(x, y, z);
const shadowed = (o, cast = true) => { o.castShadow = cast; o.receiveShadow = true; return o; };

function boardShape(L) {
  const { w, d, r } = L.board;
  const s = new THREE.Shape();
  const x0 = -w / 2; const x1 = w / 2; const y0 = -d / 2; const y1 = d / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  for (const h of L.holes) {
    const p = new THREE.Path(); p.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true); s.holes.push(p);
  }
  return s;
}

export function buildSlab(L, M) {
  const g = new THREE.ExtrudeGeometry(boardShape(L), { depth: L.board.t, bevelEnabled: false, curveSegments: 20 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -L.board.t, 0);
  const m = new THREE.Mesh(g, [M.mask, M.edge]);
  return shadowed(m);
}

export function buildSilk(L, M, silkTex) {
  const g = new THREE.PlaneGeometry(L.board.w, L.board.d);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, Object.assign(M.silk.clone(), { map: silkTex }));
  m.position.y = 0.012; m.renderOrder = 1;
  m.receiveShadow = true;
  return m;
}

/** One mesh per chip route so each can carry its own pulse. Returns [{mesh, u, length}]. */
export function buildTraces(L, M) {
  const out = L.chips.map((c) => {
    const geo = traceGeometry(c.route, { width: 1.35, height: 0.42 });
    const mat = traceMaterial(M.gold);
    const mesh = shadowed(new THREE.Mesh(geo, mat), true);
    return { mesh, u: mat.userData.u, length: geo.userData.length };
  });
  const power = shadowed(new THREE.Mesh(traceGeometry(L.powerRoute, { width: 1.9, height: 0.4 }), M.gold), true);
  return { items: out, power };
}

export function buildVias(L, M) {
  const g = new THREE.Group();
  const stitch = ringFlat(0.26, 0.64, 20); const trace = ringFlat(0.5, 1.08, 24);
  const holes = ringFlat(L.holes[0].r, L.holes[0].ring, 48);
  const fid = ringFlat(0, 0.55, 16);
  const inst = (geo, list, y, mat) => {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const m = new THREE.Matrix4();
    list.forEach((p, i) => { m.makeTranslation(p.x, y, p.z); im.setMatrixAt(i, m); });
    im.receiveShadow = true;
    return im;
  };
  g.add(inst(stitch, L.stitch, 0.03, M.gold));
  g.add(inst(trace, L.onTrace, 0.42, M.gold));
  g.add(inst(holes, L.holes, 0.03, M.gold));
  g.add(inst(fid, L.fids, 0.03, M.gold));
  // Dark centres for the on-trace vias.
  const dark = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.6 });
  const disc = new THREE.CircleGeometry(0.5, 16); disc.rotateX(-Math.PI / 2);
  g.add(inst(disc, L.onTrace, 0.425, dark));
  return g;
}

/** LED + series resistor per chip, plus decoupling caps and a crystal. LEDs are returned for animation. */
export function buildPassives(L, M) {
  const g = new THREE.Group();
  const tinParts = []; const goldParts = []; const resParts = []; const capParts = [];
  const leds = [];

  const smd = (p, bodyW, bodyH, bodyL, list) => {
    const b = at(box(bodyW, bodyH, bodyL, 0.06), p.x, 0.12, p.z); list.push(b);
    for (const s of [-1, 1]) {
      tinParts.push(at(box(bodyW + 0.06, bodyH + 0.04, 0.34, 0.05), p.x, 0.12, p.z + s * (bodyL / 2 - 0.12)));
      goldParts.push(at(box(bodyW + 0.5, 0.07, 0.95, 0.02), p.x, 0.02, p.z + s * (bodyL / 2 + 0.02)));
    }
  };
  for (const c of L.chips) {
    smd(c.res, 1.0, 0.45, 1.75, resParts);
    // LED: its own mesh + material so the emissive can animate.
    const ledGeo = at(box(1.02, 0.5, 1.5, 0.12), c.led.x, 0.12, c.led.z);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xe0651f, roughness: 0.28, clearcoat: 0.6, emissive: new THREE.Color(0xff5a1f), emissiveIntensity: 0 });
    const mesh = shadowed(new THREE.Mesh(ledGeo, mat), false);
    g.add(mesh);
    for (const s of [-1, 1]) {
      tinParts.push(at(box(1.08, 0.54, 0.34, 0.05), c.led.x, 0.12, c.led.z + s * 0.9));
      goldParts.push(at(box(1.5, 0.07, 0.95, 0.02), c.led.x, 0.02, c.led.z + s * 1.0));
    }
    leds.push({ mesh, mat, pos: new THREE.Vector3(c.led.x, 0.8, c.led.z) });
  }
  for (const c of L.passives.caps) smd(c, 1.0, 0.55, 1.75, capParts);
  const merged = (parts, mat) => { if (parts.length) g.add(shadowed(new THREE.Mesh(mergeGeometries(parts, false), mat), true)); };
  merged(resParts, M.resistor); merged(capParts, M.ceramic); merged(tinParts, M.tin); merged(goldParts, M.goldSoft);

  const y = L.passives.crystal;
  if (y) {
    g.add(shadowed(new THREE.Mesh(at(box(5, 1.25, 3.2, 0.3), y.x, 0.1, y.z), M.steel)));
    const pads = [-1, 1].map((s) => at(box(1.3, 0.07, 3.1, 0.02), y.x + s * 2.85, 0.02, y.z));
    g.add(shadowed(new THREE.Mesh(mergeGeometries(pads, false), M.goldSoft), false));
  }
  return { group: g, leds };
}

export function buildUsb(L, M) {
  const g = new THREE.Group();
  const u = L.usb; const depth = 10; const W = 12; const H = 4.4;
  const shell = new THREE.ExtrudeGeometry(
    (() => { const s = stadium(W, H, H / 2); const h = stadium(W - 1.3, H - 1.3, (H - 1.3) / 2); s.holes.push(new THREE.Path(h.getPoints(24))); return s; })(),
    { depth, bevelEnabled: false, curveSegments: 12 },
  );
  at(shell, 0, H / 2 + 0.12, -depth);
  const sm = shadowed(new THREE.Mesh(shell, M.steel)); sm.position.z = 63.4;
  const back = at(box(W - 1.2, H - 1.2, 0.6, 0.1), 0, 0.12 + 0.6, -depth + 0.3);
  const inner = shadowed(new THREE.Mesh(back, M.plastic), false); inner.position.z = 63.4;
  const tongue = at(box(W - 3.4, 0.7, 6.4, 0.08), 0, H / 2 - 0.05, -depth + 3.3);
  const tm = shadowed(new THREE.Mesh(tongue, M.plastic), false); tm.position.z = 63.4;
  const contacts = [];
  for (let i = -4; i <= 4; i++) contacts.push(at(box(0.5, 0.05, 4.6, 0.02), i * 0.95, H / 2 + 0.66, -depth + 3.3));
  const cm = shadowed(new THREE.Mesh(mergeGeometries(contacts, false), M.gold), false); cm.position.z = 63.4;
  g.add(sm, inner, tm, cm);
  g.position.x = u.x;
  return g;
}
