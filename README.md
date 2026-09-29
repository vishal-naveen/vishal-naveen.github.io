# vishal-naveen.github.io

Personal site of Vishal Naveen, electrical engineering at the University of Florida.

- **Hero:** a real-time three.js render of my SO-101 robot arm, which tracks the cursor with a damped-least-squares IK solver. The URDF and meshes come from [TheRobotStudio/SO-ARM100](https://github.com/TheRobotStudio/SO-ARM100) (Apache-2.0; see `assets/so101/NOTICE.md`).
- **Tech stack:** a procedurally built 3D circuit board, one chip per skill.

Plain HTML, CSS and JavaScript modules. No framework and no build step.

## Run it locally

```sh
python3 -m http.server 5190
# open http://localhost:5190
```

## Where things live

| Path | What it is |
|---|---|
| `js/content.js` | Every fact on the site: projects, roles, awards, numbers. Edit this, not the sections. |
| `js/data/excerpts.js` | Verbatim code excerpts, each pinned to a commit and line range. |
| `js/arm/` | The 3D arm: URDF loader, materials, IK follower, scene. |
| `js/hero/` | Hero layout and the name's subtle cursor warmth. |
| `js/sections/pcb/` | The circuit-board tech stack. |
| `js/sections/work.js` | Projects and the case-study overlay (`#work/<id>` deep links). |
| `js/sections/about/` | Experience, leadership, and contact (with the 7-segment clock). |
| `css/tokens.css` | Colors, type scale, spacing. |
