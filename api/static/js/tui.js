// tui.js - a full-screen text UI (TUI) version of the portfolio, drawn on a character grid.
// Keys: arrows / j k to move, Enter or → to open a section, Tab to cycle links, q to quit, ? for help.

import { PERSON, EDUCATION, GRADES, EXPERIENCE, SKILLS, PROJECTS, SITE } from "./portfolio-data.js";

// ---- styles: { fg, bg, b (bold), u (underline) } -------------------------------------------
const S = {
    text: { fg: "text" }, dim: { fg: "dim" }, bold: { fg: "white", b: 1 },
    title: { fg: "purple", b: 1 }, h2: { fg: "cyan", b: 1 }, key: { fg: "green" },
    link: { fg: "cyan", u: 1 }, warn: { fg: "orange" }, ok: { fg: "green" }, bad: { fg: "red" }, tag: { fg: "pink" },
    bar: { fg: "white", bg: "bar" }, barDim: { fg: "dim", bg: "bar" }, barKey: { fg: "green", bg: "bar", b: 1 }, barTitle: { fg: "purple", bg: "bar", b: 1 },
    sel: { fg: "white", bg: "sel", b: 1 }, selDim: { fg: "cyan", b: 1 },
    linkSel: { fg: "black", bg: "cyan", b: 1 },
};
const GRADE_STYLE = (g) => (g === "Distinction" ? S.ok : g === "Merit" ? { fg: "cyan" } : g === "Pass" ? S.warn : S.dim);
const styleKey = (s) => `${s.fg || "text"}|${s.bg || ""}|${s.b ? 1 : 0}|${s.u ? 1 : 0}`;
const styleClass = (s) => `f-${s.fg || "text"}${s.bg ? ` b-${s.bg}` : ""}${s.b ? " tb" : ""}${s.u ? " tu" : ""}`;
const esc = (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c);

// ---- content builders -------------------------------------------------------------------------
let linkId = 0;
const t = (text, s = S.text) => ({ t: text, s });
const lnk = (text, url) => ({ t: text, s: S.link, link: { url, id: ++linkId } });
const P = (segs, o = {}) => ({ segs: Array.isArray(segs) ? segs : [t(segs)], ...o });
const blank = () => ({ blank: true });
const rule = () => ({ rule: true });
const bullet = (text, indent = 1) => P(text, { indent, first: "• ", firstStyle: S.dim });
const h1 = (text) => P([t(text, S.title)]);
const h2 = (text) => P([t(text, S.h2)]);
const kv = (k, v) => P([t(k.padEnd(10), S.dim), ...(Array.isArray(v) ? v : [t(v)])], { indent: 0, first: "", hang: 10 });
const dots = (level) => (level === "Daily use" ? "●●●" : level === "Regular use" ? "●●○" : "●○○");

const SECTIONS = [
    {
        name: "Home", icon: "◆", build: () => [
            h1(PERSON.name), P([t(PERSON.headline, S.dim)]), rule(), blank(),
            P(PERSON.summary), blank(),
            P([t("Looking for  ", S.warn), t(PERSON.looking)]), blank(),
            kv("Location", PERSON.location),
            kv("Email", [lnk(PERSON.email, `mailto:${PERSON.email}`)]),
            kv("GitHub", [lnk(PERSON.github.replace("https://", ""), PERSON.github)]),
            kv("LinkedIn", [lnk("linkedin.com/in/kurtishopewell", PERSON.linkedin)]),
            kv("Website", [lnk(SITE.replace("https://", ""), SITE)]), blank(),
            h2("Outside of work"), P(PERSON.outside), blank(),
            P([t("Use ", S.dim), t("↑ ↓", S.key), t(" to browse the sections, ", S.dim), t("Enter", S.key), t(" to read one.", S.dim)]),
        ],
    },
    {
        name: "Education", icon: "▣", build: () => [
            h1("Education"), rule(), blank(),
            ...EDUCATION.flatMap((e) => [
                P([t(e.school, S.bold), ...(e.years ? [t(`  ${e.years}`, S.dim)] : [])]),
                P(e.title, { indent: 2 }),
                ...(e.result ? [P([t(e.result, S.ok)], { indent: 2 })] : []),
                ...(e.note ? [P([t(e.note, S.dim)], { indent: 2 })] : []),
                blank(),
            ]),
            P([t("Open ", S.dim), t("Grades", S.key), t(" for unit-by-unit results.", S.dim)]),
        ],
    },
    {
        name: "Grades", icon: "★", build: () => [
            h1("Grades"), P([t(GRADES.qualification, S.dim)]), rule(),
            P([t("Overall  ", S.dim), t(GRADES.overall, S.ok)]),
            P([t(`Last updated ${GRADES.updated}.`, S.dim)]), blank(),
            ...GRADES.years.flatMap((y) => [
                h2(`${y.year}${y.status === "Predicted" ? "  (grades are predicted)" : ""}`), blank(),
                ...y.units.flatMap((u) => [
                    P([t(u.grade.padEnd(13), GRADE_STYLE(u.grade)), t(u.name, S.bold), t(`  ${u.kind.toLowerCase()}`, S.dim)], { hang: 13 }),
                    P([t(u.blurb, S.dim)], { indent: 13 }),
                    ...u.parts.map(([n, g]) => P([t(`${g.padEnd(13)}`, GRADE_STYLE(g)), t(n, S.dim)], { indent: 2, hang: 15 })),
                    blank(),
                ]),
            ]),
            h2("GCSEs"), P(GRADES.gcse), blank(),
            P([lnk("View grades on the website", `${SITE}/grades`)]),
        ],
    },
    {
        name: "Experience", icon: "▤", build: () => [
            h1("Experience"), rule(), blank(),
            ...EXPERIENCE.flatMap((x) => [
                P([t(x.role, S.bold)]),
                P([t(`${x.org} · ${x.when}`, S.dim)]),
                ...x.points.map((p) => bullet(p, 2)),
                blank(),
            ]),
        ],
    },
    {
        name: "Skills", icon: "✦", build: () => [
            h1("Skills"), rule(), blank(),
            ...SKILLS.flatMap((s) => [
                P([t(s.name.padEnd(26), S.bold), t(dots(s.level) + " ", S.key), t(s.level, S.dim)]),
                P([t(s.note, S.dim)], { indent: 2 }),
                blank(),
            ]),
            P([t("●●● daily use   ●●○ regular use   ●○○ foundations", S.dim)]),
        ],
    },
    {
        name: "Projects", icon: "▶", build: () => [
            h1("Projects"), P([t("Three solo Python projects, all online.", S.dim)]), rule(), blank(),
            ...PROJECTS.flatMap((p) => [
                P([t(p.name, S.bold), t(`  [${p.status}]`, p.status === "In progress" ? S.warn : S.ok)]),
                P([t(p.tagline, S.dim)]),
                blank(), P(p.text, { indent: 2 }),
                ...p.points.map((x) => bullet(x, 3)),
                P([t(p.tags.map((x) => `#${x.replace(/\s+/g, "")}`).join(" "), S.tag)], { indent: 2 }),
                P(p.links.flatMap(([label, url], i) => [...(i ? [t("   ")] : []), lnk(label, url)]), { indent: 2 }),
                blank(), rule(), blank(),
            ]),
            P([lnk("More code on GitHub", PERSON.github)]),
        ],
    },
    {
        name: "Contact", icon: "✉", build: () => [
            h1("Get in touch"), rule(), blank(),
            P(PERSON.looking), blank(),
            kv("Email", [lnk(PERSON.email, `mailto:${PERSON.email}`)]),
            kv("GitHub", [lnk(PERSON.github.replace("https://", ""), PERSON.github)]),
            kv("LinkedIn", [lnk("linkedin.com/in/kurtishopewell", PERSON.linkedin)]),
            kv("Based in", PERSON.location), blank(),
            P([t(PERSON.available, S.ok)]),
            P([t(PERSON.reply, S.dim)]), blank(),
            P([lnk("Send a message on the website", `${SITE}/contact`)]),
        ],
    },
];

// ---- wrapping ---------------------------------------------------------------------------------
function layoutBlocks(blocks, width) {
    const lines = [];
    for (const b of blocks) {
        if (b.blank) { lines.push([]); continue; }
        if (b.rule) { lines.push([{ t: "─".repeat(width), s: S.dim }]); continue; }
        const indent = b.indent || 0;
        const first = b.first || "";
        const hang = indent + (b.hang !== undefined ? b.hang : first.length);
        const avail = Math.max(8, width - hang);
        let cur = [], curLen = 0, firstLine = true;
        const flush = () => {
            const pre = firstLine
                ? [indent ? { t: " ".repeat(indent), s: S.text } : null, first ? { t: first, s: b.firstStyle || S.dim } : null]
                : [hang ? { t: " ".repeat(hang), s: S.text } : null];
            lines.push([...pre.filter(Boolean), ...cur]);
            cur = []; curLen = 0; firstLine = false;
        };
        for (const seg of b.segs) {
            for (let part of seg.t.split(/( +)/)) {
                if (part === "") continue;
                const space = part.trim() === "";
                if (!space && curLen + part.length > avail && curLen > 0) flush();
                if (space && curLen === 0 && !firstLine) continue;
                while (part.length > avail) { // a single very long word
                    if (curLen) flush();
                    cur.push({ ...seg, t: part.slice(0, avail) });
                    curLen = avail;
                    part = part.slice(avail);
                    flush();
                }
                cur.push({ ...seg, t: part });
                curLen += part.length;
            }
        }
        flush();
    }
    return lines;
}

// ---- the TUI -------------------------------------------------------------------------------------
export function runTui({ onOpenLink } = {}) {
    return new Promise((resolve) => {
        const root = document.createElement("div");
        root.className = "tui";
        root.setAttribute("role", "application");
        root.setAttribute("aria-label", "Portfolio text interface");
        const screen = document.createElement("pre");
        screen.className = "tui-screen";
        root.appendChild(screen);
        document.body.appendChild(root);

        let cols = 80, rows = 24, charW = 8, lineH = 18;
        let section = 0;
        let focus = "menu";      // "menu" | "content"
        let scroll = 0;
        let selLink = -1;        // index into link groups
        let showHelp = false;
        let cache = { key: "", vlines: [], groups: [] };
        let buf = [];            // buf[y][x] = { c, s }
        const hits = [];         // clickable regions: { x, y, w, action }

        // -- measuring ---------------------------------------------------------------------------
        function measure() {
            const probe = document.createElement("span");
            probe.textContent = "M".repeat(100);
            probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
            screen.appendChild(probe);
            charW = probe.getBoundingClientRect().width / 100 || 8;
            lineH = probe.getBoundingClientRect().height || 18;
            probe.remove();
            cols = Math.max(20, Math.floor(root.clientWidth / charW));
            rows = Math.max(8, Math.floor(root.clientHeight / lineH));
        }

        // -- drawing primitives -----------------------------------------------------------------
        const clear = () => { buf = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ c: " ", s: S.text }))); hits.length = 0; };
        function put(x, y, text, s = S.text) {
            if (y < 0 || y >= rows) return;
            for (const ch of text) {
                if (x >= 0 && x < cols) buf[y][x] = { c: ch, s };
                x++;
            }
        }
        const fillRow = (y, s) => { for (let x = 0; x < cols; x++) buf[y][x] = { c: " ", s }; };
        function box(x, y, w, h, title, active) {
            const bs = active ? { fg: "purple" } : S.dim;
            put(x, y, "╭" + "─".repeat(w - 2) + "╮", bs);
            for (let i = 1; i < h - 1; i++) { put(x, y + i, "│", bs); put(x + w - 1, y + i, "│", bs); }
            put(x, y + h - 1, "╰" + "─".repeat(w - 2) + "╯", bs);
            if (title) { put(x + 2, y, "┤", bs); put(x + 3, y, ` ${title} `, active ? S.title : S.dim); put(x + 5 + title.length, y, "├", bs); }
        }
        function render() {
            const parts = [];
            for (let y = 0; y < rows; y++) {
                let html = "", run = "", key = null, cls = "";
                for (let x = 0; x < cols; x++) {
                    const { c, s } = buf[y][x];
                    const k = styleKey(s);
                    if (k !== key) { if (run) html += `<span class="${cls}">${run}</span>`; run = ""; key = k; cls = styleClass(s); }
                    run += esc(c);
                }
                if (run) html += `<span class="${cls}">${run}</span>`;
                parts.push(html);
            }
            screen.innerHTML = parts.join("\n");
        }

        // -- layout -----------------------------------------------------------------------------
        const narrow = () => cols < 64;
        function geometry() {
            const bodyY = 1, bodyH = rows - 2;
            if (narrow()) {
                const view = focus === "menu" ? "menu" : "content";
                return { view, menu: { x: 0, y: bodyY, w: cols, h: bodyH }, content: { x: 0, y: bodyY, w: cols, h: bodyH } };
            }
            const mw = Math.min(26, Math.max(20, Math.floor(cols * 0.28)));
            return { view: "both", menu: { x: 0, y: bodyY, w: mw, h: bodyH }, content: { x: mw, y: bodyY, w: cols - mw, h: bodyH } };
        }
        function contentLayout(w) {
            const key = `${section}:${w}`;
            if (cache.key !== key) {
                linkId = 0;
                const vlines = layoutBlocks(SECTIONS[section].build(), w);
                const groups = new Map();
                vlines.forEach((line, y) => {
                    let x = 0;
                    for (const seg of line) {
                        if (seg.link) {
                            const g = groups.get(seg.link.id) || { url: seg.link.url, pieces: [] };
                            const last = g.pieces[g.pieces.length - 1];
                            if (last && last.y === y && last.x + last.len === x) last.len += seg.t.length;
                            else g.pieces.push({ y, x, len: seg.t.length });
                            groups.set(seg.link.id, g);
                        }
                        x += seg.t.length;
                    }
                });
                cache = { key, vlines, groups: [...groups.values()] };
                selLink = -1;
            }
            return cache;
        }

        function draw() {
            clear();
            const g = geometry();

            // header
            fillRow(0, S.bar);
            put(1, 0, "◆ KLH Portfolio", S.barTitle);
            put(18, 0, "· " + PERSON.name, S.barDim);
            const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            put(cols - clock.length - 1, 0, clock, S.barDim);

            // menu
            if (g.view !== "content") {
                const m = g.menu;
                box(m.x, m.y, m.w, m.h, "Menu", focus === "menu");
                SECTIONS.forEach((sec, i) => {
                    const y = m.y + 2 + i;
                    if (y >= m.y + m.h - 1) return;
                    const active = i === section;
                    const label = ` ${active ? "▸" : " "} ${i + 1}  ${sec.name}`.padEnd(m.w - 2);
                    put(m.x + 1, y, label, active ? (focus === "menu" ? S.sel : S.selDim) : S.text);
                    hits.push({ x: m.x + 1, y, w: m.w - 2, action: () => { select(i); if (narrow()) focus = "content"; draw(); } });
                });
                const infoY = m.y + m.h - 5;
                if (infoY > m.y + 2 + SECTIONS.length) {
                    put(m.x + 3, infoY, PERSON.name.split(" ")[0], S.bold);
                    put(m.x + 3, infoY + 1, "Coventry, UK", S.dim);
                    put(m.x + 3, infoY + 2, "Open Sep 2026", S.ok);
                }
            }

            // content
            if (g.view !== "menu") {
                const c = g.content;
                box(c.x, c.y, c.w, c.h, `${SECTIONS[section].icon} ${SECTIONS[section].name}`, focus === "content");
                const innerW = c.w - 5, innerH = c.h - 2;
                const { vlines, groups } = contentLayout(innerW);
                const maxScroll = Math.max(0, vlines.length - innerH);
                scroll = Math.min(Math.max(scroll, 0), maxScroll);
                for (let i = 0; i < innerH; i++) {
                    const line = vlines[scroll + i];
                    if (!line) break;
                    let x = c.x + 2;
                    for (const seg of line) { put(x, c.y + 1 + i, seg.t, seg.s); x += seg.t.length; }
                }
                // selected link
                groups.forEach((grp, gi) => {
                    grp.pieces.forEach((pc) => {
                        const y = pc.y - scroll;
                        if (y < 0 || y >= innerH) return;
                        if (gi === selLink) put(c.x + 2 + pc.x, c.y + 1 + y, vlines[pc.y].flatMap((sg) => [...sg.t]).slice(pc.x, pc.x + pc.len).join(""), S.linkSel);
                        hits.push({ x: c.x + 2 + pc.x, y: c.y + 1 + y, w: pc.len, action: () => open(grp.url) });
                    });
                });
                // scrollbar
                if (vlines.length > innerH) {
                    const trackH = innerH, thumb = Math.max(1, Math.round((innerH / vlines.length) * trackH));
                    const top = Math.round((scroll / maxScroll) * (trackH - thumb));
                    for (let i = 0; i < trackH; i++) put(c.x + c.w - 2, c.y + 1 + i, i >= top && i < top + thumb ? "█" : "░", S.dim);
                }
                hits.push({ x: c.x + 1, y: c.y + 1, w: c.w - 2, h: c.h - 2, action: () => { focus = "content"; draw(); }, region: true });
            }

            // footer
            const fy = rows - 1;
            fillRow(fy, S.bar);
            let x = 1;
            const key = (k, label, action) => {
                put(x, fy, k, S.barKey); put(x + k.length, fy, " " + label, S.bar);
                if (action) hits.push({ x, y: fy, w: k.length + 1 + label.length, action });
                x += k.length + label.length + 4;
            };
            if (focus === "menu") { key("↑↓", "select"); key("Enter", "open", () => { focus = "content"; draw(); }); }
            else { key("↑↓", "scroll"); key("Tab", "next link"); key("Enter", "open link", () => openSelected()); key("←", "menu", () => { focus = "menu"; draw(); }); }
            key("?", "help", () => { showHelp = true; draw(); });
            key("q", "quit", () => quit());
            const pos = `${section + 1}/${SECTIONS.length}`;
            put(cols - pos.length - 1, fy, pos, S.barDim);

            if (showHelp) drawHelp();
            render();
        }

        function drawHelp() {
            const lines = [
                ["↑ ↓  j k", "Move / scroll"], ["Enter  →  l", "Open the selected section"], ["←  h  Esc", "Back to the menu"],
                ["1 – 7", "Jump to a section"], ["PgUp PgDn  Space", "Scroll a page"], ["g  G", "Top / bottom"],
                ["Tab  Shift+Tab", "Next / previous link"], ["Enter (on a link)", "Open it in a new tab"],
                ["Mouse", "Click and scroll work too"], ["q  Ctrl+C", "Quit"],
            ];
            const w = Math.min(cols - 4, 52), h = lines.length + 4;
            const x = Math.floor((cols - w) / 2), y = Math.max(1, Math.floor((rows - h) / 2));
            for (let j = 0; j < h; j++) put(x, y + j, " ".repeat(w), { fg: "text", bg: "bar" });
            box(x, y, w, h, "Keys", true);
            lines.forEach(([k, d], i) => { put(x + 3, y + 2 + i, k.padEnd(20), { fg: "green", bg: "bar" }); put(x + 23, y + 2 + i, d.slice(0, w - 26), { fg: "text", bg: "bar" }); });
        }

        // -- actions ----------------------------------------------------------------------------
        function select(i) {
            section = (i + SECTIONS.length) % SECTIONS.length;
            scroll = 0;
            selLink = -1;
        }
        function open(url) {
            if (onOpenLink) onOpenLink(url);
            else if (url.startsWith("mailto:")) window.location.href = url;
            else window.open(url, "_blank", "noopener,noreferrer");
        }
        function openSelected() {
            const g = geometry();
            const { groups } = contentLayout(g.content.w - 5);
            if (selLink >= 0 && groups[selLink]) open(groups[selLink].url);
        }
        function cycleLink(dir) {
            const g = geometry();
            const { groups } = contentLayout(g.content.w - 5);
            if (!groups.length) return;
            selLink = selLink < 0 ? (dir > 0 ? 0 : groups.length - 1) : (selLink + dir + groups.length) % groups.length;
            const innerH = g.content.h - 2;
            const y = groups[selLink].pieces[0].y;
            if (y < scroll) scroll = y; else if (y >= scroll + innerH) scroll = y - innerH + 2;
        }
        const pageSize = () => Math.max(1, geometry().content.h - 4);

        function onKey(e) {
            const k = e.key;
            if (e.ctrlKey && k.toLowerCase() === "c") { e.preventDefault(); return quit(); }
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (showHelp) { showHelp = false; return draw(); }
            if (k === "q" || k === "Q") return quit();
            if (k === "?") { showHelp = true; return draw(); }
            if (/^[1-7]$/.test(k)) { select(Number(k) - 1); if (narrow()) focus = "content"; return draw(); }
            if (focus === "menu") {
                if (k === "ArrowDown" || k === "j") select(section + 1);
                else if (k === "ArrowUp" || k === "k") select(section - 1);
                else if (k === "Home") select(0);
                else if (k === "End") select(SECTIONS.length - 1);
                else if (k === "Enter" || k === "ArrowRight" || k === "l") focus = "content";
                else if (k === "Escape") return quit();
            } else {
                if (k === "ArrowDown" || k === "j") scroll++;
                else if (k === "ArrowUp" || k === "k") scroll--;
                else if (k === "PageDown" || k === " ") scroll += pageSize();
                else if (k === "PageUp") scroll -= pageSize();
                else if (k === "Home" || k === "g") scroll = 0;
                else if (k === "End" || k === "G") scroll = 1e6;
                else if (k === "Tab") cycleLink(e.shiftKey ? -1 : 1);
                else if (k === "Enter") openSelected();
                else if (k === "ArrowLeft" || k === "h" || k === "Escape") focus = "menu";
            }
            draw();
        }

        function cellOf(e) {
            const r = screen.getBoundingClientRect();
            return { x: Math.floor((e.clientX - r.left) / charW), y: Math.floor((e.clientY - r.top) / lineH) };
        }
        function onClick(e) {
            const { x, y } = cellOf(e);
            if (showHelp) { showHelp = false; return draw(); }
            // specific targets (links, menu items, footer keys) win over the content region
            const specific = hits.filter((h) => !h.region).find((h) => y === h.y && x >= h.x && x < h.x + h.w);
            const region = hits.find((h) => h.region && x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
            const hit = specific || region;
            if (hit) hit.action();
        }
        function onWheel(e) {
            e.preventDefault();
            scroll += e.deltaY > 0 ? 3 : -3;
            draw();
        }

        function quit() {
            document.removeEventListener("keydown", onKey, true);
            window.removeEventListener("resize", onResize);
            clearInterval(clockTimer);
            root.classList.add("tui-out");
            setTimeout(() => root.remove(), 160);
            resolve();
        }
        const onResize = () => { measure(); cache.key = ""; draw(); };

        document.addEventListener("keydown", onKey, true);
        window.addEventListener("resize", onResize);
        root.addEventListener("click", onClick);
        root.addEventListener("wheel", onWheel, { passive: false });
        const clockTimer = setInterval(draw, 30000);

        measure();
        draw();
    });
}
