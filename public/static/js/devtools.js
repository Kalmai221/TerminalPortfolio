// devtools.js - Developer tools for KLH Browser: Elements, Console, Sources, Network, Application.
// Pages served from this site are same-origin, so they can be inspected for real. Cross-origin pages (like the
// embedded portfolio) are blocked by the browser's security rules, and the panels say so.

const MAX_LOGS = 500;
const PREF_KEY = "klh-devtools";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
};
const fmtBytes = (b) => (b == null ? "—" : b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} kB`);
const fmtMs = (ms) => (ms == null ? "—" : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`);

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/**
 * ctx: {
 *   getTab(): active tab ({frame, remote, ...}) | null,
 *   storage: { keys(), get(k), set(k, v), remove(k), clear() },
 *   host: element the panel is mounted in (the .browser-body flex container),
 * }
 */
export function createDevTools(ctx) {
    let prefs = { panel: "elements", dock: "bottom", size: 280 };
    try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") }; } catch { /* ignore */ }
    const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* ignore */ } };

    const logs = new WeakMap();        // tab -> console entries
    const docRecords = new WeakMap();  // tab -> main document network record
    const expanded = new WeakSet();    // DOM nodes opened in the Elements tree
    let selected = null;
    let picking = false;
    let isOpen = false;
    let netFilter = "all";
    let selectedNet = null;
    let sourceFile = null;
    let appKey = null;
    let consoleFilter = "all";
    let consoleText = "";
    const cmdHistory = [];
    let cmdIndex = 0;

    // ---- DOM skeleton ---------------------------------------------------------
    const root = el("div", "devtools");
    root.hidden = true;
    root.innerHTML = `
        <div class="dt-resizer" title="Drag to resize"></div>
        <div class="dt-tabs" role="tablist">
            <button class="dt-icon-btn" data-act="pick" title="Select an element in the page to inspect it (Ctrl+Shift+C)" aria-label="Inspect element">⬚</button>
            <button class="dt-tab" data-panel="elements" role="tab">Elements</button>
            <button class="dt-tab" data-panel="console" role="tab">Console</button>
            <button class="dt-tab" data-panel="sources" role="tab">Sources</button>
            <button class="dt-tab" data-panel="network" role="tab">Network</button>
            <button class="dt-tab" data-panel="application" role="tab">Application</button>
            <span class="dt-spacer"></span>
            <button class="dt-icon-btn" data-act="dock" title="Dock to the side / bottom" aria-label="Change dock position">◫</button>
            <button class="dt-icon-btn" data-act="close" title="Close (F12)" aria-label="Close developer tools">×</button>
        </div>
        <div class="dt-body">
            <section class="dt-panel" data-panel="elements">
                <div class="dt-split">
                    <div class="dt-tree" tabindex="0"></div>
                    <div class="dt-side">
                        <div class="dt-subtabs">
                            <button class="dt-subtab active" data-sub="styles">Styles</button>
                            <button class="dt-subtab" data-sub="computed">Computed</button>
                        </div>
                        <div class="dt-side-body"></div>
                    </div>
                </div>
                <div class="dt-crumbs"></div>
            </section>
            <section class="dt-panel" data-panel="console">
                <div class="dt-toolbar">
                    <button class="dt-icon-btn" data-act="console-clear" title="Clear console">⊘</button>
                    <select class="dt-select" data-act="console-level" aria-label="Log level">
                        <option value="all">All levels</option><option value="error">Errors</option>
                        <option value="warn">Warnings</option><option value="info">Info</option><option value="log">Logs</option>
                    </select>
                    <input class="dt-input" data-act="console-filter" placeholder="Filter" aria-label="Filter console">
                    <label class="dt-check"><input type="checkbox" data-act="console-preserve"> Preserve log</label>
                </div>
                <div class="dt-log" tabindex="0"></div>
                <div class="dt-prompt"><span class="dt-caret">›</span><input class="dt-prompt-input" placeholder="Run JavaScript in the page (try document.title)" spellcheck="false" autocomplete="off" aria-label="Console input"></div>
            </section>
            <section class="dt-panel" data-panel="sources">
                <div class="dt-split">
                    <div class="dt-files"></div>
                    <div class="dt-code"></div>
                </div>
            </section>
            <section class="dt-panel" data-panel="network">
                <div class="dt-toolbar">
                    <button class="dt-icon-btn" data-act="net-refresh" title="Refresh requests">⟳</button>
                    <div class="dt-chips"></div>
                </div>
                <div class="dt-split dt-net-split">
                    <div class="dt-net"></div>
                    <div class="dt-net-detail" hidden></div>
                </div>
                <div class="dt-summary"></div>
            </section>
            <section class="dt-panel" data-panel="application">
                <div class="dt-split">
                    <div class="dt-files dt-app-list"></div>
                    <div class="dt-code dt-app-detail"></div>
                </div>
            </section>
        </div>`;

    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const treeEl = $(".dt-tree");
    const sideBody = $(".dt-side-body");
    const crumbsEl = $(".dt-crumbs");
    const logEl = $(".dt-log");
    const promptInput = $(".dt-prompt-input");
    const netEl = $(".dt-net");
    const netDetail = $(".dt-net-detail");
    const summaryEl = $(".dt-summary");
    const chipsEl = $(".dt-chips");
    const filesEl = $('[data-panel="sources"] .dt-files');
    const codeEl = $('[data-panel="sources"] .dt-code');
    const appList = $(".dt-app-list");
    const appDetail = $(".dt-app-detail");
    let subTab = "styles";

    // ---- Same-origin access helpers ------------------------------------------
    const tabNow = () => ctx.getTab();
    const frameDoc = (tab) => { try { return (tab && tab.frame.contentDocument) || null; } catch { return null; } };
    const frameWin = (tab) => { try { return (tab && !tab.remote && tab.frame.contentWindow) || null; } catch { return null; } };
    const accessible = (tab) => {
        if (!tab || tab.remote) return false;
        const d = frameDoc(tab);
        return !!(d && d.documentElement);
    };
    const blockedNote = (what) => el("div", "dt-note",
        `<b>${what} aren't available for this page.</b><br>It comes from another origin (${esc((tabNow() && tabNow().remote) || "external")}), and browsers don't let one site inspect another site's frame. Use <i>Open in a new tab</i> and the real DevTools to inspect it.`);

    // =========================================================================
    //  Console
    // =========================================================================
    const tabLogs = (tab) => { if (!logs.has(tab)) logs.set(tab, []); return logs.get(tab); };

    function inspectValue(v, top = false, depth = 0) {
        const span = el("span");
        const t = typeof v;
        if (v === undefined) { span.className = "v-undef"; span.textContent = "undefined"; return span; }
        if (v === null) { span.className = "v-null"; span.textContent = "null"; return span; }
        if (t === "string") { span.className = top ? "v-str-top" : "v-str"; span.textContent = top ? v : JSON.stringify(v); return span; }
        if (t === "number" || t === "bigint") { span.className = "v-num"; span.textContent = String(v) + (t === "bigint" ? "n" : ""); return span; }
        if (t === "boolean") { span.className = "v-bool"; span.textContent = String(v); return span; }
        if (t === "symbol") { span.className = "v-sym"; span.textContent = v.toString(); return span; }
        if (t === "function") { span.className = "v-fn"; span.textContent = `ƒ ${v.name || "(anonymous)"}()`; return span; }
        let tag = "";
        try { tag = Object.prototype.toString.call(v); } catch { /* proxy etc. */ }
        if (tag === "[object Error]") { span.className = "v-err"; span.textContent = v.stack || `${v.name}: ${v.message}`; return span; }
        if (v && v.nodeType === 1 && typeof v.nodeName === "string") {
            span.className = "v-node";
            const id = v.id ? `#${v.id}` : "";
            const cls = v.classList && v.classList.length ? "." + [...v.classList].join(".") : "";
            span.textContent = `<${v.nodeName.toLowerCase()}${id ? ` id="${v.id}"` : ""}${cls ? ` class="${[...v.classList].join(" ")}"` : ""}>`;
            span.title = "Click to reveal in Elements";
            span.addEventListener("click", () => { showPanel("elements"); select(v); });
            return span;
        }
        // Objects and arrays: collapsible
        const isArr = Array.isArray(v);
        let keys = [];
        try { keys = Object.keys(v); } catch { /* ignore */ }
        const label = isArr ? `Array(${v.length})` : (v && v.constructor && v.constructor.name && v.constructor.name !== "Object" ? v.constructor.name : "");
        const previewKeys = keys.slice(0, 5);
        const preview = () => {
            const items = previewKeys.map((k) => {
                let val;
                try { val = v[k]; } catch { val = "(error)"; }
                const short = val === null ? "null" : typeof val === "object" ? (Array.isArray(val) ? `Array(${val.length})` : "{…}") : typeof val === "function" ? "ƒ" : typeof val === "string" ? JSON.stringify(val.length > 20 ? val.slice(0, 20) + "…" : val) : String(val);
                return isArr ? short : `${k}: ${short}`;
            });
            return `${label ? label + " " : ""}${isArr ? "[" : "{"}${items.join(", ")}${keys.length > 5 ? ", …" : ""}${isArr ? "]" : "}"}`;
        };
        const wrap = el("span", "v-obj");
        const head = el("span", "v-obj-head");
        head.innerHTML = `<span class="v-arrow">▸</span>`;
        head.append(Object.assign(el("span", "v-preview"), { textContent: preview() }));
        wrap.append(head);
        let kids = null;
        head.addEventListener("click", () => {
            if (!keys.length) return;
            if (!kids) {
                kids = el("div", "v-children");
                if (depth > 4) kids.textContent = "…";
                else for (const k of keys.slice(0, 100)) {
                    const row = el("div", "v-row");
                    row.append(Object.assign(el("span", "v-key"), { textContent: k + ": " }));
                    let val;
                    try { val = v[k]; } catch (e) { val = e; }
                    row.append(inspectValue(val, false, depth + 1));
                    kids.append(row);
                }
                wrap.append(kids);
            }
            else kids.hidden = !kids.hidden;
            head.querySelector(".v-arrow").textContent = kids.hidden ? "▸" : "▾";
        });
        return wrap;
    }

    function renderLogRow(entry) {
        const row = el("div", `dt-log-row lvl-${entry.level}`);
        const icon = { error: "⛔", warn: "⚠️", info: "ℹ️", debug: "", log: "", input: "›", result: "‹" }[entry.level] || "";
        row.append(Object.assign(el("span", "dt-log-icon"), { textContent: icon }));
        const msg = el("span", "dt-log-msg");
        if (entry.count > 1) msg.append(Object.assign(el("span", "dt-log-count"), { textContent: entry.count }));
        entry.args.forEach((a, i) => {
            if (i) msg.append(document.createTextNode(" "));
            msg.append(entry.html ? Object.assign(el("span"), { innerHTML: a }) : inspectValue(a, entry.level !== "result"));
        });
        row.append(msg);
        if (entry.source) row.append(Object.assign(el("span", "dt-log-src"), { textContent: entry.source }));
        return row;
    }

    function renderConsole() {
        const tab = tabNow();
        logEl.innerHTML = "";
        if (!tab) return;
        const text = consoleText.toLowerCase();
        const rows = tabLogs(tab).filter((e) => {
            if (consoleFilter !== "all") {
                if (consoleFilter === "log" ? !(e.level === "log" || e.level === "debug") : e.level !== consoleFilter) {
                    if (!(e.level === "input" || e.level === "result")) return false;
                }
            }
            if (text && !e.args.map((a) => (typeof a === "string" ? a : "")).join(" ").toLowerCase().includes(text) && e.level !== "input" && e.level !== "result") return false;
            return true;
        });
        if (!rows.length) logEl.append(el("div", "dt-empty", "Console is empty. Logs from the page appear here."));
        rows.forEach((e) => logEl.append(renderLogRow(e)));
        logEl.scrollTop = logEl.scrollHeight;
    }

    function addLog(tab, level, args, extra = {}) {
        if (!tab) return;
        const list = tabLogs(tab);
        const last = list[list.length - 1];
        const sameText = last && last.level === level && !extra.html && args.length === 1 && last.args.length === 1 && typeof args[0] === "string" && last.args[0] === args[0];
        if (sameText) last.count++;
        else list.push({ level, args, count: 1, ...extra });
        if (list.length > MAX_LOGS) list.shift();
        if (isOpen && tab === tabNow() && prefs.panel === "console") renderConsole();
    }

    function runConsoleInput(text) {
        const tab = tabNow();
        if (!text.trim()) return;
        cmdHistory.push(text);
        cmdIndex = cmdHistory.length;
        addLog(tab, "input", [`<span class="v-str-top">${esc(text)}</span>`], { html: true });
        const win = frameWin(tab);
        if (!win) {
            addLog(tab, "error", [`Uncaught DOMException: Blocked a frame with origin "${location.origin}" from accessing a cross-origin frame.`]);
            return;
        }
        try {
            const result = win.eval(text);
            if (result && typeof result.then === "function") {
                addLog(tab, "result", [result]);
                result.then((v) => addLog(tab, "result", [v]), (e) => addLog(tab, "error", [`Uncaught (in promise) ${e}`]));
            } else addLog(tab, "result", [result]);
        } catch (e) {
            addLog(tab, "error", [`Uncaught ${e && e.name ? e.name + ": " : ""}${e && e.message ? e.message : e}`]);
        }
    }

    // Helpers like Chrome's console utilities, defined on each page that loads
    function installConsoleHelpers(tab) {
        const win = frameWin(tab);
        const doc = frameDoc(tab);
        if (!win || !doc) return;
        try {
            win.$ = (s) => doc.querySelector(s);
            win.$$ = (s) => [...doc.querySelectorAll(s)];
            win.clear = () => { logs.set(tab, []); if (isOpen) renderConsole(); };
            win.$0 = selected && selected.ownerDocument === doc ? selected : undefined;
        } catch { /* ignore */ }
    }

    // =========================================================================
    //  Elements
    // =========================================================================
    function cssSelector(node) {
        const parts = [];
        for (let n = node; n && n.nodeType === 1 && n.nodeName !== "HTML"; n = n.parentNode) {
            if (n.id) { parts.unshift(`#${n.id}`); break; }
            let part = n.nodeName.toLowerCase();
            const same = [...n.parentNode.children].filter((c) => c.nodeName === n.nodeName);
            if (n.classList && n.classList.length) part += "." + [...n.classList].join(".");
            else if (same.length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`;
            parts.unshift(part);
        }
        return parts.join(" > ");
    }
    function expandAll(node) {
        expanded.add(node);
        [...node.children].forEach(expandAll);
    }
    function elementMenu(e, node) {
        e.preventDefault();
        e.stopPropagation();
        select(node);
        const hidden = node.style.visibility === "hidden";
        ctx.showMenu(e.clientX, e.clientY, [
            { label: "Copy outerHTML", action: () => ctx.copy(node.outerHTML, "outerHTML copied") },
            { label: "Copy selector", action: () => ctx.copy(cssSelector(node), "Selector copied") },
            { label: "Copy text content", action: () => ctx.copy(node.textContent.trim(), "Text copied") },
            "-",
            { label: "Scroll into view", action: () => node.scrollIntoView({ block: "center", behavior: "smooth" }) },
            { label: "Hide element", checked: hidden, action: () => { node.style.visibility = hidden ? "" : "hidden"; renderTree(); } },
            { label: "Expand recursively", action: () => { expandAll(node); renderTree(); } },
            { label: "Collapse children", action: () => { [...node.querySelectorAll("*")].forEach((c) => expanded.delete(c)); expanded.delete(node); renderTree(); } },
            "-",
            { label: "Delete element", hint: "Del", disabled: node === node.ownerDocument.documentElement || node === node.ownerDocument.body, action: () => { const next = node.nextElementSibling || node.previousElementSibling || node.parentNode; node.remove(); select(next); } },
        ]);
    }
    const nodeVisible = (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()) || n.nodeType === 8;
    const kidsOf = (n) => [...n.childNodes].filter(nodeVisible);
    const isDevOverlay = (n) => n.nodeType === 1 && n.id === "__klh_dt_overlay";

    function attrsHtml(node) {
        return [...node.attributes].map((a) => ` <span class="t-attr">${esc(a.name)}</span>=<span class="t-val">"${esc(a.value.length > 90 ? a.value.slice(0, 90) + "…" : a.value)}"</span>`).join("");
    }

    function buildNode(node) {
        const wrap = el("div", "dt-node");
        if (node.nodeType === 3) {
            const t = node.textContent.trim();
            const row = el("div", "dt-row dt-text", `<span class="dt-arrow"></span><span class="t-text">${esc(t.length > 160 ? t.slice(0, 160) + "…" : t)}</span>`);
            wrap.append(row);
            return wrap;
        }
        if (node.nodeType === 8) {
            wrap.append(el("div", "dt-row dt-comment", `<span class="dt-arrow"></span><span class="t-comment">&lt;!--${esc(node.textContent.slice(0, 120))}--&gt;</span>`));
            return wrap;
        }
        const tag = node.nodeName.toLowerCase();
        const kids = VOID.has(tag) ? [] : kidsOf(node).filter((k) => !isDevOverlay(k));
        const inlineText = kids.length === 1 && kids[0].nodeType === 3 && kids[0].textContent.trim().length <= 80;
        const open = `<span class="t-punct">&lt;</span><span class="t-tag">${esc(tag)}</span>${attrsHtml(node)}<span class="t-punct">&gt;</span>`;
        const close = `<span class="t-punct">&lt;/</span><span class="t-tag">${esc(tag)}</span><span class="t-punct">&gt;</span>`;
        const row = el("div", "dt-row");
        row._node = node;
        if (node === selected) row.classList.add("selected");

        if (!kids.length || inlineText) {
            const inner = inlineText ? `<span class="t-text">${esc(kids[0].textContent.trim())}</span>${close}` : "";
            row.innerHTML = `<span class="dt-arrow"></span>${open}${inner}`;
            wrap.append(row);
        } else {
            const isOpen2 = expanded.has(node);
            row.innerHTML = `<span class="dt-arrow">${isOpen2 ? "▾" : "▸"}</span>${open}${isOpen2 ? "" : `<span class="t-ellipsis">…</span>${close}`}`;
            wrap.append(row);
            if (isOpen2) {
                const children = el("div", "dt-children");
                kids.forEach((k) => children.append(buildNode(k)));
                wrap.append(children);
                wrap.append(Object.assign(el("div", "dt-row dt-close"), { innerHTML: `<span class="dt-arrow"></span>${close}` }));
            }
            row.querySelector(".dt-arrow").addEventListener("click", (e) => {
                e.stopPropagation();
                if (expanded.has(node)) expanded.delete(node); else expanded.add(node);
                renderTree();
            });
        }
        row.addEventListener("click", () => select(node));
        row.addEventListener("contextmenu", (e) => elementMenu(e, node));
        row.addEventListener("mouseenter", () => highlight(node));
        row.addEventListener("mouseleave", () => highlight(selected));
        return wrap;
    }

    function renderTree() {
        const tab = tabNow();
        treeEl.innerHTML = "";
        if (!accessible(tab)) { treeEl.append(blockedNote("Elements")); sideBody.innerHTML = ""; crumbsEl.textContent = ""; return; }
        const doc = frameDoc(tab);
        if (!selected || selected.ownerDocument !== doc) {
            selected = doc.body || doc.documentElement;
            expanded.add(doc.documentElement);
            if (doc.body) expanded.add(doc.body);
            if (doc.head) expanded.add(doc.head);
        }
        treeEl.append(Object.assign(el("div", "dt-doctype"), { textContent: "<!DOCTYPE html>" }));
        treeEl.append(buildNode(doc.documentElement));
        renderSide();
        renderCrumbs();
        const sel = treeEl.querySelector(".dt-row.selected");
        if (sel) sel.scrollIntoView({ block: "nearest" });
    }

    function select(node) {
        if (!node || node.nodeType !== 1) return;
        selected = node;
        for (let p = node.parentNode; p && p.nodeType === 1; p = p.parentNode) expanded.add(p);
        const win = frameWin(tabNow());
        if (win) try { win.$0 = node; } catch { /* ignore */ }
        highlight(node);
        if (isOpen && prefs.panel === "elements") renderTree();
    }

    function renderCrumbs() {
        crumbsEl.innerHTML = "";
        const path = [];
        for (let n = selected; n && n.nodeType === 1; n = n.parentNode) path.unshift(n);
        path.forEach((n, i) => {
            const b = el("button", "dt-crumb" + (n === selected ? " active" : ""));
            b.textContent = n.nodeName.toLowerCase() + (n.id ? `#${n.id}` : "") + (n.classList && n.classList.length ? "." + n.classList[0] : "");
            b.addEventListener("click", () => select(n));
            crumbsEl.append(b);
            if (i < path.length - 1) crumbsEl.append(Object.assign(el("span", "dt-crumb-sep"), { textContent: "›" }));
        });
    }

    // --- page highlight overlay -----------------------------------------------
    function overlayFor(doc) {
        let o = doc.getElementById("__klh_dt_overlay");
        if (!o) {
            o = doc.createElement("div");
            o.id = "__klh_dt_overlay";
            o.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;background:rgba(111,168,220,.4);outline:1px solid rgba(40,120,200,.9);display:none;";
            const label = doc.createElement("div");
            label.style.cssText = "position:absolute;top:-22px;left:0;background:#1a1a1a;color:#fff;font:11px monospace;padding:2px 6px;border-radius:3px;white-space:nowrap;";
            o.appendChild(label);
            doc.documentElement.appendChild(o);
        }
        return o;
    }
    function highlight(node) {
        const tab = tabNow();
        const doc = frameDoc(tab);
        if (!doc) return;
        const o = overlayFor(doc);
        if (!node || node.nodeType !== 1 || node.ownerDocument !== doc || node === doc.documentElement) { o.style.display = "none"; return; }
        const r = node.getBoundingClientRect();
        o.style.display = "block";
        Object.assign(o.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
        o.firstChild.textContent = `${node.nodeName.toLowerCase()}${node.id ? "#" + node.id : ""}  ${Math.round(r.width)} × ${Math.round(r.height)}`;
        o.firstChild.style.top = r.top < 24 ? `${r.height + 2}px` : "-22px";
    }
    function clearHighlight() {
        const doc = frameDoc(tabNow());
        const o = doc && doc.getElementById("__klh_dt_overlay");
        if (o) o.style.display = "none";
    }

    // --- element picker ---------------------------------------------------------
    let pickCleanup = null;
    function setPicking(on) {
        picking = on;
        $('[data-act="pick"]').classList.toggle("active", on);
        if (pickCleanup) { pickCleanup(); pickCleanup = null; }
        const doc = frameDoc(tabNow());
        if (!on || !doc) return;
        const over = (e) => highlight(e.target);
        const click = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setPicking(false);
            showPanel("elements");
            select(e.target);
        };
        doc.addEventListener("mouseover", over, true);
        doc.addEventListener("click", click, true);
        doc.documentElement.style.cursor = "crosshair";
        pickCleanup = () => {
            doc.removeEventListener("mouseover", over, true);
            doc.removeEventListener("click", click, true);
            doc.documentElement.style.cursor = "";
            highlight(selected);
        };
    }

    // --- Styles / Computed ---------------------------------------------------------
    function matchingRules(node) {
        const out = [];
        const doc = node.ownerDocument;
        const walk = (rules, sheet) => {
            for (const rule of rules) {
                if (rule.type === 1) {
                    let ok = false;
                    try { ok = node.matches(rule.selectorText); } catch { /* invalid selector */ }
                    if (ok) out.push({ rule, source: sheet.href ? sheet.href.split("/").pop() : "<style>" });
                } else if (rule.cssRules && rule.type === 4 && doc.defaultView.matchMedia(rule.conditionText || rule.media.mediaText).matches) {
                    walk(rule.cssRules, sheet);
                }
            }
        };
        for (const sheet of doc.styleSheets) {
            let rules;
            try { rules = sheet.cssRules; } catch { continue; } // cross-origin sheet
            walk(rules, sheet);
        }
        return out.reverse();
    }

    // Declarations as authored (shorthands stay shorthands), instead of CSSStyleDeclaration's expanded longhands
    const declNames = (style) => {
        const names = [];
        const re = /([\w-]+)\s*:\s*(?:[^;(]|\([^)]*\))*/g;
        let m;
        while ((m = re.exec(style.cssText))) names.push(m[1]);
        return names;
    };

    function propRow(style, name, onChange) {
        const row = el("div", "dt-prop");
        const val = style.getPropertyValue(name);
        row.innerHTML = `<span class="p-name">${esc(name)}</span>: <span class="p-val" contenteditable="true" spellcheck="false">${esc(val)}</span>;`;
        const valEl = row.querySelector(".p-val");
        valEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); valEl.blur(); } });
        valEl.addEventListener("blur", () => {
            const next = valEl.textContent.trim();
            if (next === val) return;
            if (next) style.setProperty(name, next); else style.removeProperty(name);
            onChange();
        });
        return row;
    }

    function renderStyles() {
        sideBody.innerHTML = "";
        if (!selected) return;
        const refresh = () => { renderStyles(); highlight(selected); };
        if (selected.style && selected.style.length) {
            const sec = el("div", "dt-rule", `<div class="dt-rule-head"><span>element.style {</span></div>`);
            for (const name of declNames(selected.style)) sec.append(propRow(selected.style, name, refresh));
            sec.append(el("div", "dt-rule-close", "}"));
            sideBody.append(sec);
        }
        const matched = matchingRules(selected);
        for (const { rule, source } of matched) {
            const sec = el("div", "dt-rule");
            sec.append(el("div", "dt-rule-head", `<span>${esc(rule.selectorText)} {</span><span class="dt-rule-src">${esc(source)}</span>`));
            for (const name of declNames(rule.style)) sec.append(propRow(rule.style, name, refresh));
            sec.append(el("div", "dt-rule-close", "}"));
            sideBody.append(sec);
        }
        if (!matched.length && !(selected.style && selected.style.length)) sideBody.append(el("div", "dt-empty", "No matching style rules."));
        sideBody.append(el("div", "dt-hint", "Click a value to edit it. Changes apply to the page live (not saved)."));
    }

    function renderComputed() {
        sideBody.innerHTML = "";
        if (!selected) return;
        const win = selected.ownerDocument.defaultView;
        const cs = win.getComputedStyle(selected);
        const px = (p) => parseFloat(cs.getPropertyValue(p)) || 0;
        const box = el("div", "dt-box");
        box.innerHTML = `
            <div class="bx bx-margin"><span class="bx-label">margin</span>${["top", "right", "bottom", "left"].map((s) => `<i class="${s}">${px("margin-" + s) || "–"}</i>`).join("")}
              <div class="bx bx-border"><span class="bx-label">border</span>${["top", "right", "bottom", "left"].map((s) => `<i class="${s}">${px("border-" + s + "-width") || "–"}</i>`).join("")}
                <div class="bx bx-padding"><span class="bx-label">padding</span>${["top", "right", "bottom", "left"].map((s) => `<i class="${s}">${px("padding-" + s) || "–"}</i>`).join("")}
                  <div class="bx bx-content">${Math.round(px("width"))} × ${Math.round(px("height"))}</div>
                </div></div></div>`;
        sideBody.append(box);
        const filter = el("input", "dt-input dt-computed-filter");
        filter.placeholder = "Filter";
        sideBody.append(filter);
        const list = el("div", "dt-computed");
        const props = [...cs].sort();
        const draw = () => {
            list.innerHTML = "";
            const q = filter.value.toLowerCase();
            for (const p of props) {
                if (q && !p.includes(q)) continue;
                list.append(el("div", "dt-prop", `<span class="p-name">${esc(p)}</span>: <span class="p-val">${esc(cs.getPropertyValue(p))}</span>`));
            }
        };
        filter.addEventListener("input", draw);
        draw();
        sideBody.append(list);
    }
    function renderSide() { if (subTab === "styles") renderStyles(); else renderComputed(); }

    // =========================================================================
    //  Network
    // =========================================================================
    const typeOf = (name, initiator) => {
        if (initiator === "document") return "doc";
        if (initiator === "script" || /\.m?js(\?|$)/.test(name)) return "js";
        if (initiator === "css" || initiator === "link" && /\.css(\?|$)/.test(name) || /\.css(\?|$)/.test(name)) return "css";
        if (initiator === "img" || /\.(png|jpe?g|gif|svg|webp|ico)(\?|$)/.test(name)) return "img";
        if (initiator === "fetch" || initiator === "xmlhttprequest") return "fetch";
        return "other";
    };
    const TYPE_LABEL = { doc: "document", css: "stylesheet", js: "script", img: "image", fetch: "fetch", other: "other" };

    function networkRecords() {
        const tab = tabNow();
        const records = [];
        const doc = tab && docRecords.get(tab);
        if (doc) records.push({ ...doc });
        const win = frameWin(tab);
        if (win && win.performance) {
            try {
                const base = doc ? doc.time : 0;
                for (const e of win.performance.getEntriesByType("resource")) {
                    if (e.name.includes("__klh")) continue;
                    records.push({
                        name: e.name.split("/").pop() || e.name,
                        url: e.name,
                        status: e.responseStatus || 200,
                        type: typeOf(e.name, e.initiatorType),
                        size: e.transferSize || e.encodedBodySize || null,
                        start: base * 0.5 + e.startTime,
                        time: e.duration,
                        initiator: e.initiatorType,
                    });
                }
            } catch { /* ignore */ }
        }
        return records;
    }

    function renderChips() {
        chipsEl.innerHTML = "";
        for (const [key, label] of [["all", "All"], ["doc", "Doc"], ["css", "CSS"], ["js", "JS"], ["fetch", "Fetch/XHR"], ["img", "Img"], ["other", "Other"]]) {
            const b = el("button", "dt-chip" + (netFilter === key ? " active" : ""));
            b.textContent = label;
            b.addEventListener("click", () => { netFilter = key; renderNetwork(); });
            chipsEl.append(b);
        }
    }

    function renderNetwork() {
        renderChips();
        const tab = tabNow();
        const all = networkRecords();
        const rows = all.filter((r) => netFilter === "all" || r.type === netFilter);
        netEl.innerHTML = "";
        const head = el("div", "dt-net-row dt-net-head", "<span>Name</span><span>Status</span><span>Type</span><span>Size</span><span>Time</span><span>Waterfall</span>");
        netEl.append(head);
        const end = Math.max(1, ...all.map((r) => (r.start || 0) + (r.time || 0)));
        rows.forEach((r) => {
            const row = el("div", "dt-net-row" + (selectedNet && selectedNet.url === r.url ? " selected" : ""));
            const left = ((r.start || 0) / end) * 100;
            const width = Math.max(1.5, ((r.time || 0) / end) * 100);
            row.innerHTML = `<span title="${esc(r.url)}">${esc(r.name)}</span><span class="${r.status >= 400 ? "bad" : ""}">${r.status || "—"}</span><span>${TYPE_LABEL[r.type] || r.type}</span><span>${fmtBytes(r.size)}</span><span>${fmtMs(r.time)}</span><span class="wf"><i style="left:${left}%;width:${width}%"></i></span>`;
            row.addEventListener("click", () => { selectedNet = r; renderNetwork(); renderNetDetail(r); });
            netEl.append(row);
        });
        if (!rows.length) netEl.append(el("div", "dt-empty", tab && tab.remote ? "Request details for another site's frame aren't available to the browser." : "No requests yet."));

        const total = all.reduce((s, r) => s + (r.size || 0), 0);
        const d = tab && docRecords.get(tab);
        summaryEl.textContent = `${all.length} request${all.length === 1 ? "" : "s"}  |  ${fmtBytes(total)} transferred  |  Finish: ${fmtMs(end)}${d ? `  |  Load: ${fmtMs(d.time)}` : ""}`;
        if (tab && tab.remote) summaryEl.textContent += "  |  Cross-origin page: only the document is shown";
        netDetail.hidden = !selectedNet;
    }

    async function renderNetDetail(r) {
        netDetail.hidden = false;
        netDetail.innerHTML = `<div class="dt-detail-head"><b>${esc(r.name)}</b><button class="dt-icon-btn" data-act="net-detail-close" aria-label="Close details">×</button></div><div class="dt-detail-body">Loading…</div>`;
        netDetail.querySelector("[data-act=net-detail-close]").addEventListener("click", () => { selectedNet = null; renderNetwork(); });
        const body = netDetail.querySelector(".dt-detail-body");
        const sameOrigin = r.url.startsWith(location.origin) || r.url.startsWith("/");
        let headers = "";
        let preview = "";
        if (sameOrigin) {
            try {
                const res = await fetch(r.url, { cache: "no-store" });
                headers = [...res.headers].map(([k, v]) => `<div class="hdr"><b>${esc(k)}:</b> ${esc(v)}</div>`).join("");
                if (/^(doc|css|js|fetch)$/.test(r.type)) {
                    const text = await res.text();
                    preview = `<pre class="dt-pre">${esc(text.slice(0, 4000))}${text.length > 4000 ? "\n…" : ""}</pre>`;
                }
            } catch { headers = "Couldn't fetch headers."; }
        } else {
            headers = "Response headers aren't available for cross-origin requests.";
        }
        body.innerHTML = `
            <div class="dt-kv"><b>General</b></div>
            <div class="hdr"><b>Request URL:</b> ${esc(r.url)}</div>
            <div class="hdr"><b>Request Method:</b> GET</div>
            <div class="hdr"><b>Status Code:</b> ${r.status || "—"}</div>
            <div class="dt-kv"><b>Response Headers</b></div>${headers}
            ${preview ? `<div class="dt-kv"><b>Response</b></div>${preview}` : ""}`;
    }

    // =========================================================================
    //  Sources
    // =========================================================================
    function renderSources() {
        const tab = tabNow();
        filesEl.innerHTML = "";
        codeEl.innerHTML = "";
        if (!accessible(tab)) { codeEl.append(blockedNote("Sources")); return; }
        const doc = frameDoc(tab);
        const files = [{ name: "(page) document", kind: "html", get: () => "<!DOCTYPE html>\n" + doc.documentElement.outerHTML.replace(/<div id="__klh_dt_overlay"[\s\S]*?<\/div><\/div>/, "") }];
        [...doc.styleSheets].forEach((s) => { if (s.href) files.push({ name: s.href.split("/").pop(), kind: "css", url: s.href }); });
        [...doc.scripts].forEach((s, i) => files.push(s.src ? { name: s.src.split("/").pop(), kind: "js", url: s.src } : { name: `(inline script ${i + 1})`, kind: "js", get: () => s.textContent }));
        if (!sourceFile || !files.some((f) => f.name === sourceFile)) sourceFile = files[0].name;
        files.forEach((f) => {
            const b = el("div", "dt-file" + (f.name === sourceFile ? " active" : ""), `<span class="dt-file-ico">${f.kind === "css" ? "#" : f.kind === "js" ? "ƒ" : "‹›"}</span>${esc(f.name)}`);
            b.addEventListener("click", () => { sourceFile = f.name; renderSources(); });
            filesEl.append(b);
        });
        const file = files.find((f) => f.name === sourceFile);
        showCode(codeEl, file);
    }

    async function showCode(target, file) {
        target.innerHTML = '<div class="dt-empty">Loading…</div>';
        let text = "";
        try { text = file.get ? file.get() : await (await fetch(file.url)).text(); } catch { text = "// couldn't load this file"; }
        const lines = text.split("\n");
        const pre = el("div", "dt-source");
        pre.innerHTML = lines.map((l, i) => `<div class="dt-line"><span class="dt-ln">${i + 1}</span><span class="dt-lc">${esc(l) || " "}</span></div>`).join("");
        target.innerHTML = "";
        target.append(pre);
    }

    // =========================================================================
    //  Application
    // =========================================================================
    function renderApplication() {
        appList.innerHTML = "";
        const keys = ctx.storage.keys();
        appList.append(el("div", "dt-file-group", "Local storage"));
        keys.forEach((k) => {
            const b = el("div", "dt-file" + (k === appKey ? " active" : ""), `<span class="dt-file-ico">🗄</span>${esc(k)}`);
            b.addEventListener("click", () => { appKey = k; renderApplication(); });
            appList.append(b);
        });
        if (!keys.length) appList.append(el("div", "dt-hint", "No keys"));
        appList.append(el("div", "dt-file-group", "Cookies"));
        appList.append(el("div", "dt-hint", "None. This browser doesn't set cookies."));
        const clear = el("button", "dt-btn", "Clear all storage");
        clear.addEventListener("click", () => { ctx.storage.clear(); appKey = null; renderApplication(); });
        appList.append(clear);

        appDetail.innerHTML = "";
        if (!appKey || !keys.includes(appKey)) { appDetail.append(el("div", "dt-empty", "Select a key to view its value.")); return; }
        const raw = ctx.storage.get(appKey) || "";
        let pretty = raw;
        try { pretty = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* not JSON */ }
        appDetail.append(el("div", "dt-kv", `<b>${esc(appKey)}</b>`));
        const ta = el("textarea", "dt-textarea");
        ta.value = pretty;
        ta.spellcheck = false;
        appDetail.append(ta);
        const save = el("button", "dt-btn", "Save");
        save.addEventListener("click", () => {
            let v = ta.value;
            try { v = JSON.stringify(JSON.parse(v)); } catch { /* keep raw text */ }
            ctx.storage.set(appKey, v);
            renderApplication();
        });
        const del = el("button", "dt-btn", "Delete key");
        del.addEventListener("click", () => { ctx.storage.remove(appKey); appKey = null; renderApplication(); });
        appDetail.append(save, del);
    }

    // =========================================================================
    //  Panel plumbing
    // =========================================================================
    function showPanel(name) {
        prefs.panel = name;
        savePrefs();
        $$(".dt-tab").forEach((b) => b.classList.toggle("active", b.dataset.panel === name));
        $$(".dt-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === name));
        refresh();
        if (name === "console") promptInput.focus();
    }

    function refresh() {
        if (!isOpen) return;
        switch (prefs.panel) {
            case "elements": renderTree(); break;
            case "console": renderConsole(); break;
            case "sources": renderSources(); break;
            case "network": renderNetwork(); break;
            case "application": renderApplication(); break;
        }
    }

    function applyLayout() {
        root.dataset.dock = prefs.dock;
        ctx.host.dataset.dock = prefs.dock;
        if (prefs.dock === "bottom") { root.style.height = prefs.size + "px"; root.style.width = ""; }
        else { root.style.width = Math.max(prefs.size, 300) + "px"; root.style.height = ""; }
    }

    function toggle(force) {
        isOpen = force === undefined ? !isOpen : force;
        root.hidden = !isOpen;
        ctx.host.classList.toggle("dt-open", isOpen);
        if (isOpen) { applyLayout(); showPanel(prefs.panel); }
        else { setPicking(false); clearHighlight(); }
    }

    // ---- context menus -------------------------------------------------------------
    logEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const row = e.target.closest(".dt-log-row");
        ctx.showMenu(e.clientX, e.clientY, [
            ...(row ? [{ label: "Copy message", action: () => ctx.copy(row.querySelector(".dt-log-msg").textContent, "Message copied") }, "-"] : []),
            { label: "Clear console", action: () => { logs.set(tabNow(), []); renderConsole(); } },
            { label: "Preserve log", checked: preserve, action: () => { preserve = !preserve; root.querySelector('[data-act="console-preserve"]').checked = preserve; } },
        ]);
    });
    netEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rowEl = e.target.closest(".dt-net-row:not(.dt-net-head)");
        if (!rowEl) return;
        const rows = [...netEl.querySelectorAll(".dt-net-row:not(.dt-net-head)")];
        const rec = networkRecords().filter((r) => netFilter === "all" || r.type === netFilter)[rows.indexOf(rowEl)];
        if (!rec) return;
        const real = rec.url.startsWith("/") || rec.url.startsWith(location.origin);
        ctx.showMenu(e.clientX, e.clientY, [
            { label: "Copy URL", action: () => ctx.copy(rec.url, "URL copied") },
            { label: "Copy as cURL", action: () => ctx.copy(`curl '${rec.url}'`, "cURL command copied") },
            { label: "Open in new tab", disabled: !real, action: () => ctx.openUrl(rec.url) },
        ]);
    });
    appList.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fileEl = e.target.closest(".dt-file");
        if (!fileEl) return;
        const key = fileEl.textContent.replace(/^\S+\s*/, "").trim() || fileEl.textContent.trim();
        const match = ctx.storage.keys().find((k) => fileEl.textContent.endsWith(k)) || key;
        ctx.showMenu(e.clientX, e.clientY, [
            { label: "Copy key", action: () => ctx.copy(match, "Key copied") },
            { label: "Copy value", action: () => ctx.copy(ctx.storage.get(match) || "", "Value copied") },
            "-",
            { label: "Delete", action: () => { ctx.storage.remove(match); if (appKey === match) appKey = null; renderApplication(); } },
        ]);
    });
    root.addEventListener("contextmenu", (e) => {
        if (e.target.closest("input, textarea, [contenteditable='true']")) return; // native text menu
        e.preventDefault();
    });

    // ---- events -------------------------------------------------------------------
    $$(".dt-tab").forEach((b) => b.addEventListener("click", () => showPanel(b.dataset.panel)));
    $$(".dt-subtab").forEach((b) => b.addEventListener("click", () => {
        subTab = b.dataset.sub;
        $$(".dt-subtab").forEach((x) => x.classList.toggle("active", x === b));
        renderSide();
    }));
    root.addEventListener("click", (e) => {
        const act = e.target.closest("[data-act]") && e.target.closest("[data-act]").dataset.act;
        if (act === "close") toggle(false);
        else if (act === "dock") { prefs.dock = prefs.dock === "bottom" ? "right" : "bottom"; prefs.size = prefs.dock === "bottom" ? 280 : 420; savePrefs(); applyLayout(); }
        else if (act === "pick") setPicking(!picking);
        else if (act === "console-clear") { logs.set(tabNow(), []); renderConsole(); }
        else if (act === "net-refresh") renderNetwork();
    });
    $('[data-act="console-level"]').addEventListener("change", (e) => { consoleFilter = e.target.value; renderConsole(); });
    $('[data-act="console-filter"]').addEventListener("input", (e) => { consoleText = e.target.value; renderConsole(); });
    $('[data-act="console-preserve"]').addEventListener("change", (e) => { preserve = e.target.checked; });
    let preserve = false;

    promptInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { runConsoleInput(promptInput.value); promptInput.value = ""; }
        else if (e.key === "ArrowUp") { e.preventDefault(); if (cmdIndex > 0) promptInput.value = cmdHistory[--cmdIndex]; }
        else if (e.key === "ArrowDown") { e.preventDefault(); cmdIndex = Math.min(cmdIndex + 1, cmdHistory.length); promptInput.value = cmdHistory[cmdIndex] || ""; }
        e.stopPropagation();
    });
    treeEl.addEventListener("keydown", (e) => {
        if (!selected) return;
        if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            const parent = selected.parentNode;
            if (parent && parent.nodeType === 1 && selected !== selected.ownerDocument.documentElement && selected !== selected.ownerDocument.body) {
                const next = selected.nextElementSibling || selected.previousElementSibling || parent;
                selected.remove();
                select(next);
            }
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const rows = [...treeEl.querySelectorAll(".dt-row")].filter((r) => r._node);
            const i = rows.findIndex((r) => r._node === selected);
            const next = rows[i + (e.key === "ArrowDown" ? 1 : -1)];
            if (next) select(next._node);
        }
    });

    // Resizing
    const resizer = $(".dt-resizer");
    resizer.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        resizer.setPointerCapture(e.pointerId);
        ctx.host.classList.add("dt-resizing");
        const startPos = prefs.dock === "bottom" ? e.clientY : e.clientX;
        const startSize = prefs.size;
        const move = (ev) => {
            const delta = (prefs.dock === "bottom" ? ev.clientY : ev.clientX) - startPos;
            prefs.size = Math.min(Math.max(startSize - delta, 140), prefs.dock === "bottom" ? window.innerHeight - 200 : window.innerWidth - 240);
            applyLayout();
        };
        const up = () => {
            resizer.removeEventListener("pointermove", move);
            resizer.removeEventListener("pointerup", up);
            ctx.host.classList.remove("dt-resizing");
            savePrefs();
        };
        resizer.addEventListener("pointermove", move);
        resizer.addEventListener("pointerup", up);
    });

    ctx.host.append(root);

    // ---- API used by the browser ------------------------------------------------------
    return {
        toggle,
        isOpen: () => isOpen,
        /** Open the Elements panel with `node` selected (right-click > Inspect) */
        inspect(node) { if (!isOpen) toggle(true); showPanel("elements"); select(node); },
        togglePicker: () => { if (!isOpen) toggle(true); setPicking(!picking); },
        showPanel,
        /** A tab's page started a new navigation */
        onNavigateStart(tab) {
            if (!preserve) logs.set(tab, []);
            docRecords.delete(tab);
            selectedNet = null;
            selected = null;
            setPicking(false);
        },
        /** A tab finished loading. info: { url, status, size, time, remote } */
        onLoaded(tab, info) {
            docRecords.set(tab, { name: info.name || info.url, url: info.url, status: info.status, type: "doc", size: info.size, start: 0, time: info.time, initiator: "document" });
            installConsoleHelpers(tab);
            addLog(tab, "info", [`[browser] Navigated to ${info.display || info.url}`], { source: "klh-browser" });
            if (isOpen && tab === tabNow()) { if (picking) setPicking(true); refresh(); }
        },
        onTabChanged() { setPicking(false); selected = null; selectedNet = null; sourceFile = null; refresh(); },
        /** console.* calls and errors forwarded from pages */
        log(win, level, args) {
            let tab = null;
            try { tab = (ctx.findTab && ctx.findTab(win)) || null; } catch { /* ignore */ }
            addLog(tab, level, args);
        },
        refresh,
    };
}
