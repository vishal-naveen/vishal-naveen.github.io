// chip.js: the v7 chip (v7-chip/one.js lines 14-323: renderer, studio light, lid, substrate, caps, die) as a hero-only
// toy. No scroll story: it floats, leans toward the cursor, and a click lifts the lid so the die powers on. With the lid
// off, the die is a map of the five repositories it is drawn from; hovering one names it, clicking jumps to its card.
// The die texture is baked (tools/bakedie.mjs), so the page ships a picture of the code, not the source files.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export async function startChip({ canvas, hero, still, hint, tip, rm, go }) {
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
  const [dieTex, DIEJ] = await Promise.all([new THREE.TextureLoader().loadAsync("media/die.webp"), fetch("media/die.json").then((r) => r.json())]);
  dieTex.colorSpace = THREE.SRGBColorSpace; dieTex.anisotropy = 16;

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
    totalEmissiveRadiance *= mix(1.0 - 0.5 * uHotA, 1.0 + 0.6 * uHotA, inR(q, uHot, 0.0015)); }`);
  };
  // the hovered block: an accent outline + faint fill on the die (v7's map)
  const hotG = new THREE.Group(), hotFill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x8e9ae6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  hotFill.rotation.x = -Math.PI / 2;
  const hotLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([x, z]) => new THREE.Vector3(x, 0, z))), new THREE.LineBasicMaterial({ color: 0xb4bdff, transparent: true, opacity: 0, depthWrite: false }));
  hotG.add(hotFill, hotLine); hotG.position.y = DIE_Y + 0.0012; hotG.visible = false; chip.add(hotG);
  const TS = DIEJ.ts, REG = DIEJ.regions;
  const regionAt = (u, v) => { const px = u * TS, py = (1 - v) * TS; return REG.find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) || null; };

  // ---- camera rig: hero pose, and a closer, higher pose once the lid is off
  const rig = { R: 16, pitch: 27, yaw: -24, ty: 0 };
  let W = 1, H = 1, aspect = 1, phone = false, heroR = 16, openR = 10, heroTy = 0.6;
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const radiusFor = (size, frac) => size / (frac * 2 * tanH * Math.min(aspect, 1.9));
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight; aspect = W / H; phone = W < 820;
    renderer.setSize(W, H, false); camera.aspect = aspect; camera.updateProjectionMatrix();
    heroR = phone ? radiusFor(4.5, 0.9) : radiusFor(4.5, 0.42); openR = phone ? radiusFor(DIE, 0.52) : radiusFor(DIE, 0.24);
    heroTy = phone ? -0.05 * heroR / 16 : 0.04 * heroR / 16;
  }
  new ResizeObserver(resize).observe(canvas); resize();

  // ---- input: pointer lean, hover over the chip, click to open / close, hover a block when open
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, cx: -1, cy: -1, in: false };
  const HOVER = matchMedia("(hover: hover)").matches;
  hero.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1; ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top; ptr.in = true; }, { passive: true });
  hero.addEventListener("pointerleave", () => { ptr.in = false; ptr.x = ptr.y = 0; });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitBox = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 4.5), new THREE.MeshBasicMaterial({ visible: false }));
  hitBox.position.y = 0.15; chip.add(hitBox);
  const cast = (obj) => { if (!ptr.in) return null; camera.updateMatrixWorld(); chip.updateMatrixWorld(); ndc.set((ptr.cx / W) * 2 - 1, -(ptr.cy / H) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObject(obj)[0] || null; };
  let open = false, k = 0, kFrom = 0, kT = -1; const DUR = rm ? 0.001 : 1.25;
  let overChip = false, hot = null, hotSince = 0;
  const setOpen = (o) => { if (o === open) return; open = o; kFrom = k; kT = performance.now(); hero.classList.toggle("chip-open", o);
    hint.textContent = o ? (HOVER ? "Point at a block to see the repository. Click outside the die to close." : "Tap a block to jump to it. Tap outside the die to close.") : (HOVER ? "Click the chip to open it" : "Tap the chip to open it"); };
  hint.textContent = HOVER ? "Click the chip to open it" : "Tap the chip to open it";
  if (!HOVER) tip.querySelector("i").textContent = "Tap to jump to it";
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect(); ptr.cx = e.clientX - r.left; ptr.cy = e.clientY - r.top; ptr.in = true; pick(); // hit-test where the click is (on touch the pointer has already "left")
    if (open && hot) { go(hot.go); return; }
    if (!open && overChip) { setOpen(true); return; }
    if (open) setOpen(false);
  });
  function pick() {
    overChip = !!cast(hitBox);
    let h = null; if (open && k > 0.85) { const hit = cast(dieTop); if (hit) h = regionAt(hit.uv.x, hit.uv.y); }
    if (h !== hot) { hot = h; hotSince = performance.now(); }
    canvas.style.cursor = hot || (!open && overChip) ? "pointer" : open ? "zoom-out" : "";
  }

  // ---- the frame: renders only while the hero is on screen and the tab is visible
  let visible = true, raf = 0, last = performance.now(), firstFrame = true; const t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  const HS = { a: 0, x: 0, z: 0, w: 0.01, h: 0.01 };
  const tipShow = (r) => { if (!r) { tip.classList.remove("on"); return; } tip.querySelector("b").textContent = r.id; tip.querySelector("span").textContent = r.p; tip.classList.add("on"); };
  function frame(now) {
    raf = 0; if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000, ease = (r) => 1 - Math.exp(-r * dt);
    pick();
    // lid progress, time-based; a peek at 2.4 s invites the first click (once, never with reduced motion)
    const kTarget = open ? 1 : 0; k = kT < 0 ? k : lerp(kFrom, kTarget, easeIO(clamp((now - kT) / 1000 / DUR, 0, 1)));
    const peek = rm || open || kT >= 0 ? 0 : 0.09 * Math.sin(Math.PI * seg(t, 2.4, 3.6)) ** 2;
    const intro = rm ? 1 : easeOut(seg(t, 0.05, 1.5));
    const kk = Math.max(k, peek);
    // camera
    rig.R = lerp(heroR, openR, easeIO(k)); rig.pitch = lerp(27, 62, easeIO(k)); rig.yaw = lerp(-24, -8, easeIO(k)) + (1 - intro) * -30; rig.ty = lerp(heroTy, DIE_Y, easeIO(k));
    const p = THREE.MathUtils.degToRad(rig.pitch), y = THREE.MathUtils.degToRad(rig.yaw);
    camera.position.set(Math.sin(y) * Math.cos(p) * rig.R, Math.sin(p) * rig.R + rig.ty, Math.cos(y) * Math.cos(p) * rig.R); camera.lookAt(0, rig.ty, 0);
    // chip: lean toward the pointer, a slow float, a small lift under the cursor; all quieter once open
    const free = rm ? 0 : 1 - 0.75 * k;
    ptr.sx += (ptr.x - ptr.sx) * ease(3); ptr.sy += (ptr.y - ptr.sy) * ease(3);
    chip.rotation.x = ptr.sy * 0.16 * free; chip.rotation.z = -ptr.sx * 0.14 * free;
    chip.rotation.y = Math.sin(t * 0.22) * 0.05 * free + (1 - intro) * 0.5;
    const lift = (chip.userData.l = lerp(chip.userData.l || 0, !open && overChip && !rm ? 1 : 0, ease(8)));
    chip.position.y = Math.sin(t * 0.85) * 0.05 * free - (1 - intro) * 1.4 + 0.12 * lift * (1 - k);
    // lid off, caps fade, die powers on behind it
    const capA = 1 - seg(kk, 0.3, 0.65); capBody.visible = capEnd.visible = capA > 0.001; capBody.material.opacity = capEnd.material.opacity = capA;
    ihs.position.y = kk * 1.4 + 0.05 * lift * (1 - k); ihs.position.z = -kk * 9; ihs.rotation.x = -kk * 0.8;
    WAKE.uWake.value = lerp(-0.16, 1.22, easeIO(seg(kk, 0.08, 0.95)));
    dieMat.emissiveIntensity = 1.05 * (0.6 + 0.4 * kk);
    shadow.material.opacity = 0.5 * intro * (1 - 0.6 * k);
    // the hovered block
    if (hot) { const tx = ((hot.x + hot.w / 2) / TS - 0.5) * DIE, tz = ((hot.y + hot.h / 2) / TS - 0.5) * DIE, tw = (hot.w / TS) * DIE, th = (hot.h / TS) * DIE, j = HS.a < 0.04 ? 1 : ease(14);
      HS.x += (tx - HS.x) * j; HS.z += (tz - HS.z) * j; HS.w += (tw - HS.w) * j; HS.h += (th - HS.h) * j; }
    HS.a += ((hot ? 1 : 0) - HS.a) * ease(10); if (HS.a < 0.003) HS.a = 0;
    hotG.visible = HS.a > 0; hotG.position.set(HS.x, DIE_Y + 0.0012, HS.z); hotG.scale.set(HS.w, 1, HS.h);
    hotFill.material.opacity = 0.08 * HS.a; hotLine.material.opacity = 0.9 * HS.a;
    WAKE.uHotA.value = HS.a; WAKE.uHot.value.set((HS.x - HS.w / 2) / DIE + 0.5, 0.5 - (HS.z + HS.h / 2) / DIE, (HS.x + HS.w / 2) / DIE + 0.5, 0.5 - (HS.z - HS.h / 2) / DIE);
    tipShow(hot); if (hot) tip.style.transform = `translate(${Math.round(ptr.cx + 16)}px,${Math.round(ptr.cy + 14)}px)`;
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; hero.classList.add("chip-live"); still?.setAttribute("aria-hidden", "true"); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { setOpen, get open() { return open; } };
}
