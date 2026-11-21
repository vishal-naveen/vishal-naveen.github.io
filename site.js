// site.js: the effects around the content (v8). Native scroll throughout; nothing here pins, scrubs or delays content.
// One-shot reveals, word-rise headings, the copper experience rail, cursor spotlight, nav underline, videos only in view,
// copy-email toast, Cmd+K. The 3D chip loads last (chip.js) and the still image stays if WebGL or the import fails.
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const RM = document.documentElement.classList.contains("rm");
const HOVER = matchMedia("(hover: hover)").matches;
const go = (sel) => { const el = typeof sel === "string" ? $(sel) : sel; if (!el) return; el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" }); el.classList.add("on"); };

// ---- headings rise word by word
for (const h of $$(".sh h2, .about h2")) {
  const walk = (node) => { for (const n of [...node.childNodes]) {
    if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { f.append(w); return; } const o = document.createElement("span"), i = document.createElement("span"); o.className = "wd"; i.textContent = w; o.append(i); f.append(o); }); n.replaceWith(f); }
    else if (n.nodeType === 1) walk(n); } };
  walk(h); h.querySelectorAll(".wd>span").forEach((w, i) => { w.style.transitionDelay = `${Math.min(i, 14) * 40}ms`; });
}

// ---- one-shot reveals; siblings arriving together stagger slightly
const io = new IntersectionObserver((es) => {
  let n = 0;
  for (const e of es) if (e.isIntersecting) { e.target.style.transitionDelay = `${Math.min(n++, 4) * 70}ms`; e.target.classList.add("on"); io.unobserve(e.target); }
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
$$(".rv").forEach((el) => io.observe(el));

// ---- cursor spotlight on cards (pointer devices)
if (HOVER) {
  $$(".fc, .xc, .contact").forEach((c) => { c.classList.add("spot"); const g = document.createElement("i"); g.className = "glow"; g.setAttribute("aria-hidden", "true"); c.prepend(g); });
  addEventListener("pointermove", (e) => { const c = e.target.closest?.(".spot"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${Math.round(e.clientX - r.left)}px`); c.style.setProperty("--my", `${Math.round(e.clientY - r.top)}px`); }, { passive: true });
}

// ---- the experience rail: copper traces; open roles run up to "now"; draws in once when the list arrives
const NS = "http://www.w3.org/2000/svg", rail = $("#rail");
const mk = (tag, at = {}) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
function buildRail() {
  const rows = $$(".xc"), narrow = innerWidth <= 860, railW = rail.getBoundingClientRect().width || 64, X = (l) => (narrow ? 7 + l * 4 : 10 + l * 11), yOf = (el) => el.offsetTop + 34;
  rail.innerHTML = "";
  const now = rows.filter((r) => r.hasAttribute("data-now")), past = rows.filter((r) => !r.hasAttribute("data-now")), yEnd = yOf(rows[rows.length - 1]);
  const line = (d, c, w = 1.5, cls = "draw ln") => { const p = mk("path", { d, fill: "none", stroke: c, "stroke-width": w, class: cls }); rail.append(p); p.style.setProperty("--len", Math.ceil(p.getTotalLength() + 2)); return p; };
  line(`M${X(0)},0 V${yEnd}`, "rgba(239,231,218,.22)");
  now.forEach((r, i) => { const l = narrow ? 0 : i, y = yOf(r), x = X(l), x0 = X(0); line(l ? `M${x},0 V${y} L${x0},${y + (x - x0)}` : `M${x0},0 V${y}`, "#6670F0");
    if (l || i === 0) rail.append(mk("rect", { x: x - 3.5, y: -3.5, width: 7, height: 7, fill: "#100C09", stroke: "#6670F0", "stroke-width": 1.5, class: "nd" })); });
  rows.forEach((r) => { const isNow = r.hasAttribute("data-now"), li = now.indexOf(r), x = isNow ? X(narrow ? 0 : li) : X(0), y = yOf(r), c = isNow ? "#6670F0" : "#5F574D";
    if (!narrow) { const tr = line(`M${x + 5},${y} H${railW - 3}`, c, 1.25, "draw tr"); r.__trace = tr; rail.append(mk("rect", { x: railW - 3, y: y - 4, width: 3, height: 8, fill: c, class: "nd" })); }
    const s = isNow ? 8 : 7, ring = mk("rect", { x: x - s / 2 - 4, y: y - s / 2 - 4, width: s + 8, height: s + 8, class: "ring" }); rail.append(ring); r.__ring = ring;
    rail.append(mk("rect", { x: x - s / 2, y: y - s / 2, width: s, height: s, fill: isNow ? "#8E9AE6" : "#8E8476", class: "nd" })); });
  if (!narrow) { const t = mk("text", { x: X(0) - 2, y: -12, "font-family": "Geist Mono", "font-size": 11, fill: "#8E9AE6", class: "nd" }); t.textContent = "now"; rail.append(t); }
}
$$(".xc").forEach((x) => { x.addEventListener("pointerenter", () => { x.__ring?.classList.add("on"); x.__trace?.classList.add("on"); }); x.addEventListener("pointerleave", () => { x.__ring?.classList.remove("on"); x.__trace?.classList.remove("on"); }); });
let railQ = 0; const queueRail = () => { cancelAnimationFrame(railQ); railQ = requestAnimationFrame(buildRail); };
new ResizeObserver(queueRail).observe($("#rows")); document.fonts.ready.then(queueRail);
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { rail.classList.add("on"); o.disconnect(); } }, { threshold: 0.05 }).observe($("#rows"));

// ---- nav: an underline that slides to the section you're in
const ind = $("#ind"), navA = Object.fromEntries($$("[data-nav]").map((a) => [a.dataset.nav, a]));
let navOn = "";
const navTo = (k) => { if (k === navOn) return; navOn = k; const a = navA[k]; if (!a || !a.offsetWidth) { ind.style.opacity = 0; return; } ind.style.width = `${a.offsetWidth}px`; ind.style.transform = `translateX(${a.offsetLeft}px)`; ind.style.opacity = 1; };
const secs = ["experience", "work", "about"].map((id) => $(`#${id}`));
const navUpdate = () => { const y = innerHeight * 0.35; let k = ""; for (const s of secs) if (s.getBoundingClientRect().top < y) k = s.id; navTo(k); };
addEventListener("scroll", navUpdate, { passive: true }); addEventListener("resize", () => { navOn = "-"; navUpdate(); }); navUpdate();

// ---- videos play only while on screen (never with reduced motion: they get controls instead)
const vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting && !RM) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.3 });
$$("video[data-inview]").forEach((v) => { if (RM) v.controls = true; vio.observe(v); });

// ---- copy email
const toast = $("#toast"); let toastT = 0;
const copyMail = async () => { try { await navigator.clipboard.writeText("vishalnaveen@ufl.edu"); toast.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("on"), 1800); } catch { location.href = "mailto:vishalnaveen@ufl.edu"; } };
$("#mail").addEventListener("click", copyMail);

// ---- Cmd+K: jump to a project, a role, or an action
const pk = $("#pk"), pkq = $("#pkq"), pkl = $("#pkl");
const ITEMS = [
  ...$$(".xc").map((x) => ["Experience", `${x.querySelector(".org").textContent}, ${x.querySelector("h3").textContent}`, x.querySelector(".date").textContent, () => go(x)]),
  ["Projects", "Sixth Sense", "iOS, Core ML, App Challenge 3rd", () => go("#p-sixth")],
  ["Projects", "TactileVLA-Edge", "Robot learning, LeRobot", () => go("#p-tvla")],
  ["Projects", "Zer0Sh0t", "SwampHacks XII, 3rd of 141", () => go("#p-zero")],
  ["Projects", "Lucid Dreams, Midnight", "More projects", () => go(".morehead")],
  ["Sections", "About", "Education, toolkit", () => go("#about")],
  ["Sections", "Contact", "Email, résumé", () => go("#contact")],
  ["Actions", "Copy email", "vishalnaveen@ufl.edu", copyMail],
  ["Actions", "Open résumé", "PDF", () => { location.href = "media/resume.pdf"; }],
  ["Actions", "Open GitHub", "github.com/vishal-naveen", () => open("https://github.com/vishal-naveen", "_blank", "noopener")],
  ["Actions", "Open LinkedIn", "linkedin.com/in/vishalnaveen", () => open("https://www.linkedin.com/in/vishalnaveen/", "_blank", "noopener")],
];
let pkSel = 0, pkShown = [], pkBack = null;
function pkRender() {
  const q = pkq.value.trim().toLowerCase();
  pkShown = ITEMS.filter((it) => !q || `${it[0]} ${it[1]} ${it[2]}`.toLowerCase().includes(q));
  pkSel = Math.min(pkSel, Math.max(0, pkShown.length - 1)); pkl.innerHTML = ""; let grp = "";
  pkShown.forEach((it, i) => {
    if (it[0] !== grp) { grp = it[0]; const h = document.createElement("div"); h.className = "h mono"; h.textContent = grp; pkl.append(h); }
    const d = document.createElement("div"); d.className = "it" + (i === pkSel ? " sel" : ""); d.setAttribute("role", "option");
    d.innerHTML = "<span></span><em></em>"; d.firstChild.textContent = it[1]; d.lastChild.textContent = it[2];
    d.addEventListener("click", () => pkRun(i)); d.addEventListener("pointermove", () => { if (pkSel !== i) { pkSel = i; pkRender(); } });
    pkl.append(d);
  });
}
const pkOpen = () => { pkBack = document.activeElement; pk.classList.add("on"); pkq.value = ""; pkSel = 0; pkRender(); setTimeout(() => pkq.focus(), 0); };
const pkClose = () => { pk.classList.remove("on"); pkBack?.focus?.(); };
const pkRun = (i) => { const it = pkShown[i]; if (!it) return; pkClose(); it[3](); };
$("#kbtn").addEventListener("click", pkOpen);
pk.addEventListener("click", (e) => { if (e.target === pk) pkClose(); });
pkq.addEventListener("input", () => { pkSel = 0; pkRender(); });
addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pk.classList.contains("on") ? pkClose() : pkOpen(); return; }
  if (!pk.classList.contains("on")) return;
  if (e.key === "Escape") { e.preventDefault(); pkClose(); }
  else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); pkSel = (pkSel + (e.key === "ArrowDown" ? 1 : -1) + pkShown.length) % Math.max(1, pkShown.length); pkRender(); pkl.querySelector(".sel")?.scrollIntoView({ block: "nearest" }); }
  else if (e.key === "Enter") { e.preventDefault(); pkRun(pkSel); }
});

// ---- the chip, last: the still image stays if WebGL is missing or the import fails
const hero = $("#hero"), hint = $("#hint");
const hasGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
if (hasGL) {
  import("./chip.js").then(({ startChip }) => startChip({ canvas: $("#gl"), hero, still: $(".still"), hint, tip: $("#tip"), rm: RM, go }))
    .then((c) => { window.__chip = c; })
    .catch((err) => { console.warn("chip unavailable, keeping the still", err); hint.textContent = ""; });
}
