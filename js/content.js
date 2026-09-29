// Single source of truth for every fact on the site.
// Every claim here is taken from the resume or a verified public repo.
// Sections must render from this file and never invent numbers.

export const content = {
  person: {
    name: 'Vishal Naveen',
    first: 'Vishal',
    last: 'Naveen',
    initials: 'VN',
    role: 'Electrical Engineering @ University of Florida',
    focus: ['Robotics', 'Embedded systems', 'Controls', 'Robot learning'],
    tagline: 'I build robots that learn, from the servo bus up to the policy.',
    statement:
      "I'm an electrical engineering student at the University of Florida who builds robots that learn. " +
      'I train manipulation policies on a sub-$300 arm rig I assembled, tune the path-following and PID code ' +
      'that drives competition robots, and wrote the autonomous code that took my team to its first state title in seven years.',
    location: 'Gainesville, FL',
    hometown: 'Tampa, FL',
    coords: '29.6516° N, 82.3248° W',
    timezone: 'America/New_York',
    email: 'vishalnaveen@ufl.edu',
    status: 'Open to research & internship opportunities',
    links: {
      github: 'https://github.com/vishal-naveen',
      linkedin: 'https://www.linkedin.com/in/vishalnaveen/',
      resume: 'assets/Vishal_Naveen_Resume.pdf',
    },
  },

  education: {
    school: 'University of Florida',
    degree: 'B.S. Electrical Engineering',
    minor: 'Minor in Computer Science',
    grad: 'May 2029',
    location: 'Gainesville, FL',
    honors: ['Honors Program', 'Florida Academic Scholars', 'UF Honors Scholarship'],
  },

  // Headline numbers. `value` is numeric for count-up; `display` is the exact rendered string.
  stats: [
    { id: 'act', value: 18, display: '18/20', label: 'ACT policy success', detail: 'Deformable pick-and-place on a single consumer GPU', source: 'TactileVLA-Edge' },
    { id: 'auto', value: 105, display: '105 pts', label: 'Autonomous routine', detail: 'State record, and tied for the world record at the time', source: 'Middleton Robotics' },
    { id: 'teams', value: 2000, display: '2,000+', label: 'FTC teams', detail: 'Use the Pedro Pathing library I helped build and test', source: 'Pedro Pathing' },
    { id: 'demos', value: 160, display: '160', label: 'Teleop demonstrations', detail: '20 per cell across a 3×3 workspace grid', source: 'TactileVLA-Edge' },
    { id: 'speedup', value: 1100, display: '1,100×', label: 'Evaluation speedup', detail: '103 min → 5.4 s on the RL decoder benchmark', source: 'USF research' },
    { id: 'fps', value: 15, display: '15 fps', label: 'On-device detection', detail: '12.7 MB YOLOv8n Core ML model on iPhone 14 Pro', source: 'Sixth Sense' },
    { id: 'trials', value: 3600, display: '3,600', label: 'Trial parameter sweep', detail: 'Plus 810 open-sourced trial records', source: 'USF research' },
    { id: 'funding', value: 25000, display: '$25K', label: 'Raised for robotics', detail: 'Team funding plus 15 outreach events and workshops', source: 'Middleton Robotics' },
  ],

  projects: [
    {
      id: 'tactilevla',
      title: 'TactileVLA-Edge',
      kicker: 'Independent robotics research',
      period: 'Jun 2026 — Present',
      year: '2026',
      summary: 'Imitation-learning policies for robot manipulation on a sub-$300 SO-101 arm — both generalize to a workspace cell they never saw in training.',
      metric: { display: '18/20', label: 'ACT success · held-out cell solved' },
      stack: ['LeRobot', 'PyTorch', 'ACT', 'SmolVLA', 'Python'],
      bullets: [
        'Trained an ACT policy and fine-tuned SmolVLA (450M) in LeRobot on a single consumer GPU: 18/20 and 16/20 success on deformable-object pick-and-place.',
        'Collected 160 teleoperated demonstrations, 20 per cell across the 8 outer cells of a 3×3 grid, sweeping 19 grasp orientations.',
        'Assembled an SO-101 leader-follower teleoperation rig for under $300 and published the dataset and evaluation protocol.',
        'Demonstrated spatial generalization: both policies solved held-out cell B2, absent from all 160 training episodes.',
        'Submitted a patch to Hugging Face LeRobot (PR #3798) diagnosing a streaming-dataset collate crash on unconverted PIL images: 86 lines across 2 files with a regression test.',
      ],
      media: [
        { type: 'video', src: 'assets/media/act-b2.mp4', poster: 'assets/media/poster-act-b2-grasp.jpg', caption: 'ACT in held-out cell B2', portrait: true },
        { type: 'video', src: 'assets/media/smolvla-b2.mp4', poster: 'assets/media/poster-smolvla-b2-grasp.jpg', caption: 'SmolVLA-450M in held-out cell B2', portrait: true },
        { type: 'video', src: 'assets/media/recording-timelapse.mp4', poster: 'assets/media/poster-timelapse.jpg', caption: 'Recording the 160-demo grid dataset' },
        { type: 'image', src: 'assets/media/grid-session-b2.jpg', caption: 'The 3×3 workspace grid' },
      ],
      links: [
        { label: 'Repository', href: 'https://github.com/vishal-naveen/TactileVLA-Edge' },
        { label: 'Project site', href: 'https://vishal-naveen.github.io/TactileVLA-Edge/' },
        { label: 'LeRobot PR #3798', href: 'https://github.com/huggingface/lerobot/pull/3798' },
      ],
    },
    {
      id: 'decode',
      title: 'Midnight · DECODE',
      kicker: 'FTC 26588 competition code',
      period: '2025 — 2026',
      year: '2025',
      summary: 'Competition robot code for the 2025–26 FTC season: a flywheel shooter with Limelight targeting and six autonomous routines. Innovate Award.',
      metric: { display: '6', label: 'autonomous routines, 0 to 18 artifacts' },
      stack: ['Java', 'Limelight', 'Pedro Pathing', 'FTC SDK'],
      bullets: [
        'Flywheel shooter with Limelight vision targeting.',
        'Six autonomous routines scoring from 0 to 18 artifacts, plus twelve tuning opmodes.',
        'Team won the FTC Innovate Award (1st place, 2026).',
      ],
      media: [],
      links: [
        { label: 'Repository', href: 'https://github.com/vishal-naveen/Midnight_Decode' },
      ],
    },
    {
      id: 'intothedeep',
      title: 'Midnight · Into the Deep',
      kicker: 'FTC 26588 competition code',
      period: '2024 — 2025',
      year: '2024',
      summary: 'Competition robot code for the 2024–25 FTC season: a 105-point, five-specimen autonomous on Pedro Pathing that set the state record and tied the world record at the time.',
      metric: { display: '105', label: 'point autonomous, a state record' },
      stack: ['Java', 'Pedro Pathing', 'FTC SDK'],
      bullets: [
        'Five-specimen autonomous on Pedro Pathing that scored 105 points: the state record, and tied for the world record at the time.',
        '0.8-second intake-to-outtake transfer.',
        'Florida Championship finalist.',
      ],
      media: [],
      links: [
        { label: 'Repository', href: 'https://github.com/vishal-naveen/Midnight_IntoTheDeep' },
      ],
    },
    {
      id: 'ldpc',
      title: 'RL LDPC Decoding',
      kicker: 'Coding theory research · USF',
      period: 'Dec 2024 — Jan 2026',
      year: '2024',
      summary: 'A deep Q-network that decodes LDPC error-correcting codes, the family used in 5G and Wi-Fi, by choosing bit flips. Benchmarked against greedy bit-flipping and BP+LSD across 270 seeded trials.',
      metric: { display: '1,100×', label: 'faster evaluation' },
      stack: ['Python', 'stable-baselines3', 'PyTorch', 'NumPy', 'Coding theory'],
      bullets: [
        'Built a deep Q-network bit-flipping decoder for LDPC codes in stable-baselines3, training the agent to select bit flips from syndrome state and benchmarking it against greedy bit-flipping and BP+LSD baselines across 270 seeded trials.',
        'Traced a 25.9% versus 93.7% syndrome-success gap behind greedy bit-flipping to the parity-check matrix, not the policy.',
        'Reduced evaluation from 103 minutes to 5.4 seconds, a 1,100× speedup, via model caching, feasibility gating, and parallelization.',
        "Open-sourced the study as the project's only pre-college researcher: 810 trial records, a 3,600-trial sweep, and verification scripts.",
      ],
      media: [
        { type: 'image', src: 'assets/media/ldpc-decoder-comparison.png', caption: 'Decoder comparison across seeded trials' },
      ],
      links: [
        { label: 'Repository', href: 'https://github.com/vishal-naveen/rl-ldpc-decoding' },
      ],
    },
    {
      id: 'sixthsense',
      title: 'Sixth Sense',
      kicker: 'Assistive iOS app',
      period: 'Sep 2023 — Jun 2025',
      year: '2023',
      summary: 'An iOS navigation aid for blind and low-vision users: on-device obstacle detection with distance estimated from a single camera, and AR-recorded routes.',
      metric: { display: '15 fps', label: 'YOLOv8n on iPhone 14 Pro' },
      stack: ['Swift', 'Core ML', 'YOLOv8', 'ARKit', 'OpenCV'],
      bullets: [
        'Built an assistive navigation iOS app for blind and low-vision users, running a 12.7 MB YOLOv8n Core ML detector at a sustained 15 fps on iPhone 14 Pro.',
        'Modeled obstacle distance with no depth sensor, applying monocular pinhole geometry to a 21-class reference-size table and Kalman-filtering the mean of width-, height-, and area-derived estimates.',
        'Recorded indoor routes with 6-DoF ARKit tracking and scoped accessibility requirements with the City of Tampa ADA coordinator.',
      ],
      media: [
        { type: 'image', src: 'assets/media/detection-dark.jpg', caption: 'Obstacle detection with distance estimates', portrait: true },
        { type: 'image', src: 'assets/media/detection-indoor.jpg', caption: 'Indoor detection', portrait: true },
        { type: 'image', src: 'assets/media/navigation.jpg', caption: 'Turn-by-turn navigation', portrait: true },
        { type: 'image', src: 'assets/media/mapping.jpg', caption: 'Recording a route with ARKit', portrait: true },
      ],
      links: [
        { label: 'Repository', href: 'https://github.com/vishal-naveen/Sixth-Sense' },
      ],
    },
  ],

  // Reverse-chronological by start date.
  experience: [
    {
      id: 'pedro',
      org: 'Pedro Pathing',
      role: 'Algorithm Developer & Beta Tester',
      context: 'Open-source robotics library',
      period: 'Jun 2025 — Jan 2026',
      location: 'Remote',
      bullets: [
        'Implemented path following over multi-order Bézier curves in Java, tuning velocity profiling and PID heading correction.',
        'Tested pre-release builds of an autonomous navigation library used by 2,000+ FTC teams, documenting pathing regressions.',
      ],
      stack: ['Java', 'Bézier curves', 'PID control'],
    },
    {
      id: 'usf',
      org: 'University of South Florida',
      role: 'Student Researcher',
      context: 'Coding theory & reinforcement learning',
      period: 'Dec 2024 — Jan 2026',
      location: 'Tampa, FL',
      bullets: [
        'Built a deep Q-network bit-flipping decoder for LDPC codes and benchmarked it against greedy bit-flipping and BP+LSD across 270 seeded trials.',
        'Traced a 25.9% versus 93.7% syndrome-success gap to the parity-check matrix, not the policy.',
        'Reduced evaluation from 103 minutes to 5.4 seconds — a 1,100× speedup — via model caching, feasibility gating, and parallelization.',
        "Open-sourced the study as the project's only pre-college researcher.",
      ],
      stack: ['Python', 'stable-baselines3', 'DQN'],
    },
    {
      id: 'inctoinc',
      org: 'Inc to Inc',
      role: 'Software Developer',
      context: 'Production web development',
      period: 'Jun 2023 — Jul 2025',
      location: 'Tampa, FL',
      bullets: [
        'Developed 3 production websites with one other developer for STEAMA and Tampa Youth Basketball Association.',
        'Shipped session authentication, class scheduling, PayPal payment and donation flows, and storefronts on a relational SQL schema.',
      ],
      stack: ['JavaScript', 'SQL', 'Node.js', 'PayPal'],
    },
  ],

  leadership: {
    org: 'Middleton Robotics',
    role: 'FTC Team Captain & Lead Programmer',
    teams: 'Teams 4997 and 26588',
    period: 'Aug 2023 — May 2026',
    location: 'Tampa, FL',
    highlights: [
      { display: '15', label: 'member team led' },
      { display: '1st', label: 'state title in 7 years' },
      { display: '105', label: 'pt auto: state record, tied world record' },
      { display: '$25K', label: 'raised in funding' },
      { display: '15', label: 'outreach events & workshops' },
    ],
    bullets: [
      'Led a 15-member team to its first state title in 7 years and programmed a world-record-tying 105-point autonomous routine.',
      'Raised $25,000 in team funding and organized 15 outreach events and technical workshops.',
      'Owned the team codebase on GitHub and ran build-season sprint planning across the mechanical and software subteams.',
    ],
  },

  awards: [
    { year: '2026', title: 'Innovate Award', place: '1st Place', org: 'FIRST Tech Challenge' },
    { year: '2025', title: 'Inspire Award', place: '2nd Place', org: 'FIRST Tech Challenge' },
    { year: '2025', title: 'State Finalist & Alliance Captain', place: 'Finalist', org: 'FIRST Tech Challenge' },
    { year: '2025', title: 'FRC Rising All-Star Award', place: 'World Championship', org: 'FIRST Robotics Competition' },
    { year: '2024', title: 'Congressional App Challenge', place: '3rd Place', org: 'U.S. House of Representatives' },
  ],

  activities: [
    { title: 'Co-founded a VEX robotics camp', detail: 'Taught C++ to 12 under-resourced middle schoolers, who formed 2 competitive teams.', period: '2024 — 2025' },
    { title: 'Programmer, FRC Team 1369', detail: 'Programmed through a FIRST World Championship season.', period: '2025' },
    { title: "Mayor's Youth Corps", detail: '1 of 40 selected citywide.', period: 'Tampa' },
  ],

  skills: [
    { id: 'robotics', label: 'Robotics & controls', items: ['Imitation learning', 'Teleoperation', 'PID control', 'Bézier path planning', 'Reinforcement learning (DQN)', 'CAD'] },
    { id: 'ml', label: 'Robot learning & ML', items: ['PyTorch', 'LeRobot', 'ACT', 'SmolVLA', 'stable-baselines3', 'Hugging Face', 'OpenCV', 'YOLOv8', 'Core ML', 'NumPy'] },
    { id: 'languages', label: 'Languages', items: ['Python', 'Java', 'C++', 'Swift', 'JavaScript', 'SQL'] },
    { id: 'tools', label: 'Tools', items: ['Git', 'GitHub', 'Linux', 'Jupyter', 'Xcode', 'Android Studio', 'React', 'Node.js', 'REST APIs', 'ARKit'] },
  ],

  // Things that are true right now (fall 2026).
  now: [
    'Freshman in Electrical Engineering at UF, Honors Program',
    "Working on Gator Motorsports' embedded Rust firmware",
    'Extending TactileVLA-Edge on the SO-101 rig',
    'Hacking at Gator Quant Hacks and SwampHacks XII this October',
  ],

  // Keywords for marquees and tickers.
  keywords: ['Robotics', 'Imitation Learning', 'Embedded', 'Control Systems', 'Path Planning', 'Reinforcement Learning', 'Computer Vision', 'PyTorch', 'Coding Theory', 'Open Source'],

  nav: [
    { id: 'about', label: 'About' },
    { id: 'lab', label: 'Featured' },
    { id: 'work', label: 'Work' },
    { id: 'numbers', label: 'Numbers' },
    { id: 'experience', label: 'Experience' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'stack', label: 'Stack' },
    { id: 'contact', label: 'Contact' },
  ],
};
