// One quiet mono caption under the arm's base: "SO-101 · live IK" and the live joint angles.
const SHORT = { shoulder_pan: 'pan', shoulder_lift: 'lift', elbow_flex: 'elbow', wrist_flex: 'wrist', wrist_roll: 'roll', gripper: 'grip' };
const DEG = 180 / Math.PI;
const fmt = (rad) => {
  const d = rad * DEG;
  return `${d < 0 ? '\u2212' : '+'}${Math.abs(d).toFixed(1)}`.padStart(6, '\u00a0') + '\u00b0';
};

export function buildHud(root, rig, joints) {
  root.setAttribute('aria-hidden', 'true');   // decorative; it changes many times a second
  root.innerHTML =
    `<span class="cap__title">SO-101 · live IK</span>` +
    `<span class="cap__vals">${joints.map((j) => `<span class="cap__j" data-j="${j}"></span>`).join(' ')}</span>`;
  const els = [...root.querySelectorAll('.cap__j')];
  const last = new Array(els.length).fill('');

  return {
    update(q) {
      els.forEach((el, i) => {
        const text = `${SHORT[joints[i]]} ${fmt(q[i])}`;
        if (text !== last[i]) { last[i] = text; el.textContent = text; }
      });
    },
  };
}
