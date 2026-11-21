// site.js: everything around the content (v8). Native scroll throughout: nothing pins, delays or hijacks it. The motion is
// scroll-linked where it should feel physical (hero exit, the experience rail, media parallax) and one-shot where it
// should feel quick (card reveals, decoding kickers, counting numbers, word-rise headings).
// The 3D chip loads last (chip.js); the still image stays if WebGL or the import fails.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = document.documentElement.classList.contains("rm");
const HOVER = matchMedia("(hover: hover)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const html = document.documentElement;
const go = (sel) => { const el = typeof sel === "string" ? $(sel) : sel; if (!el) return; el.classList.add("on"); el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" }); };

// ---- headings rise word by word
for (const h of $$(".sh h2, .about h2")) {
  const walk = (node) => { for (const n of [...node.childNodes]) {
    if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { f.append(w); return; } const o = document.createElement("span"), i = document.createElement("span"); o.className = "wd"; i.textContent = w; o.append(i); f.append(o); }); n.replaceWith(f); }
    else if (n.nodeType === 1) walk(n); } };
  walk(h); h.querySelectorAll(".wd>span").forEach((w, i) => { w.style.transitionDelay = `${Math.min(i, 14) * 40}ms`; });
}

// ---- mono kickers decode (random glyphs settle left to right, ~450 ms); numbers count up (~900 ms)
const GLY = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>#";
function decode(el) { if (RM || el.__dec || el.children.length) return; el.__dec = 1; // text-only elements, so spans and <br> keep their structure
 const fin = el.textContent, n = fin.length, t0 = performance.now();
  el.setAttribute("aria-label", fin);
  const step = (now) => { const p = (now - t0) / 450; let out = ""; for (let i = 0; i < n; i++) out += fin[i] === " " || p * n * 1.4 > i + n * 0.4 ? fin[i] : GLY[(Math.random() * GLY.length) | 0];
    el.textContent = out; if (p < 1) requestAnimationFrame(step); else { el.textContent = fin; el.removeAttribute("aria-label"); } };
  requestAnimationFrame(step); }
function countUp(b) { if (RM || b.__cnt) return; const m = b.textContent.match(/^([<$]*)([\d,]*\.?\d+)(.*)$/s); if (!m) return; b.__cnt = 1;
  const [, pre, num, post] = m, to = parseFloat(num.replace(/,/g, "")), dec = (num.split(".")[1] || "").length, comma = num.includes(","), t0 = performance.now();
  const fmt = (v) => { const s = v.toFixed(dec); return comma ? Number(s).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s; };
  b.setAttribute("aria-label", b.textContent);
  const step = (now) => { const p = clamp((now - t0) / 900, 0, 1), e = 1 - Math.pow(1 - p, 4); b.textContent = pre + fmt(to * e) + post; if (p < 1) requestAnimationFrame(step); else b.removeAttribute("aria-label"); };
  requestAnimationFrame(step); }

// ---- one-shot reveals; siblings arriving together stagger slightly
const io = new IntersectionObserver((es) => {
  let n = 0;
  for (const e of es) if (e.isIntersecting) { const el = e.target; el.style.transitionDelay = `${Math.min(n++, 4) * 70}ms`; el.classList.add("on"); io.unobserve(el);
    $$(".k.mono, .eb.mono > span", el).forEach(decode);
    setTimeout(() => $$(".nums b, .n b", el).forEach(countUp), 120); }
}, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
$$(".rv").forEach((el) => io.observe(el));

// ---- cursor spotlight on cards (pointer devices)
if (HOVER) {
  $$(".fc, .xc, .contact").forEach((c) => { c.classList.add("spot"); const g = document.createElement("i"); g.className = "glow"; g.setAttribute("aria-hidden", "true"); c.prepend(g); });
  addEventListener("pointermove", (e) => { const c = e.target.closest?.(".spot"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${Math.round(e.clientX - r.left)}px`); c.style.setProperty("--my", `${Math.round(e.clientY - r.top)}px`); }, { passive: true });
}

// ---- the experience rail: copper traces, open roles run up to "now"; your scroll draws it (a signal rides the line)
const NS = "http://www.w3.org/2000/svg", rail = $("#rail"), rows = $("#rows");
const mk = (tag, at = {}) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
let railNodes = [], railSig = null, railH = 1, railX0 = 0;
function buildRail() {
  const xcs = $$(".xc"), narrow = innerWidth <= 860, railW = rail.getBoundingClientRect().width || 64, X = (l) => (narrow ? 7 + l * 4 : 10 + l * 11), yOf = (el) => el.offsetTop + 34;
  rail.innerHTML = ""; railNodes = [];
  const now = xcs.filter((r) => r.hasAttribute("data-now")), past = xcs.filter((r) => !r.hasAttribute("data-now")), yEnd = yOf(xcs[xcs.length - 1]);
  const line = (d, c, w = 1.5, cls = "ln") => { const p = mk("path", { d, fill: "none", stroke: c, "stroke-width": w, class: cls }); rail.append(p); return p; };
  const node = (el, y) => { railNodes.push({ el, y }); rail.append(el); };
  railX0 = X(0); line(`M${X(0)},0 V${yEnd}`, "rgba(239,231,218,.22)");
  now.forEach((r, i) => { const l = narrow ? 0 : i, y = yOf(r), x = X(l), x0 = X(0); line(l ? `M${x},0 V${y} L${x0},${y + (x - x0)}` : `M${x0},0 V${y}`, "#6670F0");
    if (l || i === 0) node(mk("rect", { x: x - 3.5, y: -3.5, width: 7, height: 7, fill: "#100C09", stroke: "#6670F0", "stroke-width": 1.5, class: "nd" }), 0); });
  xcs.forEach((r) => { const isNow = r.hasAttribute("data-now"), li = now.indexOf(r), x = isNow ? X(narrow ? 0 : li) : X(0), y = yOf(r), c = isNow ? "#6670F0" : "#5F574D";
    if (!narrow) { r.__trace = line(`M${x + 5},${y} H${railW - 3}`, c, 1.25, "tr"); node(mk("rect", { x: railW - 3, y: y - 4, width: 3, height: 8, fill: c, class: "nd" }), y); }
    const s = isNow ? 8 : 7, ring = mk("rect", { x: x - s / 2 - 4, y: y - s / 2 - 4, width: s + 8, height: s + 8, class: "ring" }); rail.append(ring); r.__ring = ring;
    node(mk("rect", { x: x - s / 2, y: y - s / 2, width: s, height: s, fill: isNow ? "#8E9AE6" : "#8E8476", class: "nd" }), y); });
  if (!narrow) { const t = mk("text", { x: X(0) - 2, y: -12, "font-family": "Geist Mono", "font-size": 11, fill: "#8E9AE6", class: "nd" }); t.textContent = "now"; node(t, 0); }
  railSig = mk("rect", { x: railX0 - 2.5, y: 0, width: 5, height: 5, class: "sig" }); rail.append(railSig);
  railH = yEnd; drawRail(true);
}
let railD = -1;
function drawRail(force) {
  if (!railSig) return;
  const top = rail.getBoundingClientRect().top, d = RM ? railH + 60 : clamp(Math.round(innerHeight * 0.78 - top), -20, railH + 60);
  if (d === railD && !force) return; railD = d;
  rail.style.clipPath = RM ? "" : `inset(-40px -40px calc(100% - ${Math.max(0, d)}px) -60px)`;
  for (const n of railNodes) n.el.classList.toggle("lit", RM || d >= n.y - 2);
  railSig.setAttribute("y", clamp(d, 0, railH) - 2.5); railSig.style.opacity = d > 4 && d < railH ? 1 : 0;
}
$$(".xc").forEach((x) => { x.addEventListener("pointerenter", () => { x.__ring?.classList.add("on"); x.__trace?.classList.add("on"); }); x.addEventListener("pointerleave", () => { x.__ring?.classList.remove("on"); x.__trace?.classList.remove("on"); }); });
let railQ = 0; const queueRail = () => { cancelAnimationFrame(railQ); railQ = requestAnimationFrame(buildRail); };
new ResizeObserver(queueRail).observe(rows); document.fonts.ready.then(queueRail);

// ---- scroll-linked: the hero lets go of the page (name lifts, copy fades) and media drift against their cards
const hero = $("#hero"), giant = $(".giant"), heroCopy = [$(".intro"), $(".side"), $(".hintw")];
const mps = $$(".fc .mp");
let sq = 0;
function onScroll() {
  sq = 0; const y = scrollY, hH = hero.offsetHeight || 1, sp = clamp(y / hH, 0, 1);
  if (!RM && !html.classList.contains("chip-full")) {
    giant.style.transform = sp ? `translate3d(0,${(-sp * 90).toFixed(1)}px,0)` : ""; giant.style.opacity = sp ? (1 - sp * 0.85).toFixed(3) : "";
    for (const c of heroCopy) { if (!c) continue; c.style.opacity = sp ? (1 - sp * 1.6).toFixed(3) : ""; c.style.transform = sp ? `translate3d(0,${(sp * 30).toFixed(1)}px,0)` : ""; }
    for (const m of mps) { const r = m.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) continue; const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; m.style.setProperty("--py", `${(c * -26).toFixed(1)}px`); }
  }
  drawRail(); navUpdate();
}
addEventListener("scroll", () => { if (!sq) sq = requestAnimationFrame(onScroll); }, { passive: true });
addEventListener("resize", () => { navOn = "-"; if (!sq) sq = requestAnimationFrame(onScroll); });

// ---- nav: an underline that slides to the section you're in
const ind = $("#ind"), navA = Object.fromEntries($$("[data-nav]").map((a) => [a.dataset.nav, a]));
let navOn = "";
const navTo = (k) => { if (k === navOn) return; navOn = k; const a = navA[k]; if (!a || !a.offsetWidth) { ind.style.opacity = 0; return; } ind.style.width = `${a.offsetWidth}px`; ind.style.transform = `translateX(${a.offsetLeft}px)`; ind.style.opacity = 1; };
const secs = ["experience", "work", "about"].map((id) => $(`#${id}`));
function navUpdate() { const y = innerHeight * 0.35; let k = ""; for (const s of secs) if (s.getBoundingClientRect().top < y) k = s.id; navTo(k); }
onScroll();

// ---- videos play only while on screen (never with reduced motion: they get controls instead)
const vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting && !RM) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.3 });
$$("video[data-inview]").forEach((v) => { if (RM) v.controls = true; vio.observe(v); });

// ---- copy email
const toast = $("#toast"); let toastT = 0;
const copyMail = async () => { try { await navigator.clipboard.writeText("vishalnaveen@ufl.edu"); toast.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("on"), 1800); } catch { location.href = "mailto:vishalnaveen@ufl.edu"; } };
$("#mail").addEventListener("click", copyMail);

// ---- Cmd+K: jump to a project, a role, or an action
const pk = $("#pk"), pkq = $("#pkq"), pkl = $("#pkl");
let chip = null;
const ITEMS = [
  ...$$(".xc").map((x) => ["Experience", `${x.querySelector(".org").textContent}, ${x.querySelector("h3").textContent}`, x.querySelector(".date").textContent, () => go(x)]),
  ["Projects", "Sixth Sense", "iOS, Core ML, App Challenge 3rd", () => go("#p-sixth")],
  ["Projects", "TactileVLA-Edge", "Robot learning, LeRobot", () => go("#p-tvla")],
  ["Projects", "Zer0Sh0t", "SwampHacks XII, 3rd of 141", () => go("#p-zero")],
  ["Projects", "Lucid Dreams, Midnight", "More projects", () => go(".morehead")],
  ["Sections", "About", "Education, toolkit", () => go("#about")],
  ["Sections", "Contact", "Email, résumé", () => go("#contact")],
  ["Actions", "Open the chip", "Every role and project on one die", () => openChip()],
  ["Actions", "Copy email", "vishalnaveen@ufl.edu", copyMail],
  ["Actions", "Open résumé", "PDF", () => { location.href = "media/resume.pdf"; }],
  ["Actions", "Open GitHub", "github.com/vishal-naveen", () => open("https://github.com/vishal-naveen", "_blank", "noopener")],
  ["Actions", "Open LinkedIn", "linkedin.com/in/vishalnaveen", () => open("https://www.linkedin.com/in/vishalnaveen/", "_blank", "noopener")],
];
let pkSel = 0, pkShown = [], pkBack = null;
function pkRender() {
  const q = pkq.value.trim().toLowerCase();
  pkShown = ITEMS.filter((it) => !q || `${it[0]} ${it[1]} ${it[2]}`.toLowerCase().includes(q));
  pkSel = Math.min(pkSel, Math.max(0, pkShown.length - 1)); pkl.replaceChildren(); let grp = "";
  pkShown.forEach((it, i) => {
    if (it[0] !== grp) { grp = it[0]; const h = document.createElement("div"); h.className = "h mono"; h.textContent = grp; pkl.append(h); }
    const d = document.createElement("div"), a = document.createElement("span"), b = document.createElement("em"); d.className = "it" + (i === pkSel ? " sel" : ""); d.setAttribute("role", "option");
    a.textContent = it[1]; b.textContent = it[2]; d.append(a, b);
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
  if (pk.classList.contains("on")) {
    if (e.key === "Escape") { e.preventDefault(); pkClose(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); pkSel = (pkSel + (e.key === "ArrowDown" ? 1 : -1) + pkShown.length) % Math.max(1, pkShown.length); pkRender(); pkl.querySelector(".sel")?.scrollIntoView({ block: "nearest" }); }
    else if (e.key === "Enter") { e.preventDefault(); pkRun(pkSel); }
    return;
  }
  if (e.key === "Escape" && chip?.isOpen) { e.preventDefault(); if (chip.focused) pickBlock(null); else chip.close(); }
});

// ---- the chip explorer: opened, the die takes over the screen and every card on the page is a block on it
const xui = $("#xui"), xidx = $("#xidx"), xpanel = $("#xpanel"), xbody = $("#xbody"), tip = $("#tip"), hint = $("#hint");
const CAT_C = { research: "#8E9AE6", experience: "#D6CCBC", project: "#6FC3A8" };
const BLOCKS = $$("[data-title]").map((el) => ({ id: el.id, el, cat: el.dataset.cat, kicker: el.dataset.kicker, title: el.dataset.title, stat: el.dataset.stat, weight: +el.dataset.w }));
const idxBtn = {};
for (const b of BLOCKS) { const btn = document.createElement("button"), i = document.createElement("i"); btn.type = "button"; btn.setAttribute("role", "listitem"); btn.style.setProperty("--c", CAT_C[b.cat]);
  btn.append(i, b.title); btn.addEventListener("click", () => pickBlock(b.id)); btn.addEventListener("pointerenter", () => chip?.hover(b.id)); btn.addEventListener("pointerleave", () => chip?.hover(null));
  btn.addEventListener("focus", () => chip?.hover(b.id)); btn.addEventListener("blur", () => chip?.hover(null)); xidx.append(btn); idxBtn[b.id] = btn; }
let picked = null;
function pickBlock(id) {
  picked = id ? BLOCKS.find((b) => b.id === id) : null;
  for (const k in idxBtn) idxBtn[k].classList.toggle("on", k === id);
  xui.classList.toggle("panel-on", !!picked);
  if (!picked) { xpanel.classList.remove("on"); chip?.panel(0); chip?.focus(null); return; }
  // the panel shows the card itself (cloned), so the die never says something the page doesn't
  const src = picked.el, c = src.matches(".fc") ? src.querySelector(":scope > div:not(.amb):not(.mp)").cloneNode(true) : src.cloneNode(true);
  c.removeAttribute("id"); c.classList.remove("rv", "on", "spot"); c.querySelectorAll("[id], .glow, .amb, .mp").forEach((n) => (n.matches(".glow, .amb, .mp") ? n.remove() : n.removeAttribute("id")));
  c.style.cssText = ""; xbody.replaceChildren(c);
  const wide = innerWidth > 860; xpanel.classList.add("on"); chip?.panel(wide ? xpanel.offsetWidth + 40 : 0); chip?.focus(id); xpanel.scrollTop = 0;
}
$("#xback").addEventListener("click", () => pickBlock(null));
// "Show it on the page" (11-20: closing the lid, then a long scroll, read badly): the explorer fades out in 0.28 s, the chip
// resets behind it, the page jumps straight to the card, and the card lights up once so the eye lands on it
$("#xgo").addEventListener("click", () => {
  const el = picked?.el; if (!el) return;
  html.classList.add("chip-leaving"); // a cover dips to the page colour (no double exposure of the hero behind the die)
  setTimeout(() => {
    chip?.reset(); requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("chip-leaving")));
    el.classList.add("on"); el.style.transitionDelay = "0ms";
    let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; // layout position: the card may still be mid-reveal (transformed)
    scrollTo({ top: y - parseFloat(getComputedStyle(html).scrollPaddingTop || "80"), behavior: "instant" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    $$(".nums b, .n b", el).forEach(countUp); $$(".k.mono, .eb.mono > span", el).forEach(decode);
  }, RM ? 0 : 240);
});
$("#xclose").addEventListener("click", () => chip?.close());
let savedY = 0;
function openChip() { if (!chip) return; if (scrollY > 0) scrollTo({ top: 0, behavior: "instant" }); chip.open(); }
hint.addEventListener("click", openChip);

// ---- the chip, last
const hasGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
if (!hasGL) $(".hintw").style.display = "none";
else import("./chip.js").then(({ startChip }) => startChip({ canvas: $("#gl"), hero, rm: RM, blocks: BLOCKS.map(({ el, ...b }) => b), on: {
  live: () => hero.classList.add("chip-live"),
  open: (o) => { if (o) { savedY = scrollY; html.classList.add("chip-full", "chip-seen"); xui.setAttribute("aria-hidden", "false"); $("#xclose").focus({ preventScroll: true }); }
    else { pickBlock(null); xui.setAttribute("aria-hidden", "true"); tip.classList.remove("on"); } },
  closed: () => { html.classList.remove("chip-full"); hint.focus({ preventScroll: true }); },
  pick: (b) => pickBlock(b ? b.id : null),
  state: ({ hot }) => { for (const k in idxBtn) idxBtn[k].classList.toggle("on", k === (hot?.id || picked?.id)); },
  tip: (b, x, y) => { if (!b || !HOVER) { tip.classList.remove("on"); return; } tip.querySelector("b").textContent = b.title; tip.querySelector("span").textContent = b.stat; tip.classList.add("on"); tip.style.transform = `translate(${Math.round(x + 16)}px,${Math.round(y + 14)}px)`; },
} })).then((c) => { chip = window.__chip = c; })
  .catch((err) => { console.warn("chip unavailable, keeping the still", err); $(".hintw").style.display = "none"; html.classList.remove("gl"); });
