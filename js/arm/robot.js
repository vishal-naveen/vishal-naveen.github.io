// Loads the SO-101 URDF + STL meshes (TheRobotStudio/SO-ARM100, Apache-2.0; see assets/so101/NOTICE.md)
// and dresses it for the hero: a clean pearl shell (nearly white, soft clearcoat) and gloss-black servos.
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildURDF } from './urdf.js';

export const JOINTS = ['shoulder_pan', 'shoulder_lift', 'elbow_flex', 'wrist_flex', 'wrist_roll', 'gripper'];
const URDF_URL = new URL('../../assets/so101/so101_new_calib.urdf', import.meta.url).href;

function materials() {
  const shell = new THREE.MeshPhysicalMaterial({
    color: 0xfbf9f6,
    roughness: 0.36,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.22,
    sheen: 0.12,
    sheenColor: new THREE.Color(0xfff2e6),
    sheenRoughness: 0.6,
  });
  const servo = new THREE.MeshPhysicalMaterial({
    color: 0x0b0a09,
    roughness: 0.3,
    metalness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
  });
  return { shell, servo };
}

export async function loadRobot(onProgress = () => {}) {
  const mats = materials();
  const stl = new STLLoader();
  const cache = new Map();
  const pending = [];
  let done = 0, total = 0;

  const xml = await (await fetch(URDF_URL)).text();
  const base = URDF_URL.slice(0, URDF_URL.lastIndexOf('/') + 1);
  const robot = buildURDF(xml, (file, attach) => {
    const url = base + file;
    let p = cache.get(url);
    if (!p) {
      total += 1;
      p = fetch(url)
        .then((r) => { if (!r.ok) throw new Error(`${url} ${r.status}`); return r.arrayBuffer(); })
        .then((buf) => {
          const raw = stl.parse(buf);
          raw.deleteAttribute('normal');
          const geo = toCreasedNormals(raw, THREE.MathUtils.degToRad(30));
          done += 1;
          onProgress(done / total);
          return geo;
        });
      cache.set(url, p);
    }
    pending.push(p.then((geo) => {
      const mesh = new THREE.Mesh(geo, file.includes('sts3215') ? mats.servo : mats.shell);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      attach(mesh);
    }));
  });
  await Promise.all(pending);

  const root = new THREE.Group();
  robot.rotation.x = -Math.PI / 2; // URDF is Z-up; the scene is Y-up
  root.add(robot);

  const joints = Object.fromEntries(JOINTS.map((n) => [n, robot.joints[n]]));
  const limits = Object.fromEntries(JOINTS.map((n) => [n, [joints[n].limit.lower, joints[n].limit.upper]]));
  return { root, robot, joints, limits, tcp: robot.links.gripper_frame_link, mats };
}

export const setQ = (rig, q) => JOINTS.forEach((n, i) => rig.joints[n].setJointValue(q[i]));
export const getQ = (rig) => JOINTS.map((n) => rig.joints[n].angle);
