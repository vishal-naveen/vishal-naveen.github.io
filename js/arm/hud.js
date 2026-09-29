// One quiet mono caption under the arm's base: "SO-101 · live IK" and the live joint angles.
const SHORT = { shoulder_pan: 'pan', shoulder_lift: 'lift', elbow_flex: 'elbow', wrist_flex: 'wrist', wrist_roll: 'roll', gripper: 'grip' };
const DEG = 180 / Math.PI;
const fmt = (rad) => {
  const d = rad * DEG;
  return `${d < 0 ? '\u2212' : '+'}${Math.abs(d).toFixed(1)}`.padStart(6, '\u00a0') + '\u00b0';
};

export function buildHud(root, rig, joints) {
  root.setAttribute('aria-hidden', 'true');   // decorative; it changes many times a second
  const touch = matchMedia('(hover: none)').matches;
  root.innerHTML =
    `<span class="cap__hint"><i></i>${touch ? 'Tap anywhere and the arm follows' : 'Move your cursor and the arm follows'}</span>` +
    `<span class="cap__title">SO-101 · live IK</span>` +
    `<span class="cap__vals">${joints.map((j) => `<span class="cap__j" data-j="${j}"></span>`).join(' ')}</span>`;
  const els = [...root.querySelectorAll('.cap__j')];
  // The hint bows out once they've tried it.
  const hero = root.closest('.hero');
  if (hero) {
    const used = () => setTimeout(() => root.classList.add('is-used'), 1800);
    hero.addEventListener('pointerdown', used, { once: true, passive: true });
    if (!touch) hero.addEventListener('pointermove', used, { once: true, passive: true });
  }
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
