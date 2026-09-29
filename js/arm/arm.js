// Damped-least-squares IK over pan / lift / elbow / wrist-flex, warm-started every frame.
// Objective: put the TCP on the target and point the jaw's approach axis along `aim`.
import * as THREE from 'three';
import { JOINTS } from './robot.js';

function solve4(A, b) {
  const M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < 4; i++) {
    let p = i;
    for (let r = i + 1; r < 4; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    const d = M[i][i] || 1e-12;
    for (let r = i + 1; r < 4; r++) {
      const f = M[r][i] / d;
      for (let c = i; c <= 4; c++) M[r][c] -= f * M[i][c];
    }
  }
  const x = [0, 0, 0, 0];
  for (let i = 3; i >= 0; i--) {
    let s = M[i][4];
    for (let c = i + 1; c < 4; c++) s -= M[i][c] * x[c];
    x[i] = s / (M[i][i] || 1e-12);
  }
  return x;
}

export function makeFollower(rig) {
  const { joints, robot, tcp, limits } = rig;
  const lo = JOINTS.slice(0, 4).map((n) => limits[n][0] + 0.08);
  const hi = JOINTS.slice(0, 4).map((n) => limits[n][1] - 0.08);
  const p = new THREE.Vector3(), a = new THREE.Vector3();
  const p2 = new THREE.Vector3(), a2 = new THREE.Vector3();

  function fk(q, outP, outA) {
    for (let i = 0; i < 4; i++) joints[JOINTS[i]].setJointValue(q[i]);
    robot.updateMatrixWorld(true);
    outP.setFromMatrixPosition(tcp.matrixWorld);
    if (outA) outA.set(0, 0, 1).transformDirection(tcp.matrixWorld);
    return outP;
  }

  /** A few DLS iterations from q toward the target. Returns { q, err } (err in metres). */
  function step(q0, target, aim, { w = 0.22, iters = 6, lambda = 0.035 } = {}) {
    const q = q0.slice(0, 4);
    const h = 1e-3;
    for (let it = 0; it < iters; it++) {
      fk(q, p, a);
      const e = [target.x - p.x, target.y - p.y, target.z - p.z, w * (aim.x - a.x), w * (aim.y - a.y), w * (aim.z - a.z)];
      const J = [[], [], [], [], [], []];
      for (let k = 0; k < 4; k++) {
        const qk = q.slice();
        qk[k] += h;
        fk(qk, p2, a2);
        J[0][k] = (p2.x - p.x) / h; J[1][k] = (p2.y - p.y) / h; J[2][k] = (p2.z - p.z) / h;
        J[3][k] = (w * (a2.x - a.x)) / h; J[4][k] = (w * (a2.y - a.y)) / h; J[5][k] = (w * (a2.z - a.z)) / h;
      }
      const A = [[], [], [], []];
      const b = [0, 0, 0, 0];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          let s = 0;
          for (let k = 0; k < 6; k++) s += J[k][r] * J[k][c];
          A[r][c] = s + (r === c ? lambda * lambda : 0);
        }
        for (let k = 0; k < 6; k++) b[r] += J[k][r] * e[k];
      }
      const dq = solve4(A, b);
      for (let k = 0; k < 4; k++) q[k] = THREE.MathUtils.clamp(q[k] + THREE.MathUtils.clamp(dq[k], -0.12, 0.12), lo[k], hi[k]);
    }
    const err = fk(q, p).distanceTo(target);
    return { q, err };
  }

  return { step, fk };
}
