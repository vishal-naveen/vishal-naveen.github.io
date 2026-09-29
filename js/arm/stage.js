// Hero arm: Vishal's SO-101 in clean studio light. A pearl shell that reads nearly white, one soft warm rim from
// behind, and a quiet shadow on a barely-there floor. The tip follows the cursor with live IK (else a slow
// figure-eight) and publishes its screen position to ctx.hero.tcp so the name can warm where it passes.
//
// The canvas covers the whole hero; `.hero__stage` is the slot the arm stands in. A camera view offset moves the
// arm into that slot, so the same code lays out the desktop (right side) and the mobile (band under the name).
import * as THREE from 'three';
import { loadRobot, setQ, JOINTS } from './robot.js';
import { makeFollower } from './arm.js';
import { trackPointer } from '../hero/pointer.js';
import { buildHud } from './hud.js';

const UP = new THREE.Vector3(0, 1, 0);
const damp = (from, to, rate, dt) => from + (to - from) * (1 - Math.exp(-rate * dt));
const clamp = THREE.MathUtils.clamp;
const REACH = { min: 0.15, max: 0.29, floor: 0.05, plane: 0.1 };
const FOV = 26;
const ARM_H = 0.42;   // metres the arm needs on screen at its tallest

/** A small neutral studio for reflections: a key softbox, a fill strip, an overhead wash and one warm strip behind. */
function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x070707, side: THREE.BackSide })));
  const panel = (w, h, color, gain, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(gain), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(5, 3.4, 0xffffff, 7, 3.2, 4.2, 2.6);      // key softbox, front / screen-left / above
  panel(2.4, 6, 0xffffff, 2.4, -4.2, 1.6, 3.2);   // fill strip
  panel(6, 6, 0xffffff, 1.5, 0, 6, 0);            // overhead wash
  panel(1.2, 7, 0xffb890, 1.6, 3.8, 1.4, -3.4);   // the one warm rim, behind
  panel(8, 8, 0x2a2a2a, 0.8, 0, -5, 0);           // neutral floor bounce
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  return tex;
}

/** A barely-there pool of light on the floor so the arm's shadow has something to fall on. */
function makeFloorPool() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vP;
      void main(){
        float r = length(vP);
        float a = exp(-pow(r / 0.3, 2.0) * 1.5) * 0.09 + exp(-pow(r / 0.62, 2.0) * 1.6) * 0.025;
        gl_FragColor = vec4(vec3(0.92, 0.91, 0.9), a);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1.2, 96), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.0008;
  mesh.renderOrder = 1;
  return mesh;
}

export async function mount(ctx) {
  const section = document.getElementById('top');
  const canvas = section && section.querySelector('.hero__arm');
  const stage = section && section.querySelector('.hero__stage');
  const hudRoot = document.getElementById('hero-hud');
  if (!section || !canvas || !stage) return;

  let renderer;
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('no WebGL');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    section.classList.add('arm-failed');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 20);

  // ── lights: a soft white key, a gentle fill, and a single warm rim from behind ──
  const key = new THREE.DirectionalLight(0xfffaf4, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -0.5;
  key.shadow.camera.right = key.shadow.camera.top = 0.5;
  key.shadow.camera.near = 0.1; key.shadow.camera.far = 4;
  key.shadow.radius = 7; key.shadow.bias = -0.0004;
  const rim = new THREE.SpotLight(0xffc9a0, 2.6, 4, 0.8, 1, 1.4);
  const fill = new THREE.HemisphereLight(0xffffff, 0x0c0c0c, 0.35);
  scene.add(key, key.target, rim, rim.target, fill);

  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.7 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.receiveShadow = true;
  catcher.renderOrder = 2;
  scene.add(makeFloorPool(), catcher);

  // ── load the arm ──
  const rig = await loadRobot();
  scene.add(rig.root);
  setQ(rig, [0, 0, 0, 0, 0, 0]);
  rig.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rig.root);
  const panOrigin = new THREE.Vector3().setFromMatrixPosition(rig.joints.shoulder_pan.matrixWorld);
  rig.root.position.set(-panOrigin.x, -box.min.y, -panOrigin.z);
  rig.root.updateMatrixWorld(true);

  const follower = makeFollower(rig);
  const shoulder = new THREE.Vector3().setFromMatrixPosition(rig.joints.shoulder_lift.matrixWorld);
  const forward = new THREE.Vector3(1, 0, 0);
  const side = new THREE.Vector3().crossVectors(UP, forward).normalize();
  const HOME = [0, -1.0716, 0.3518, 1.4936, 0, 0.35];
  const homeAim = new THREE.Vector3();
  follower.fk(HOME, new THREE.Vector3(), homeAim);

  // ── camera / size: the arm stands in .hero__stage ──
  const look = new THREE.Vector3(0, 0.17, 0);
  const size = { w: 1, h: 1 };
  const slot = { cx: 0, cy: 0, w: 1, h: 1 };
  const proj = new THREE.Vector3();
  function frame() {
    const w = section.clientWidth, h = section.clientHeight;
    size.w = w; size.h = h;
    renderer.setSize(w, h, false);
    const hr = section.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    slot.w = Math.max(80, sr.width); slot.h = Math.max(80, sr.height);
    slot.cx = sr.left - hr.left + slot.w / 2;
    slot.cy = sr.top - hr.top + slot.h / 2;

    // Size the arm to the slot, then push it into place with a view offset.
    const pxPerM = Math.min(slot.h * 0.7, slot.w * 0.9) / ARM_H;
    const dist = h / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * pxPerM);
    const narrow = slot.w < 560;
    const yaw = narrow ? 0.62 : 0.22;
    const dir = forward.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(side, Math.sin(yaw));
    camera.aspect = w / h;
    camera.position.copy(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, dist * 0.17, 0));
    camera.lookAt(look);
    const wantX = slot.cx, wantY = slot.cy + slot.h * 0.02;
    camera.setViewOffset(w, h, w / 2 - wantX, h / 2 - wantY, w, h);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const back = forward.clone().negate();
    key.position.copy(camera.position).add(new THREE.Vector3(0, 0.9, 0)).addScaledVector(side, -0.6);
    rim.position.copy(back).multiplyScalar(0.7).addScaledVector(side, 0.5).add(new THREE.Vector3(0, 0.5, 0));
    rim.target.position.set(0, 0.18, 0);

    // where the arm's base lands, for the caption (relative to the stage box)
    proj.set(0, 0, 0).project(camera);
    stage.style.setProperty('--base-x', `${((proj.x * 0.5 + 0.5) * w - (sr.left - hr.left)).toFixed(1)}px`);
    stage.style.setProperty('--base-y', `${((1 - (proj.y * 0.5 + 0.5)) * h - (sr.top - hr.top)).toFixed(1)}px`);
  }
  frame();
  let resizeTimer = 0;
  new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { frame(); if (still) renderStill(); }, 60); }).observe(section);

  // ── targets: the cursor's ray meets a vertical plane just in front of the shoulder ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const camFwd = new THREE.Vector3();
  const planePt = new THREE.Vector3();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const hitDir = new THREE.Vector3();
  function targetFromScreen(sx, sy, out) {
    sy = Math.max(sy, 96);                                // stay clear of the nav
    ndc.set((sx / size.w) * 2 - 1, -(sy / size.h) * 2 + 1);
    camera.getWorldDirection(camFwd);
    camFwd.y = 0; camFwd.normalize().negate();            // now points from the arm toward the camera
    planePt.copy(shoulder).addScaledVector(camFwd, REACH.plane);
    plane.setFromNormalAndCoplanarPoint(camFwd, planePt);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return out;
    hitDir.copy(hit).sub(shoulder);
    const len = clamp(hitDir.length(), REACH.min, REACH.max);
    out.copy(shoulder).addScaledVector(hitDir.normalize(), len);
    out.y = Math.max(out.y, REACH.floor);
    return out;
  }
  const aim = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  function aimAt(t) {
    const fromShoulder = tmp.copy(t).sub(shoulder).normalize();
    aim.copy(homeAim).multiplyScalar(0.55).addScaledVector(fromShoulder, 0.45);
    tmp.copy(camera.position).sub(t).normalize();
    return aim.addScaledVector(tmp, 0.22).normalize();
  }

  const goalTarget = new THREE.Vector3();
  const target = new THREE.Vector3();
  // Idle: a slow, small figure-eight reaching a little toward the text. The resting aim is also the still pose.
  const idleAt = (t, out) => targetFromScreen(slot.cx - slot.w * 0.22 + slot.w * 0.1 * Math.sin(t * 0.45), slot.cy - slot.h * 0.08 + slot.h * 0.05 * Math.sin(t * 0.9), out);
  targetFromScreen(slot.cx - slot.w * 0.24, slot.cy - slot.h * 0.06, goalTarget);
  target.copy(goalTarget);

  // ── poses: fold → ready ──
  const REST = [0, -1.6, 1.55, 1.2, 0, 0.1];
  let goal = follower.step(HOME.slice(0, 4), target, aimAt(target), { iters: 60 }).q;
  const q = ctx.reduced ? [...goal, 0, 0.5] : REST.slice();
  setQ(rig, q);
  rig.root.updateMatrixWorld(true);

  const pointer = trackPointer(ctx, section);
  const hud = hudRoot ? buildHud(hudRoot, rig, JOINTS) : null;
  const tcpWorld = new THREE.Vector3();
  const tcpOut = ctx.hero.tcp;

  function publishTcp(visible) {
    tcpWorld.setFromMatrixPosition(rig.tcp.matrixWorld);
    proj.copy(tcpWorld).project(camera);
    tcpOut.x = (proj.x * 0.5 + 0.5) * size.w;
    tcpOut.y = (1 - (proj.y * 0.5 + 0.5)) * size.h;
    tcpOut.visible = visible && proj.z < 1;
  }

  // ── static frame (reduced motion) ──
  let still = !!ctx.reduced;
  function renderStill() {
    publishTcp(true);
    renderer.render(scene, camera);
    if (hud) hud.update(q);
  }

  // ── loop ──
  let raf = 0, last = 0, t0 = 0, visible = true, frameN = 0, grip = 0.1, ready = false;

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;

    // target: the cursor while it is over the hero, else a slow figure-eight
    const pr = pointer.rel(section.getBoundingClientRect());
    if (pr) targetFromScreen(pr.x, pr.y, goalTarget); else idleAt(t, goalTarget);
    for (const k of ['x', 'y', 'z']) target[k] = damp(target[k], goalTarget[k], 7, dt);
    const res = follower.step(goal, target, aimAt(target), { w: 0.09, iters: 8 });
    goal = res.q;

    const gripGoal = pr ? 0.55 : 0.5 + Math.sin(t * 1.1) * 0.12;
    grip = damp(grip, gripGoal, 8, dt);

    // the first second and a half unfolds gently from the rest pose; after that the arm tracks quickly
    const k = t < 1.5 ? 2.6 : 8;
    for (let i = 0; i < 4; i++) q[i] = damp(q[i], goal[i], k, dt);
    q[4] = damp(q[4], Math.sin(t * 0.6) * 0.2, 3, dt);
    q[5] = grip;
    setQ(rig, q);
    rig.root.updateMatrixWorld(true);

    publishTcp(t > 0.4);
    if (frameN++ % 4 === 0 && hud) hud.update(q);
    renderer.render(scene, camera);
    if (t > 1.6 && !ready) { ready = true; section.classList.add('arm-ready'); }
  }

  const start = () => { if (!raf && visible && !document.hidden && !still) { last = 0; raf = requestAnimationFrame(tick); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else { stop(); tcpOut.visible = false; } }, { threshold: 0 }).observe(section);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  section.classList.add('arm-loaded');
  if (ctx.reduced) {
    renderStill();
    section.classList.add('arm-ready');
    return;
  }
  renderer.render(scene, camera);
  start();
}
