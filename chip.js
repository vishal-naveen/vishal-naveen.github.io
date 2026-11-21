// chip.js: the v7 chip (v7-chip/one.js: renderer, studio light, lid, substrate, caps) as the hero of v8.
// Closed: it floats in the hero, leans toward the cursor, tilts away as you scroll past, and peeks its lid every few
// seconds until someone opens it. Open (11-20: "incorporate a lot more projects into the chip since it can zoom and take
// over the whole screen"): the lid lifts, the canvas takes over the screen, and the die is a map of every role and project
// on the page, one labelled block each (drawn here from the page's own cards, so it never drifts from them). Hover lights a
// block; picking one flies the camera onto it and the page shows its details beside it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export async function startChip({ canvas, hero, rm, blocks, on }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.12; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(24, 1, 0.1, 200);

  // ---- studio light (softboxes -> PMREM), as v7
  const gradTex = (stops) => { const cv = Object.assign(document.createElement("canvas"), { width: 4, height: 256 }), g = cv.getContext("2d"), grd = g.createLinearGradient(0, 0, 0, 256);
    stops.forEach(([o, c]) => grd.addColorStop(o, c)); g.fillStyle = grd; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  {
    const env = new THREE.Scene(); env.background = new THREE.Color(0x020202);
    const box = (w, h, pos, k, color = 0xffffff, map = null) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), map, side: THREE.DoubleSide })); m.position.copy(pos); m.lookAt(0, 0, 0); env.add(m); };
    box(17, 7.5, new THREE.Vector3(4.4, 5.2, -9.8).normalize().multiplyScalar(13), 2.4, 0xfff4e6, gradTex([[0, "#ffffff"], [0.44, "#ececec"], [0.5, "#202020"], [1, "#000000"]]));
    box(7, 5, new THREE.Vector3(3, 13, -8), 1.3); box(1.2, 18, new THREE.Vector3(-11, 3, 1), 7.0); box(1.2, 18, new THREE.Vector3(10, 3, 3), 3.2, 0xffcf9a); box(12, 0.8, new THREE.Vector3(0, 1.6, 12), 1.0);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.02).texture; pm.dispose();
  }

  // ---- textures
  await Promise.all(['600 100px "Switzer"', '500 70px "Switzer"', '500 40px "Geist Mono"'].map((f) => document.fonts.load(f))).catch(() => {});
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  function ihsMaps() {
    const S = 2048, col = Object.assign(document.createElement("canvas"), { width: S, height: S }), rou = Object.assign(document.createElement("canvas"), { width: S, height: S });
    const c = col.getContext("2d"), r = rou.getContext("2d");
    c.fillStyle = "#cfcdc8"; c.fillRect(0, 0, S, S); r.fillStyle = "rgb(30,30,30)"; r.fillRect(0, 0, S, S);
    const R = rng(7);
    for (let i = 0; i < 26000; i++) { const x = R() * S, y = R() * S, w = 40 + R() * 420, a = R() * 0.035; r.fillStyle = R() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; r.fillRect(x - w / 2, y, w, 1); }
    const etch = (draw) => { c.save(); r.save(); c.fillStyle = c.strokeStyle = "#87847e"; r.fillStyle = r.strokeStyle = "rgb(196,196,196)"; draw(c); draw(r); c.restore(); r.restore(); };
    const M = 170;
    etch((g) => {
      g.textBaseline = "alphabetic"; g.font = '600 176px "Switzer"'; g.fillText("VISHAL NAVEEN", M - 6, 380);
      g.font = '500 70px "Switzer"'; g.fillText("SOFTWARE ENGINEER", M, 510);
      g.font = '500 54px "Geist Mono"'; ["VN-29   PYTHON / C++ / ML", "ELECTRICAL ENGINEERING", "UNIVERSITY OF FLORIDA", "GAINESVILLE FL   2029"].forEach((t, i) => g.fillText(t, M, 680 + i * 84));
      g.font = '500 44px "Geist Mono"'; g.fillText("VN29-0412A   e4", M, 1830);
      g.beginPath(); g.moveTo(M, 1700); g.lineTo(M, 1560); g.lineTo(M + 140, 1700); g.closePath(); g.fill();
      const Q = rng(29), cell = 22, n = 16, x0 = S - M - n * cell, y0 = S - M - n * cell;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const edge = i === 0 || j === n - 1 ? 1 : j === 0 ? (i % 2 === 0 ? 1 : 0) : i === n - 1 ? (j % 2 === 1 ? 1 : 0) : Q() < 0.48; if (edge) g.fillRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1); }
    });
    const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const rmap = new THREE.CanvasTexture(rou); rmap.anisotropy = 8; return { map, rmap };
  }
  function substrateMap() {
    const S = 2048, cv = Object.assign(document.createElement("canvas"), { width: S, height: S }), g = cv.getContext("2d");
    g.fillStyle = "#120e0b"; g.fillRect(0, 0, S, S); const R = rng(3);
    g.strokeStyle = "rgba(239,231,218,.07)"; g.lineWidth = 5;
    for (let i = 0; i < 70; i++) { let x = R() * S, y = R() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { if (R() < 0.5) x += (R() - 0.5) * 700; else y += (R() - 0.5) * 700; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = "#c8a56a"; g.beginPath(); g.moveTo(60, S - 60); g.lineTo(60, S - 190); g.lineTo(190, S - 60); g.closePath(); g.fill();
    g.fillStyle = "rgba(235,235,225,.8)"; g.font = '500 40px "Geist Mono"'; g.fillText("VN-29  REV A", S - 420, S - 30);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function shadowTex() {
    const S = 256, cv = Object.assign(document.createElement("canvas"), { width: S, height: S }), g = cv.getContext("2d"), grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, "rgba(0,0,0,.85)"); grd.addColorStop(0.45, "rgba(0,0,0,.45)"); grd.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = grd; g.fillRect(0, 0, S, S); return new THREE.CanvasTexture(cv);
  }
  // ---- the die: every role and project as a block (squarified by weight), with standard-cell texture and an etched label
  const INK = { research: [142, 154, 230], experience: [214, 204, 188], project: [111, 195, 168] };
  function squarify(items, x, y, w, h) {
    const total = items.reduce((s, i) => s + i.v, 0), kk = (w * h) / total;
    const nodes = items.map((i) => ({ ...i, a: i.v * kk })).sort((a, b) => b.a - a.a);
    const out = []; let row = [], rx = x, ry = y, rw = w, rh = h;
    const worst = (r, side) => { const s = r.reduce((a, n) => a + n.a, 0), mx = Math.max(...r.map((n) => n.a)), mn = Math.min(...r.map((n) => n.a)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
    const lay = (r) => { const s = r.reduce((a, n) => a + n.a, 0);
      if (rw >= rh) { const cw = s / rh; let yy = ry; for (const n of r) { const ch = n.a / cw; out.push({ ...n, x: rx, y: yy, w: cw, h: ch }); yy += ch; } rx += cw; rw -= cw; }
      else { const ch = s / rw; let xx = rx; for (const n of r) { const cw = n.a / ch; out.push({ ...n, x: xx, y: ry, w: cw, h: ch }); xx += cw; } ry += ch; rh -= ch; } };
    let i = 0;
    while (i < nodes.length) { const side = Math.min(rw, rh), n = nodes[i]; if (!row.length || worst([...row, n], side) <= worst(row, side)) { row.push(n); i++; } else { lay(row); row = []; } }
    if (row.length) lay(row);
    return out;
  }
  const TS = matchMedia("(max-width: 860px)").matches ? 2048 : 4096, M0 = TS * 0.04, GAP = TS * 0.006;
  const REG = squarify(blocks.map((b) => ({ v: b.weight, b })), M0, M0, TS - 2 * M0, TS - 2 * M0).map((r) => ({ ...r.b, x: r.x + GAP / 2, y: r.y + GAP / 2, w: r.w - GAP, h: r.h - GAP }));
  function dieMap() {
    const cv = Object.assign(document.createElement("canvas"), { width: TS, height: TS }), g = cv.getContext("2d"), u = TS / 4096, R = rng(11);
    g.fillStyle = "#0c0d11"; g.fillRect(0, 0, TS, TS);
    // bond pads and the corner mark
    g.fillStyle = "#b99a62";
    for (let q = 90 * u; q < TS - 90 * u; q += 70 * u) { g.fillRect(q, 60 * u, 40 * u, 48 * u); g.fillRect(q, TS - 108 * u, 40 * u, 48 * u); g.fillRect(60 * u, q, 48 * u, 40 * u); g.fillRect(TS - 108 * u, q, 48 * u, 40 * u); }
    for (const rg of REG) {
      const ink = INK[rg.cat], c = (a) => `rgba(${ink[0]},${ink[1]},${ink[2]},${a})`, pad = Math.min(rg.w, rg.h) * 0.07 + 18 * u;
      g.fillStyle = `rgb(${ink[0] * 0.06 | 0},${ink[1] * 0.06 | 0},${ink[2] * 0.06 | 0})`; g.fillRect(rg.x, rg.y, rg.w, rg.h);
      // standard cells: rows of small rects, like a placed-and-routed block
      const rh = 15 * u;
      for (let y = rg.y + 10 * u; y < rg.y + rg.h - rh; y += rh + 3 * u) {
        let x = rg.x + 10 * u;
        while (x < rg.x + rg.w - 14 * u) { const w = (6 + R() * 42) * u; g.fillStyle = c(0.05 + R() * 0.13); g.fillRect(x, y, Math.min(w, rg.x + rg.w - 10 * u - x), rh); x += w + (2 + R() * 4) * u; }
      }
      // a memory macro in the bigger blocks
      if (rg.w > TS * 0.2 && rg.h > TS * 0.16) { const mw = rg.w * 0.32, mh = rg.h * 0.34, mx = rg.x + rg.w - mw - pad, my = rg.y + rg.h - mh - pad, cell = 11 * u;
        g.fillStyle = "#0b0c10"; g.fillRect(mx - 8 * u, my - 8 * u, mw + 16 * u, mh + 16 * u);
        for (let yy = my; yy < my + mh; yy += cell) for (let xx = mx; xx < mx + mw; xx += cell) { g.fillStyle = c(0.12 + R() * 0.12); g.fillRect(xx, yy, cell - 3 * u, cell - 3 * u); }
        g.strokeStyle = c(0.5); g.lineWidth = 3 * u; g.strokeRect(mx - 8 * u, my - 8 * u, mw + 16 * u, mh + 16 * u); }
      // the etched label, on a quiet plate so it reads at full screen
      let ft = Math.min(TS * 0.036, rg.w * 0.1, rg.h * 0.2);
      g.font = `600 ${ft}px Switzer`; while (g.measureText(rg.title).width > rg.w - 2 * pad && ft > TS * 0.012) { ft *= 0.94; g.font = `600 ${ft}px Switzer`; }
      const fk = Math.max(TS * 0.0062, ft * 0.3), fs = ft * 0.56, lw = Math.min(rg.w - pad, Math.max(g.measureText(rg.title).width, rg.kicker.length * fk * 0.62, rg.stat.length * fs * 0.52) + pad * 1.2);
      const lh = fk * 1.9 + ft * 1.05 + (rg.stat ? fs * 1.5 : 0) + pad * 0.6;
      g.fillStyle = `rgba(${ink[0] * 0.05 | 0},${ink[1] * 0.05 | 0},${ink[2] * 0.05 | 0},0.93)`; g.fillRect(rg.x + 6 * u, rg.y + 6 * u, lw, lh);
      g.textBaseline = "top";
      g.fillStyle = c(0.75); g.font = `500 ${fk}px "Geist Mono"`; g.fillText(rg.kicker.toUpperCase(), rg.x + pad * 0.6, rg.y + pad * 0.6, rg.w - pad);
      g.fillStyle = c(1); g.font = `600 ${ft}px Switzer`; g.fillText(rg.title, rg.x + pad * 0.6, rg.y + pad * 0.6 + fk * 1.9);
      if (rg.stat) { g.fillStyle = "rgba(239,231,218,.88)"; g.font = `500 ${fs}px Switzer`; g.fillText(rg.stat, rg.x + pad * 0.6, rg.y + pad * 0.6 + fk * 1.9 + ft * 1.12, rg.w - pad); }
      g.strokeStyle = c(0.85); g.lineWidth = 5 * u; g.strokeRect(rg.x + 2.5 * u, rg.y + 2.5 * u, rg.w - 5 * u, rg.h - 5 * u);
    }
    g.font = `500 ${40 * u}px "Geist Mono"`; g.fillStyle = "rgba(230,215,180,.7)"; g.textBaseline = "alphabetic"; g.fillText(`VN29 (C) 2026  ${REG.length} BLOCKS  EVERY ROLE AND PROJECT`, TS - 1240 * u, TS - 18 * u);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
  }
  await Promise.all(['600 120px Switzer', '500 60px Switzer', '500 40px "Geist Mono"'].map((f) => document.fonts.load(f))).catch(() => {});
  // the real die (a 4096 canvas) is drawn after the first frame, when the browser is idle, or at once on open; until then the
  // lid covers a plain dark die, so the chip appears sooner
  const dieTex = new THREE.DataTexture(new Uint8Array([12, 13, 17, 255]), 1, 1); dieTex.colorSpace = THREE.SRGBColorSpace; dieTex.needsUpdate = true;
  let dieReady = false;
  const loadDie = () => { if (dieReady) return; dieReady = true; const t = dieMap(); dieMat.map = dieMat.emissiveMap = t; dieMat.needsUpdate = true; };

  // ---- the chip, as v7
  const chip = new THREE.Group(); scene.add(chip);
  const SUB_T = 0.14;
  const nickel = new THREE.MeshPhysicalMaterial({ color: 0xd8d6d1, metalness: 1, roughness: 0.24, anisotropy: 0.35 });
  const { map: ihsMap, rmap: ihsRough } = ihsMaps();
  const nickelTop = nickel.clone(); Object.assign(nickelTop, { map: ihsMap, roughnessMap: ihsRough, roughness: 1, color: new THREE.Color(0xffffff) });
  chip.add(new THREE.Mesh(new RoundedBoxGeometry(4.5, SUB_T, 4.5, 4, 0.035), new THREE.MeshStandardMaterial({ color: 0x1a1511, roughness: 0.6 })));
  const subTop = new THREE.Mesh(new THREE.PlaneGeometry(4.44, 4.44), new THREE.MeshPhysicalMaterial({ map: substrateMap(), roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.35 }));
  subTop.rotation.x = -Math.PI / 2; subTop.position.y = SUB_T / 2 + 0.0006; chip.add(subTop);
  const capBody = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.065, 0.07), new THREE.MeshStandardMaterial({ color: 0x8a7656, roughness: 0.55, transparent: true }), 120);
  const capEnd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.028, 0.07, 0.074), new THREE.MeshStandardMaterial({ color: 0xd9d9d6, metalness: 1, roughness: 0.25, transparent: true }), 240);
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(); let bi = 0, ei = 0;
    const place = (x, z, rotY) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY); p.set(x, SUB_T / 2 + 0.033, z); m.compose(p, q, s); capBody.setMatrixAt(bi++, m);
      for (const d of [-0.065, 0.065]) { const o = new THREE.Vector3(d, 0, 0).applyQuaternion(q); p.set(x + o.x, SUB_T / 2 + 0.035, z + o.z); m.compose(p, q, s); capEnd.setMatrixAt(ei++, m); } };
    for (let side = 0; side < 4; side++) for (let k = -7; k <= 7; k++) { if (Math.abs(k) === 2 || Math.abs(k) === 5) continue;
      const a = k * 0.2, b = 2.04, r = k % 2 === 0 ? 0 : Math.PI / 2, [x, z] = side === 0 ? [a, b] : side === 1 ? [a, -b] : side === 2 ? [b, a] : [-b, a]; place(x, z, side < 2 ? r : r + Math.PI / 2); }
    capBody.count = bi; capEnd.count = ei;
  }
  chip.add(capBody, capEnd);
  const DIE = 2.0;
  const dieMat = new THREE.MeshPhysicalMaterial({ map: dieTex, emissiveMap: dieTex, emissive: 0xffffff, emissiveIntensity: 0, metalness: 0.5, roughness: 0.3, iridescence: 0.55, iridescenceIOR: 1.45, iridescenceThicknessRange: [120, 560], clearcoat: 0.5, clearcoatRoughness: 0.12 });
  const dieBody = new THREE.Mesh(new THREE.BoxGeometry(DIE, 0.05, DIE), new THREE.MeshStandardMaterial({ color: 0x2a2c33, metalness: 0.6, roughness: 0.4 })); dieBody.position.y = SUB_T / 2 + 0.025;
  const dieTop = new THREE.Mesh(new THREE.PlaneGeometry(DIE, DIE), dieMat); dieTop.rotation.x = -Math.PI / 2; dieTop.position.y = SUB_T / 2 + 0.0505;
  const DIE_Y = dieTop.position.y; chip.add(dieBody, dieTop);
  const ihs = new THREE.Group();
  const flange = new THREE.Mesh(new RoundedBoxGeometry(3.7, 0.07, 3.7, 4, 0.05), nickel); flange.position.y = SUB_T / 2 + 0.035;
  const plateau = new THREE.Mesh(new RoundedBoxGeometry(3.1, 0.2, 3.1, 4, 0.06), nickel); plateau.position.y = SUB_T / 2 + 0.17;
  const lidTop = new THREE.Mesh(new THREE.PlaneGeometry(2.96, 2.96), nickelTop); lidTop.rotation.x = -Math.PI / 2; lidTop.position.y = plateau.position.y + 0.1006;
  ihs.add(flange, plateau, lidTop); chip.add(ihs);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, opacity: 0.5 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.85; scene.add(shadow);


  // ---- the die powers on as a wave from its front edge, behind the leaving lid (v7 WAKE, trimmed); uHot lights one block
  const WAKE = { uWake: { value: -0.16 }, uBand: { value: 1.3 }, uHot: { value: new THREE.Vector4() }, uHotA: { value: 0 } };
  dieMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, WAKE);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
uniform float uWake; uniform float uBand; uniform vec4 uHot; uniform float uHotA;
float inR(vec2 q, vec4 r, float e) { return smoothstep(r.x - e, r.x + e, q.x) * smoothstep(r.z + e, r.z - e, q.x) * smoothstep(r.y - e, r.y + e, q.y) * smoothstep(r.w + e, r.w - e, q.y); }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  { vec2 q = vEmissiveMapUv; float d = q.y;
    float on = smoothstep(d, d + 0.14, uWake), band = exp(-pow((uWake - d - 0.07) / 0.035, 2.0));
    totalEmissiveRadiance *= on * (1.0 + uBand * band);
    totalEmissiveRadiance *= mix(1.0 - 0.45 * uHotA, 1.0 + 0.7 * uHotA, inR(q, uHot, 0.0015)); }`);
  };
  // the lit block: an accent outline + faint fill on the die
  const hotG = new THREE.Group(), hotFill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x8e9ae6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  hotFill.rotation.x = -Math.PI / 2;
  const hotLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([x, z]) => new THREE.Vector3(x, 0, z))), new THREE.LineBasicMaterial({ color: 0xc3caff, transparent: true, opacity: 0, depthWrite: false }));
  hotG.add(hotFill, hotLine); hotG.visible = false; chip.add(hotG);
  const regionAt = (uu, vv) => { const px = uu * TS, py = (1 - vv) * TS; return REG.find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) || null; };
  const center = (r) => [((r.x + r.w / 2) / TS - 0.5) * DIE, ((r.y + r.h / 2) / TS - 0.5) * DIE];

  // ---- camera rig: every parameter chases a target (time-based), so hero, overview and block views blend into each other
  const rig = { R: 16, pitch: 27, yaw: -24, tx: 0, ty: 0, tz: 0, off: 0 }, tgt = { ...rig };
  let W = 1, H = 1, aspect = 1, phone = false, heroR = 16, heroTy = 0.6, panelPx = 0;
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const radiusFor = (size, frac) => size / (frac * 2 * tanH * Math.min(aspect, 1.9));
  const fitR = (w, h, fw, fh) => Math.max(h / (fh * 2 * tanH), w / (fw * 2 * tanH * aspect)); // distance that fits w x h in fw x fh of the view
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight; aspect = W / H; phone = W < 820;
    renderer.setSize(W, H, false); camera.aspect = aspect; camera.updateProjectionMatrix();
    heroR = phone ? radiusFor(4.5, 0.9) : radiusFor(4.5, 0.42);
    heroTy = phone ? -0.05 * heroR / 16 : 0.04 * heroR / 16;
  }
  new ResizeObserver(resize).observe(canvas); resize();

  // ---- input
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, cx: -1, cy: -1, in: false };
  const HOVER = matchMedia("(hover: hover)").matches;
  const area = canvas.parentElement;
  area.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1; ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top; ptr.in = e.target === canvas; }, { passive: true });
  area.addEventListener("pointerleave", () => { ptr.in = false; ptr.x = ptr.y = 0; });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitBox = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 4.5), new THREE.MeshBasicMaterial({ visible: false }));
  hitBox.position.y = 0.15; chip.add(hitBox);
  const cast = (obj) => { if (!ptr.in) return null; camera.updateMatrixWorld(); chip.updateMatrixWorld(); ndc.set((ptr.cx / W) * 2 - 1, -(ptr.cy / H) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObject(obj)[0] || null; };
  let open = false, k = 0, kFrom = 0, kT = -1, opened = false, closing = false; const DUR = rm ? 0.001 : 1.15;
  let overChip = false, hovPtr = null, hovIdx = null, focused = null;
  const emit = () => on.state?.({ open, focused, hot: hovIdx || hovPtr });
  function setOpen(o) { if (o === open) return; if (o) loadDie(); open = o; kFrom = k; kT = performance.now(); if (o) { opened = true; closing = false; } else { focused = null; closing = true; } on.open?.(o); emit(); }
  function focus(id) { focused = id ? REG.find((r) => r.id === id) || null : null; emit(); }
  function pick() {
    overChip = !!cast(hitBox);
    let h = null; if (open && k > 0.6) { const hit = cast(dieTop); if (hit) h = regionAt(hit.uv.x, hit.uv.y); }
    if (h !== hovPtr) { hovPtr = h; emit(); }
    canvas.style.cursor = hovPtr || (!open && overChip) ? "pointer" : "";
  }
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect(); ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top; ptr.in = true; pick(); // hit-test the click itself (on touch the pointer has already "left")
    if (!open) { if (overChip) setOpen(true); return; }
    if (hovPtr) { on.pick?.(hovPtr); return; }
    if (focused) { on.pick?.(null); return; }
    setOpen(false);
  });

  // ---- the frame: renders while the hero is on screen (or the chip is open) and the tab is visible
  let visible = true, raf = 0, last = performance.now(), firstFrame = true, t0 = -1; // t0 = the first frame, so the entrance never starts half-played
  const wake = () => { if (!raf && !document.hidden && (visible || open || closing)) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }, { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", wake);
  const HS = { a: 0, x: 0, z: 0, w: 0.01, h: 0.01 };
  function frame(now) {
    raf = 0; if (document.hidden || !(visible || open || closing)) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; if (t0 < 0) t0 = now; const t = (now - t0) / 1000, ease = (r) => 1 - Math.exp(-r * dt);
    pick();
    k = kT < 0 ? k : lerp(kFrom, open ? 1 : 0, easeIO(clamp((now - kT) / 1000 / DUR, 0, 1)));
    if (closing && k < 0.002 && now - kT > DUR * 1000) { closing = false; on.closed?.(); }
    // until the first open, the lid peeks every 7 s (2.4 s in) so people notice it opens
    const pt = (t - 2.4) % 7, peek = rm || opened ? 0 : 0.085 * Math.sin(Math.PI * seg(pt, 0, 1.2)) ** 2;
    // entrance (11-20: the still image cut to a rotated chip): no turn, the chip only rises the last bit into its pose as the canvas fades in
    const intro = rm ? 1 : 1 - Math.pow(1 - seg(t, 0, 1.2), 4), kk = Math.max(k, peek), ke = easeIO(k);
    // targets: hero (tilts back as you scroll past), overview (whole die fills the screen), or one block
    const sp = open || closing ? 0 : clamp(scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    const view = Math.max(0.1, 1 - panelPx / W); // fraction of the width left beside the details panel
    if (!open) Object.assign(tgt, { R: heroR * (1 + 0.25 * sp), pitch: 27 + 26 * sp, yaw: -24 + 10 * sp, tx: 0, ty: heroTy + 0.5 * sp, tz: 0, off: 0 });
    else if (!focused) Object.assign(tgt, { R: fitR(DIE * 1.06, DIE * 1.06, 0.94 * view, phone ? 0.62 : 0.84), pitch: 76, yaw: -4, tx: 0, ty: DIE_Y, tz: phone ? 0.08 : 0.02, off: panelPx / 2 });
    else { const [cx, cz] = center(focused), bw = (focused.w / TS) * DIE, bh = (focused.h / TS) * DIE;
      Object.assign(tgt, { R: fitR(bw * 1.25, bh * 1.25, 0.86 * view, phone ? 0.5 : 0.78), pitch: 82, yaw: -2, tx: cx, ty: DIE_Y, tz: cz + (phone ? bh * 0.35 : 0), off: panelPx / 2 }); }
    const j = open || closing ? ease(rm ? 60 : 3.2) : 1; // hero follows instantly (its own easing is the scroll)
    for (const key in tgt) rig[key] += (tgt[key] - rig[key]) * j;
    const p = THREE.MathUtils.degToRad(rig.pitch), y = THREE.MathUtils.degToRad(rig.yaw);
    camera.position.set(rig.tx + Math.sin(y) * Math.cos(p) * rig.R, rig.ty + Math.sin(p) * rig.R, rig.tz + Math.cos(y) * Math.cos(p) * rig.R);
    camera.lookAt(rig.tx, rig.ty, rig.tz);
    if (Math.abs(rig.off) > 0.5) camera.setViewOffset(W, H, rig.off, 0, W, H); else camera.clearViewOffset();
    // the chip: lean, float, lift under the cursor; still once open
    const free = rm ? 0 : 1 - ke;
    ptr.sx += (ptr.x - ptr.sx) * ease(3); ptr.sy += (ptr.y - ptr.sy) * ease(3);
    chip.rotation.x = ptr.sy * 0.16 * free; chip.rotation.z = -ptr.sx * 0.14 * free;
    chip.rotation.y = Math.sin(t * 0.22) * 0.05 * free;
    const lift = (chip.userData.l = lerp(chip.userData.l || 0, !open && overChip && !rm ? 1 : 0, ease(8)));
    chip.position.y = Math.sin(t * 0.85) * 0.05 * free - (1 - intro) * 0.55 + 0.12 * lift * free;
    // lid off, caps fade, die powers on behind it
    const capA = 1 - seg(kk, 0.3, 0.65); capBody.visible = capEnd.visible = capA > 0.001; capBody.material.opacity = capEnd.material.opacity = capA;
    ihs.position.y = kk * 1.6 + 0.05 * lift * free; ihs.position.z = -kk * 9; ihs.rotation.x = -kk * 0.8;
    WAKE.uWake.value = lerp(-0.16, 1.22, easeIO(seg(kk, 0.08, 0.95)));
    dieMat.emissiveIntensity = 1.1 * (0.55 + 0.45 * kk);
    shadow.material.opacity = 0.5 * intro * (1 - ke);
    // the lit block: the pointer's, else the index's, else the focused one
    const hot = hovPtr || hovIdx || focused;
    if (hot) { const [hx, hz] = center(hot), tw = (hot.w / TS) * DIE, th = (hot.h / TS) * DIE, jj = HS.a < 0.04 ? 1 : ease(14);
      HS.x += (hx - HS.x) * jj; HS.z += (hz - HS.z) * jj; HS.w += (tw - HS.w) * jj; HS.h += (th - HS.h) * jj; }
    HS.a += ((hot && k > 0.6 ? 1 : 0) - HS.a) * ease(10); if (HS.a < 0.003) HS.a = 0;
    hotG.visible = HS.a > 0; hotG.position.set(HS.x, DIE_Y + 0.0012, HS.z); hotG.scale.set(HS.w, 1, HS.h);
    hotFill.material.opacity = 0.07 * HS.a; hotLine.material.opacity = 0.95 * HS.a;
    WAKE.uHotA.value = HS.a; WAKE.uHot.value.set((HS.x - HS.w / 2) / DIE + 0.5, 0.5 - (HS.z + HS.h / 2) / DIE, (HS.x + HS.w / 2) / DIE + 0.5, 0.5 - (HS.z - HS.h / 2) / DIE);
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; on.live?.(); (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(loadDie, { timeout: 2500 }); }
    if (hovPtr && on.tip) on.tip(hovPtr, ptr.cx, ptr.cy); else on.tip?.(null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    blocks: REG,
    open: () => setOpen(true), close: () => setOpen(false), focus,
    // closed at once, no lid animation: for leaving the explorer straight to a card on the page (the overlay fades instead)
    reset: () => { if (!open && !closing) return; open = false; closing = false; focused = null; k = 0; kT = -1; panelPx = 0; hovPtr = hovIdx = null; on.open?.(false); on.closed?.(); }, get isOpen() { return open; }, get focused() { return focused; },
    hover: (id) => { hovIdx = id ? REG.find((r) => r.id === id) || null : null; },
    panel: (px) => { panelPx = px; },
  };
}
