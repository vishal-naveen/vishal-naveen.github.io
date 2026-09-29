// The WebGL scene: studio lighting, the board, hover physics and the travelling pulse.
// createBoardScene() returns a small controller; the DOM side (pcb.js) never touches three.js.
import * as THREE from 'three';
import { buildLayout } from './layout.js';
import { makeMaterials } from './materials.js';
import { silkTexture, grainTexture, fadeTexture, glowTexture } from './textures.js';
import { buildChip, buildMcu, makeChipTexture, makeMcuTexture } from './chips.js';
import { buildSlab, buildSilk, buildTraces, buildVias, buildPassives, buildUsb } from './board.js';

const LIFT = 3;          // mm a hovered chip springs up
const PRESS = -0.7;        // mm a pressed chip sinks
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));

function studioEnvironment(renderer) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x040302);
  const card = (w, h, pos, rgb, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0] * k, rgb[1] * k, rgb[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  card(170, 110, [-150, 180, 130], [1, 0.94, 0.86], 5.6);   // key softbox, front left
  card(300, 22, [210, 100, -40], [1, 0.96, 0.92], 4.2);     // long strip, right
  card(340, 150, [0, 165, -170], [1, 0.95, 0.9], 2.1);      // big soft card behind: the sheen across the mask
  card(150, 20, [-190, 40, -60], [1, 0.95, 0.9], 2.4);      // thin edge light, left
  card(150, 24, [40, 34, 210], [1, 0.42, 0.14], 0.5);       // a faint ember card, low and forward
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02, 1, 2000);
  pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}

export async function createBoardScene(host, opts) {
  const { reduced = false, onActive = () => {}, onPress = () => {}, onLost = () => {} } = opts;
  const L = buildLayout();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl');
  const dprCap = 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'pcb__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onLost(); });

  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  const env = studioEnvironment(renderer);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(24, 1.4, 20, 1800);

  /* ---- lights ---- */
  const key = new THREE.DirectionalLight(0xfff0e0, 3.1);
  key.position.set(-95, 200, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -125, right: 125, top: 100, bottom: -100, near: 60, far: 520 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.12;
  const rim = new THREE.DirectionalLight(0xffa470, 0.9);
  rim.position.set(120, 90, -170);
  const ledLight = new THREE.PointLight(0xff5a1f, 0, 70, 2);
  scene.add(key, rim, ledLight);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff5a1f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(10, 10, 1); glow.renderOrder = 5;

  /* ---- the board ---- */
  const grain = grainTexture(); grain.anisotropy = aniso;
  const M = makeMaterials(grain, env);
  const rig = new THREE.Group();          // float + pointer tilt
  const yawG = new THREE.Group();         // landscape / portrait
  const board = new THREE.Group();
  rig.add(yawG); yawG.add(board); scene.add(rig); board.add(glow);

  const silkTex = silkTexture(L, { ppm: small ? 9 : 12 }); silkTex.anisotropy = aniso;
  board.add(buildSlab(L, M), buildSilk(L, M, silkTex));
  const traces = buildTraces(L, M);
  traces.items.forEach((t) => board.add(t.mesh));
  board.add(traces.power, buildVias(L, M));
  const passives = buildPassives(L, M);
  board.add(passives.group, buildUsb(L, M));

  let rot = 0;                            // text rotation that keeps chip names upright on screen
  const ppm = small ? 26 : 34;
  const chips = L.chips.map((rec) => {
    const built = buildChip(rec, M, rot, ppm);
    built.tex.anisotropy = aniso;
    board.add(built.group);
    return { rec, ...built };
  });
  const mcu = buildMcu(L.mcu, M, rot, small ? 26 : 34);
  mcu.tex.anisotropy = aniso;
  board.add(mcu.group);

  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hits = chips.map((c, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry((c.rec.hx + 1.4) * 2, 7, (c.rec.hz + 1.4) * 2), hitMat);
    m.position.set(c.rec.x, 3.5, c.rec.z); m.userData.idx = i; board.add(m); return m;
  });

  // Floor: a dark surface a little below the board that catches its shadow and fades into the page.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(330, 250),
    new THREE.MeshStandardMaterial({ color: 0x050404, roughness: 0.8, transparent: true, alphaMap: fadeTexture(), depthWrite: false, envMapIntensity: 0.25 }),
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -20; floor.receiveShadow = true;
  scene.add(floor);

  /* ---- per-chip physical state ---- */
  const st = chips.map((c, i) => ({
    y: 0, vy: 0, target: 0, led: 0, ledT: 0, text: 0,
    pulseT0: -1, dur: 0.4 + c.rec.length * 0.0035, head: -100, litT: 0, u: traces.items[i].u, len: traces.items[i].length,
  }));
  let introT = reduced ? 1 : 0;
  let introOn = reduced;
  let active = -1;
  let hovered = -1;
  let pressed = -1;
  let now = 0;
  const tilt = { x: 0, z: 0, tx: 0, tz: 0 };

  /* ---- orientation, camera fit ---- */
  let portrait = false;
  const corners = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [-1.7, 7]) corners.push(new THREE.Vector3(sx * L.board.w / 2, y, sz * L.board.d / 2));
  const tmp = new THREE.Vector3();
  const setSize = () => {
    const w = host.clientWidth || 640; const h = host.clientHeight || 440;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    return [w, h];
  };
  const fit = () => {
    const el = THREE.MathUtils.degToRad(portrait ? 58 : 54);
    const dir = new THREE.Vector3(0, Math.sin(el), Math.cos(el));
    const yaw = yawG.rotation.y;
    const c = Math.cos(yaw); const s = Math.sin(yaw);
    const limit = portrait ? 0.985 : 0.92;
    let lo = 80; let hi = 1600;
    for (let k = 0; k < 22; k++) {
      const d = (lo + hi) / 2;
      camera.position.copy(dir).multiplyScalar(d); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
      let worst = 0;
      for (const p of corners) {
        tmp.set(p.x * c + p.z * s, p.y, -p.x * s + p.z * c).project(camera);
        worst = Math.max(worst, Math.abs(tmp.x), Math.abs(tmp.y));
      }
      if (worst > limit) lo = d; else hi = d;
    }
    camera.position.copy(dir).multiplyScalar(hi);
    camera.lookAt(0, 0, 0);
  };
  const retext = (newRot) => {
    rot = newRot;
    chips.forEach((c) => {
      const t = makeChipTexture(c.rec, rot, ppm); t.anisotropy = aniso;
      c.mats.forEach((m) => { m.map.dispose(); m.map = t; m.emissiveMap = t; m.needsUpdate = true; });
      c.tex = t;
    });
    const mt = makeMcuTexture(L.mcu, rot, small ? 26 : 34); mt.anisotropy = aniso;
    mcu.mats.forEach((m) => { m.map.dispose(); m.map = mt; m.emissiveMap = mt; m.needsUpdate = true; });
  };
  const applyOrientation = () => {
    const [w, h] = setSize();
    const p = w / h < 0.95;
    if (p !== portrait || yawG.rotation.y === 0) {
      portrait = p;
      yawG.rotation.y = portrait ? Math.PI / 2 + 0.1 : 0.16;
      const wantRot = portrait ? Math.PI / 2 : 0;
      if (wantRot !== rot) retext(wantRot);
    }
    fit();
  };
  applyOrientation();

  /* ---- raycast ---- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointer = { x: 0, y: 0, inside: false, dirty: false, type: 'mouse' };
  const pick = () => {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    return hit ? hit.object.userData.idx : -1;
  };
  const toNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    ndc.set(pointer.x, pointer.y);
  };

  /* ---- selection ---- */
  const startPulse = (i) => {
    const s = st[i];
    if (reduced) { s.head = s.len + 40; s.u.uHead.value = s.head; return; }
    s.pulseT0 = now; s.head = -8;
  };
  const activate = (i) => {
    const s = st[i];
    s.target = LIFT; s.litT = 1; s.ledT = 1; s.text = 1;
    startPulse(i);
    if (reduced) { s.y = LIFT; s.vy = 0; s.led = 1; s.u.uLit.value = 1; }
  };
  const deactivate = (i) => {
    const s = st[i];
    s.target = 0; s.litT = 0; s.ledT = 0; s.text = 0; s.pulseT0 = -1;
    if (s.head > -50) s.head = s.len + 40;
    if (reduced) { s.y = 0; s.vy = 0; s.led = 0; s.u.uLit.value = 0; s.head = -100; s.u.uHead.value = -100; }
  };
  const setActive = (i) => {
    if (i === active) return;
    if (active >= 0) deactivate(active);
    active = i;
    if (i >= 0) activate(i);
    changed = true;
    onActive(i);
  };
  const press = (i) => {
    if (i < 0) return;
    const s = st[i];
    if (!reduced) { s.vy = -30; s.led = 1; }
    startPulse(i); s.litT = 1;
    changed = true;
    onPress(i);
  };

  let changed = true;
  let running = false;
  let raf = 0;
  let last = 0;

  /* ---- frame ---- */
  const update = (dt, t) => {
    now = t;
    if (!reduced) {
      if (introOn && introT < 1) introT = Math.min(1, introT + dt / 1.9);
      const ie = 1 - Math.pow(1 - introT, 3);
      rig.rotation.y = (1 - ie) * 0.42;
      rig.position.y = Math.sin(t * 0.7) * 0.55 - (1 - ie) * 14;
      const k = 1 - Math.exp(-dt * 3.2);
      tilt.x += (tilt.tx - tilt.x) * k; tilt.z += (tilt.tz - tilt.z) * k;
      rig.rotation.x = tilt.x + Math.sin(t * 0.5) * 0.006;
      rig.rotation.z = tilt.z + Math.cos(t * 0.43) * 0.006;
      if (pointer.dirty && pointer.inside) {
        pointer.dirty = false;
        const idx = pick();
        canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
        if (idx !== hovered) { hovered = idx; if (pointer.type !== 'touch') setActive(idx >= 0 ? idx : (kbActive >= 0 ? kbActive : -1)); }
      }
    }
    let anyMoving = false;
    let lightI = -1;
    for (let i = 0; i < st.length; i++) {
      const s = st[i];
      if (!reduced) {
        const target = pressed === i ? PRESS : s.target;
        const a = 240 * (target - s.y) - 15 * s.vy;
        s.vy += a * dt; s.y += s.vy * dt;
        if (Math.abs(s.y - target) < 0.002 && Math.abs(s.vy) < 0.01) { s.y = target; s.vy = 0; } else anyMoving = true;
        chips[i].group.position.y = s.y;
        // Pulse head travels MCU -> chip at a steady pace, easing in and out.
        if (s.pulseT0 >= 0) {
          const p = (t - s.pulseT0) / s.dur;
          s.head = -8 + (s.len + 20) * easeInOut(p);
          if (p >= 1) { s.pulseT0 = -1; s.head = s.len + 40; }
          anyMoving = true;
        }
        s.u.uHead.value = s.head;
        // The LED comes on as the pulse arrives.
        const arrived = s.pulseT0 < 0 || (t - s.pulseT0) / s.dur > 0.72;
        const want = s.ledT && arrived ? 1 : 0;
        s.led += (want - s.led) * (1 - Math.exp(-dt * (want > s.led ? 22 : 7)));
        s.u.uLit.value += (s.litT - s.u.uLit.value) * (1 - Math.exp(-dt * (s.litT ? 10 : 6)));
        if (!s.litT && s.u.uLit.value < 0.01 && s.pulseT0 < 0) { s.u.uLit.value = 0; s.head = -100; s.u.uHead.value = -100; }
        if (Math.abs(s.led - want) > 0.004 || Math.abs(s.u.uLit.value - s.litT) > 0.004) anyMoving = true;
        s.textV = (s.textV || 0) + (s.text - (s.textV || 0)) * (1 - Math.exp(-dt * 10));
      } else {
        chips[i].group.position.y = s.y;
        s.textV = s.text;
      }
      passives.leds[i].mat.emissiveIntensity = s.led * 3.6;
      chips[i].mats[0].emissiveIntensity = (s.textV || 0) * 0.55;
      if (s.led > 0.02 && (lightI < 0 || s.led > st[lightI].led)) lightI = i;
    }
    if (lightI >= 0) {
      const p = passives.leds[lightI].pos;
      ledLight.position.set(p.x, 3.2, p.z); board.localToWorld(ledLight.position);
      ledLight.intensity = 330 * st[lightI].led;
      glow.position.set(p.x, 1.3, p.z); glow.material.opacity = 0.5 * st[lightI].led;
    } else { ledLight.intensity = 0; glow.material.opacity = 0; }
    return anyMoving;
  };

  const frame = (ms) => {
    raf = 0;
    if (!running) return;
    const t = ms / 1000;
    const dt = Math.min(0.05, last ? t - last : 0.016); last = t;
    update(dt, t);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const renderStill = () => {
    if (raf) return;
    update(0.016, now);
    renderer.render(scene, camera);
  };

  /* ---- input ---- */
  let kbActive = -1;
  const onMove = (e) => {
    toNdc(e); pointer.inside = true; pointer.dirty = true; pointer.type = e.pointerType || 'mouse';
    if (e.pointerType === 'touch') return;
    tilt.tz = -pointer.x * 0.05; tilt.tx = -pointer.y * 0.04;
    if (reduced) { // no loop: pick right away
      const idx = pick();
      canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
      if (idx !== hovered) { hovered = idx; setActive(idx >= 0 ? idx : kbActive); renderStill(); }
    }
  };
  const onLeave = () => {
    pointer.inside = false; tilt.tx = 0; tilt.tz = 0; canvas.style.cursor = 'default';
    if (hovered !== -1) { hovered = -1; if (pointer.type !== 'touch') setActive(kbActive); }
    if (reduced) renderStill();
  };
  const onDown = (e) => {
    toNdc(e); pointer.type = e.pointerType || 'mouse';
    const idx = pick();
    if (idx < 0) { if (e.pointerType === 'touch') { setActive(-1); if (reduced) renderStill(); } return; }
    if (e.pointerType === 'touch') { setActive(idx); hovered = idx; }
    pressed = idx; press(idx);
    if (reduced) renderStill();
  };
  const onUp = () => { if (pressed >= 0) { pressed = -1; changed = true; if (reduced) renderStill(); } };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  const ro = new ResizeObserver(() => { applyOrientation(); renderStill(); });
  ro.observe(host);

  const api = {
    canvas,
    setActive(i, fromKeyboard = false) { if (fromKeyboard) kbActive = i; setActive(i); if (!running || reduced) renderStill(); },
    press(i) { press(i); if (!running || reduced) renderStill(); },
    releaseKeyboard() { kbActive = -1; },
    intro() { introOn = true; },
    setRunning(v) {
      if (v === running) return;
      running = v;
      if (v) { last = 0; if (!reduced) raf = raf || requestAnimationFrame(frame); else renderStill(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    resize() { applyOrientation(); renderStill(); },
    debug: { THREE, scene, camera, renderer, M, key, rim, rig, yawG, floor, chips, st },
    get portrait() { return portrait; },
    get running() { return running; },
    screenPos(i) {
      const c = i === -2 ? mcu.group : chips[i].group;
      const p = new THREE.Vector3(c.position.x, 2, c.position.z); board.localToWorld(p); p.project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
    },
    dispose() {
      running = false; if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      renderer.dispose(); canvas.remove();
    },
  };
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); } catch (e) { /* first render compiles instead */ }
  renderStill();
  return api;
}
