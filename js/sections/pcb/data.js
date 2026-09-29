// The stack, as parts on a board. One record per skill; the copy is the owner's, verbatim.
// `lines` is how the name is etched on the package (split where a long name would shrink the type).
// `cell` is [column, row] on the 6 x 4 board grid; the MCU owns the four middle cells.

export const GROUPS = {
  languages: { label: 'Languages', pkg: 'QFP' },
  ml: { label: 'Robot learning & ML', pkg: 'QFN and BGA' },
  robotics: { label: 'Robotics & controls', pkg: 'Module' },
  tools: { label: 'Tools', pkg: 'SOIC' },
};

const S = (id, name, group, pkg, cell, blurb, lines, linesP) => ({ id, name, group, pkg, cell, blurb, lines: lines || [name], linesP });

export const SKILLS = [
  S('python', 'Python', 'languages', 'qfp', [0, 0], 'Training loops, eval scripts, and the LDPC study.'),
  S('cpp', 'C++', 'languages', 'qfp', [1, 0], 'What I taught 12 middle schoolers at the VEX camp I co-founded.'),
  S('java', 'Java', 'languages', 'qfp', [0, 1], "Every FTC autonomous I've written, plus Pedro Pathing."),
  S('swift', 'Swift', 'languages', 'qfp', [1, 1], 'Sixth Sense, start to finish.'),
  S('javascript', 'JavaScript', 'languages', 'qfp', [0, 2], 'Three production sites at Inc to Inc, and this one.'),
  S('sql', 'SQL', 'languages', 'qfp', [1, 2], 'Scheduling, payments, and storefronts on a relational schema.'),

  S('pytorch', 'PyTorch', 'ml', 'bga', [4, 0], 'ACT and SmolVLA, trained on one consumer GPU.'),
  S('lerobot', 'LeRobot', 'ml', 'qfn', [5, 0], 'The framework behind TactileVLA-Edge. I sent it a patch.'),
  S('huggingface', 'Hugging Face', 'ml', 'qfn', [4, 1], 'Where SmolVLA-450M came from before I fine-tuned it.', ['Hugging', 'Face']),
  S('sb3', 'stable-baselines3', 'ml', 'bga', [5, 1], 'The DQN that learns which LDPC bits to flip.', ['stable-', 'baselines3']),
  S('opencv', 'OpenCV', 'ml', 'qfn', [4, 2], 'Image plumbing for Sixth Sense.'),
  S('coreml', 'Core ML', 'ml', 'bga', [5, 2], '12.7 MB of YOLOv8n at 15 fps on an iPhone 14 Pro.', ['Core', 'ML']),

  S('imitation', 'Imitation learning', 'robotics', 'module', [2, 0], '160 demonstrations in, a pick-and-place policy out.', ['Imitation', 'learning']),
  S('teleop', 'Teleoperation', 'robotics', 'module', [3, 0], 'A leader-follower SO-101 rig, built for under $300.', ['Tele-', 'operation']),
  S('pid', 'PID control', 'robotics', 'module', [2, 3], "Heading correction for Pedro Pathing's path follower.", ['PID', 'control']),
  S('bezier', 'Bézier path planning', 'robotics', 'module', [3, 3], 'Multi-order curves in a library 2,000+ FTC teams use.', ['Bézier path', 'planning'], ['Bézier', 'path', 'planning']),

  S('git', 'Git', 'tools', 'soic', [0, 3], 'Owned the team codebase for Middleton Robotics.'),
  S('arkit', 'ARKit', 'tools', 'soic', [1, 3], '6-DoF route recording for indoor navigation.'),
  S('node', 'Node.js', 'tools', 'soic', [4, 3], 'Session auth and PayPal flows for nonprofit sites.'),
];

// Reference designators: the MCU is U1, then the chips in list order.
SKILLS.forEach((s, i) => { s.ref = `U${i + 2}`; s.index = i; });

export const PKG_LABEL = { qfp: 'QFP', qfn: 'QFN', bga: 'BGA', module: 'Module', soic: 'SOIC' };
