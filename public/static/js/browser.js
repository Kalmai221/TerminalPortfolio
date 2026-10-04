// browser.js - simulated "KLH Browser": tabs, history, bookmarks, zoom, find, view-source, settings and developer tools

import { createDevTools } from "./devtools.js";
import { enterGui, launchSplash, exitGui } from "./transition.js";

const SITE_ROOT = "/static/browsersites";
const VERSION = "2.0.0";
const PORTFOLIO_URL = "https://klhportfolio.vercel.app";
// Real sites the browser is allowed to load in an iframe
const REMOTE_RE = /^(?:https?:\/\/)?klhportfolio\.vercel\.app(?:[/?#].*)?$/i;

const KEYS = { settings: "klh-browser-settings", bookmarks: "klh-browser-bookmarks", history: "klh-browser-history" };
const ZOOM_STEPS = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500];
const MAX_TABS = 12;

const DEFAULT_BOOKMARKS = [
    { icon: "🌐", title: "Portfolio", url: PORTFOLIO_URL },
    { icon: "📁", title: "Projects", url: `${PORTFOLIO_URL}/projects` },
    { icon: "🎓", title: "Grades", url: `${PORTFOLIO_URL}/grades` },
    { icon: "✉️", title: "Contact", url: `${PORTFOLIO_URL}/contact` },
    { icon: "🐙", title: "GitHub", url: "https://github.com/Kalmai221", external: true },
    { icon: "💼", title: "LinkedIn", url: "https://www.linkedin.com/in/kurtishopewell/", external: true },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------
//  Persistent data (all wrapped: storage can be unavailable)
// ---------------------------------------------------------------------------
const readJSON = (key, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; }
};
const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };
const loadSettings = () => ({ darkMode: false, highContrast: false, fontSize: "medium", showBookmarks: true, ...readJSON(KEYS.settings, {}) });

// Forwards console output and errors from a page to the developer tools
const PAGE_BOOTSTRAP = `<script>(function(){var p=window.parent&&window.parent.browserAPI;if(!p||!p.devLog)return;
["log","info","warn","error","debug"].forEach(function(l){var o=console[l];console[l]=function(){try{p.devLog(window,l,[].slice.call(arguments))}catch(e){}return o.apply(console,arguments)}});
window.addEventListener("error",function(e){p.devLog(window,"error",[e.message+(e.filename?" ("+e.filename.split("/").pop()+":"+e.lineno+")":"")])});
window.addEventListener("unhandledrejection",function(e){p.devLog(window,"error",["Uncaught (in promise) "+e.reason])});})();<\/script>`;

// ---------------------------------------------------------------------------
//  Entry point
// ---------------------------------------------------------------------------
export default async function openBrowser(path = "/", opts = {}) {
    if (document.querySelector(".fake-browser")) return;
    await enterGui({ fast: opts.fast, app: "KLH Browser", icon: "🧭" });
    const splash = await launchSplash({
        fast: opts.fast, title: "KLH Browser", icon: "🧭",
        steps: ["Loading profile…", "Starting renderer…", "Restoring session…", "Ready"],
    });
    initBrowserUI(path.replace(/^\/+/, ""), opts);
    splash.close();
}

// ---------------------------------------------------------------------------
//  Main UI
// ---------------------------------------------------------------------------
function initBrowserUI(initialPath, opts) {
    const port = opts.port || 8080;
    const settings = loadSettings();
    let bookmarks = readJSON(KEYS.bookmarks, DEFAULT_BOOKMARKS);
    let history = readJSON(KEYS.history, []);
    const tabs = [];
    let activeIndex = 0;

    const browser = document.createElement("div");
    browser.className = "fake-browser opening";
    browser.innerHTML = `
        <div class="browser-header">
            <div class="browser-tabs">
                <div class="tab-strip" id="tabs-container" role="tablist"></div>
                <button class="new-tab-btn" id="new-tab-btn" title="New tab" aria-label="New tab">+</button>
                <div class="window-controls">
                    <button id="close-browser-btn" class="toolbar-btn close" title="Close browser" aria-label="Close browser">×</button>
                </div>
            </div>
            <div class="browser-toolbar">
                <button id="back-btn" class="toolbar-btn" title="Back (Alt+←)" aria-label="Back" disabled>←</button>
                <button id="fwd-btn" class="toolbar-btn" title="Forward (Alt+→)" aria-label="Forward" disabled>→</button>
                <button id="refresh-btn" class="toolbar-btn" title="Reload (F5)" aria-label="Reload">⟳</button>
                <button id="home-btn" class="toolbar-btn" title="Home (Alt+Home)" aria-label="Home">⌂</button>
                <div class="omnibox">
                    <div class="url-bar-container">
                        <span class="url-icon" id="url-icon">ⓘ</span>
                        <input type="text" id="url-input" class="url-input" placeholder="Search or enter address" spellcheck="false" autocomplete="off" aria-label="Address bar" role="combobox" aria-expanded="false">
                        <button class="zoom-badge" id="zoom-badge" hidden title="Reset zoom"></button>
                        <button class="star-btn" id="star-btn" title="Bookmark this page (Ctrl+D)" aria-label="Bookmark this page">☆</button>
                    </div>
                    <div class="suggestions" id="suggestions" role="listbox" hidden></div>
                </div>
                <div class="browser-menu-container">
                    <button id="menu-btn" class="toolbar-btn" title="Menu" aria-label="Menu">⋮</button>
                    <div id="browser-dropdown" class="browser-dropdown">
                        <div class="menu-item" id="menu-newtab">New tab <span class="hint">Ctrl+T</span></div>
                        <div class="menu-item" id="menu-bookmark">Bookmark this page <span class="hint">Ctrl+D</span></div>
                        <div class="menu-item" id="menu-history">History <span class="hint">Ctrl+H</span></div>
                        <div class="menu-item" id="menu-bookmarks">Bookmarks</div>
                        <div class="menu-separator"></div>
                        <div class="menu-zoom"><span>Zoom</span>
                            <span class="zoom-ctl"><button id="zoom-out" aria-label="Zoom out">−</button><span id="zoom-val">100%</span><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-reset" aria-label="Reset zoom" title="Reset">⤢</button></span></div>
                        <div class="menu-item" id="menu-find">Find… <span class="hint">Ctrl+F</span></div>
                        <div class="menu-item" id="menu-print">Print… <span class="hint">Ctrl+P</span></div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="menu-source">View page source <span class="hint">Ctrl+U</span></div>
                        <div class="menu-item" id="menu-devtools">Developer tools <span class="hint">F12</span></div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="open-settings">Settings</div>
                        <div class="menu-item" id="menu-about">About KLH Browser</div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="menu-exit">Exit</div>
                    </div>
                </div>
            </div>
            <div class="bookmarks-bar" id="bookmarks"></div>
            <div class="loading-bar" id="loader"></div>
        </div>
        <div class="embed-notice" id="embed-notice" hidden>
            <span>If this site doesn't load, it may block being shown inside another page.</span>
            <a id="embed-open" href="#">Open in a new tab</a>
            <button id="embed-dismiss" class="embed-dismiss" title="Dismiss" aria-label="Dismiss notice">×</button>
        </div>
        <div class="browser-body" id="body">
            <div class="browser-viewport" id="viewport">
                <div class="find-bar" id="find-bar" hidden>
                    <input id="find-input" placeholder="Find in page" aria-label="Find in page" spellcheck="false">
                    <span id="find-count" class="find-count"></span>
                    <button id="find-prev" title="Previous (Shift+Enter)" aria-label="Previous match">↑</button>
                    <button id="find-next" title="Next (Enter)" aria-label="Next match">↓</button>
                    <button id="find-close" title="Close (Esc)" aria-label="Close find bar">×</button>
                </div>
            </div>
        </div>
        <div class="browser-status" id="status"></div>
        <div class="browser-toast" id="toast" hidden></div>
        <div class="context-menu" id="ctx-menu" hidden></div>
    `;
    document.body.appendChild(browser);
    browser.addEventListener("animationend", (e) => { if (e.animationName === "window-open") browser.classList.remove("opening"); });

    const $ = (sel) => browser.querySelector(sel);
    const urlInput = $("#url-input");
    const urlIcon = $("#url-icon");
    const loader = $("#loader");
    const tabsContainer = $("#tabs-container");
    const viewport = $("#viewport");
    const statusBar = $("#status");
    const embedNotice = $("#embed-notice");
    const embedOpen = $("#embed-open");
    const dropdown = $("#browser-dropdown");
    const backBtn = $("#back-btn");
    const fwdBtn = $("#fwd-btn");
    const refreshBtn = $("#refresh-btn");
    const starBtn = $("#star-btn");
    const zoomBadge = $("#zoom-badge");
    const suggestionsEl = $("#suggestions");
    const toastEl = $("#toast");
    const ctxMenu = $("#ctx-menu");
    const findBar = $("#find-bar");
    const findInput = $("#find-input");
    const findCount = $("#find-count");
    let noticeDismissed = false;
    embedOpen.target = "_blank";
    embedOpen.rel = "noopener noreferrer";
    $("#embed-dismiss").addEventListener("click", () => { noticeDismissed = true; embedNotice.hidden = true; });

    const activeTab = () => tabs[activeIndex];

    let toastTimer = null;
    const toast = (msg) => {
        toastEl.textContent = msg;
        toastEl.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
    };

    // ---- DevTools --------------------------------------------------------------
    const devtools = createDevTools({
        host: $("#body"),
        getTab: activeTab,
        showMenu: (x, y, items) => showMenu(x, y, items),
        copy: (text, msg) => copyText(text, msg),
        openUrl: (url) => window.open(new URL(url, location.href).href, "_blank", "noopener,noreferrer"),
        findTab: (win) => tabs.find((t) => { try { return t.frame.contentWindow === win; } catch { return false; } }),
        storage: {
            keys: () => { try { return Object.keys(localStorage).filter((k) => k.startsWith("klh-")).sort(); } catch { return []; } },
            get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
            set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
            remove: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
            clear: () => { try { Object.keys(localStorage).filter((k) => k.startsWith("klh-")).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } },
        },
    });

    // ---- URL parsing --------------------------------------------------------
    const internal = (path) => {
        const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
        const folder = parts[0] || "index";
        const page = (parts[1] || "index").replace(/\.html$/, "");
        if (folder === "index" && page === "index") return { kind: "browser", name: "newtab" };
        return { kind: "internal", folder, page };
    };

    const parseLocation = (input) => {
        const s = input.trim();
        if (!s) return { kind: "browser", name: "newtab" };
        const vs = s.match(/^view-source:(.*)$/i);
        if (vs) return { kind: "source", target: vs[1].trim() };
        if (/^browser:\/\//i.test(s)) return { kind: "browser", name: s.slice(10).split(/[/?#]/)[0] || "newtab" };
        const local = s.match(new RegExp(`^(?:https?://)?(?:localhost|127\\.0\\.0\\.1):${port}(?:/(.*))?$`, "i"));
        if (local) return internal(local[1] || "");
        if (REMOTE_RE.test(s)) return { kind: "remote", url: /^https?:\/\//i.test(s) ? s : `https://${s}` };
        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) || /\s/.test(s) || /\.[a-z]{2,}(\/|$)/i.test(s)) return { kind: "external", url: s };
        return internal(s);
    };

    const canonical = (loc) => {
        if (loc.kind === "source") return `view-source:${loc.target}`;
        if (loc.kind === "browser") return `browser://${loc.name}`;
        if (loc.kind === "remote") return loc.url.replace(/\/$/, "");
        if (loc.kind === "external") return /^[a-z][a-z0-9+.-]*:\/\//i.test(loc.url) ? loc.url : `http://${loc.url}`;
        return `localhost:${port}/${loc.folder}${loc.page !== "index" ? "/" + loc.page : ""}`;
    };

    // ---- Page documents -----------------------------------------------------
    const pageDoc = (body, folder = "index") => `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${SITE_ROOT}/common.css">
<link rel="stylesheet" href="${SITE_ROOT}/${folder}/style.css">
${PAGE_BOOTSTRAP}
</head><body>${body}</body></html>`;

    const errorBody = (title, message, code, url) => `
        <div class="err" data-title="${esc(title)}" data-icon="⚠️">
            <div class="err-icon">⚠️</div>
            <h1>${esc(title)}</h1>
            <p>${message}</p>
            <p class="err-url">${esc(url)}</p>
            <p class="err-code">${esc(code)}</p>
            <p><a href="browser://newtab">Go to the new tab page</a></p>
        </div>`;

    const settingsBody = () => {
        const toggle = (id, title, desc, on, keywords = "") => `
            <div class="st-row" data-search="${esc(`${title} ${desc} ${keywords}`.toLowerCase())}">
                <div class="st-text"><h3>${title}</h3><p>${desc}</p></div>
                <label class="switch"><input type="checkbox" id="${id}" ${on ? "checked" : ""} aria-label="${esc(title)}"><span class="slider"></span></label>
            </div>`;
        const themeCard = (id, label, active) => `
            <button class="theme-card ${active ? "active" : ""}" id="${id}" aria-pressed="${active}">
                <span class="theme-preview ${id === "t-dark" ? "dark" : "light"}"><i></i><i></i><i></i></span>
                <span class="theme-name">${label}</span>
            </button>`;
        const sizeBtn = (v, label) => `<button class="seg ${settings.fontSize === v ? "active" : ""}" data-size="${v}" aria-pressed="${settings.fontSize === v}">${label}</button>`;
        return `
        <div class="st" data-title="Settings" data-icon="⚙️">
            <header class="st-top">
                <h1><span class="st-logo">🧭</span> Settings</h1>
                <input id="st-search" class="st-search" type="search" placeholder="Search settings" aria-label="Search settings" autocomplete="off">
            </header>
            <div class="st-layout">
                <nav class="st-nav" aria-label="Settings sections">
                    <button class="active" data-target="appearance">🎨 Appearance</button>
                    <button data-target="accessibility">♿ Accessibility</button>
                    <button data-target="privacy">🔒 Privacy and data</button>
                    <button data-target="about">ℹ️ About</button>
                </nav>
                <main class="st-main">
                    <section id="appearance" data-sec>
                        <h2>Appearance</h2>
                        <div class="st-card">
                            <div class="st-row stack" data-search="theme dark light mode appearance">
                                <div class="st-text"><h3>Theme</h3><p>Choose how the browser and its pages look.</p></div>
                                <div class="theme-cards">${themeCard("t-light", "Light", !settings.darkMode)}${themeCard("t-dark", "Dark", settings.darkMode)}</div>
                            </div>
                            ${toggle("s-bookmarks", "Show bookmarks bar", "Keep your bookmarks under the address bar.", settings.showBookmarks, "favourites toolbar")}
                        </div>
                    </section>
                    <section id="accessibility" data-sec>
                        <h2>Accessibility</h2>
                        <div class="st-card">
                            <div class="st-row stack" data-search="font size text small medium large">
                                <div class="st-text"><h3>Font size</h3><p>Base text size for pages.</p></div>
                                <div class="segmented" role="group" aria-label="Font size">${sizeBtn("small", "Small")}${sizeBtn("medium", "Medium")}${sizeBtn("large", "Large")}</div>
                                <p class="st-preview" id="st-preview">The quick brown fox jumps over the lazy dog.</p>
                            </div>
                            ${toggle("s-contrast", "High contrast", "Increase contrast so text is easier to read.", settings.highContrast, "accessibility")}
                        </div>
                    </section>
                    <section id="privacy" data-sec>
                        <h2>Privacy and data</h2>
                        <div class="st-card">
                            <div class="st-row" data-search="history browsing clear visited pages">
                                <div class="st-text"><h3>Browsing history</h3><p id="st-history-count">Loading…</p></div>
                                <div class="st-actions"><button class="btn" id="st-open-history">View</button><button class="btn danger" id="st-clear-history">Clear</button></div>
                            </div>
                            <div class="st-row" data-search="bookmarks restore default favourites">
                                <div class="st-text"><h3>Bookmarks</h3><p id="st-bookmark-count">Loading…</p></div>
                                <div class="st-actions"><button class="btn" id="st-open-bookmarks">Manage</button><button class="btn" id="st-restore-bookmarks">Restore defaults</button></div>
                            </div>
                            <div class="st-row" data-search="cookies tracking analytics privacy">
                                <div class="st-text"><h3>Cookies and tracking</h3><p>This browser doesn't set cookies or track you. Settings, bookmarks and history stay in your own browser's storage.</p></div>
                                <span class="st-badge">Always on</span>
                            </div>
                        </div>
                    </section>
                    <section id="about" data-sec>
                        <h2>About</h2>
                        <div class="st-card">
                            <div class="st-row" data-search="about version reset defaults">
                                <div class="st-text"><h3>KLH Browser ${VERSION}</h3><p>Simulated, 64-bit. See keyboard shortcuts and build info.</p></div>
                                <div class="st-actions"><button class="btn" id="st-about">About</button><button class="btn danger" id="st-reset">Reset all settings</button></div>
                            </div>
                        </div>
                    </section>
                    <p class="st-empty" id="st-empty" hidden>No settings match your search.</p>
                </main>
            </div>
            <div class="st-toast" id="st-toast" hidden></div>
            <script>
                const api = window.parent.browserAPI;
                const $ = (s) => document.querySelector(s);
                const $$ = (s) => [...document.querySelectorAll(s)];
                let toastTimer;
                const saved = (msg) => { const t = $("#st-toast"); t.textContent = msg || "Saved"; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 1600); };
                const counts = () => {
                    const h = api.getHistory().length, b = api.getBookmarks().length;
                    $("#st-history-count").textContent = h ? h + (h === 1 ? " page visited" : " pages visited") : "No history yet.";
                    $("#st-bookmark-count").textContent = b + (b === 1 ? " bookmark" : " bookmarks");
                };
                counts();

                // Theme cards
                const setTheme = (dark) => {
                    api.updateSetting("darkMode", dark);
                    $("#t-light").classList.toggle("active", !dark); $("#t-dark").classList.toggle("active", dark);
                    $("#t-light").setAttribute("aria-pressed", String(!dark)); $("#t-dark").setAttribute("aria-pressed", String(dark));
                    saved(dark ? "Dark theme on" : "Light theme on");
                };
                $("#t-light").onclick = () => setTheme(false);
                $("#t-dark").onclick = () => setTheme(true);

                // Switches
                $("#s-bookmarks").onchange = (e) => { api.updateSetting("showBookmarks", e.target.checked); saved(); };
                $("#s-contrast").onchange = (e) => { api.updateSetting("highContrast", e.target.checked); saved(); };

                // Font size
                $$(".seg").forEach((b) => b.onclick = () => {
                    api.updateSetting("fontSize", b.dataset.size);
                    $$(".seg").forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
                    saved("Font size: " + b.textContent);
                });

                // Data actions
                $("#st-clear-history").onclick = () => { api.clearHistory(); counts(); saved("History cleared"); };
                $("#st-restore-bookmarks").onclick = () => { api.restoreBookmarks(); counts(); saved("Default bookmarks restored"); };
                $("#st-open-history").onclick = () => api.navigate("browser://history");
                $("#st-open-bookmarks").onclick = () => api.navigate("browser://bookmarks");
                $("#st-about").onclick = () => api.navigate("browser://about");
                $("#st-reset").onclick = () => { api.resetSettings(); location.reload(); };

                // Sidebar navigation + highlight the section in view
                $$(".st-nav button").forEach((b) => b.onclick = () => document.getElementById(b.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" }));
                if ("IntersectionObserver" in window) {
                    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
                        if (en.isIntersecting) $$(".st-nav button").forEach((b) => b.classList.toggle("active", b.dataset.target === en.target.id));
                    }), { rootMargin: "-10% 0px -70% 0px" });
                    $$("[data-sec]").forEach((s) => io.observe(s));
                }

                // Search
                $("#st-search").oninput = (e) => {
                    const q = e.target.value.trim().toLowerCase();
                    let any = false;
                    $$("[data-sec]").forEach((sec) => {
                        let shown = 0;
                        sec.querySelectorAll(".st-row").forEach((row) => {
                            const hit = !q || row.dataset.search.includes(q);
                            row.hidden = !hit;
                            if (hit) shown++;
                        });
                        sec.hidden = q && !shown;
                        if (shown) any = true;
                    });
                    $("#st-empty").hidden = !q || any;
                };
            <\/script>
        </div>`;
    };

    const aboutBody = () => {
        const groups = [
            ["Navigation", [["F5 / Ctrl+R", "Reload"], ["Ctrl+L / F6", "Focus the address bar"], ["Alt+← / Alt+→", "Back / Forward"], ["Alt+Home", "Home page"], ["Esc", "Stop loading"]]],
            ["Tabs", [["Ctrl+T", "New tab"], ["Ctrl+W", "Close tab"], ["Ctrl+Shift+T", "Reopen closed tab"], ["Ctrl+PageUp / PageDown", "Switch tab"], ["Alt+1 – 9", "Jump to tab"]]],
            ["Page", [["Ctrl+F", "Find in page"], ["Ctrl+D", "Bookmark this page"], ["Ctrl+H", "History"], ["Ctrl++ / Ctrl+− / Ctrl+0", "Zoom in / out / reset"], ["Ctrl+P", "Print"], ["Right-click", "Context menu"]]],
            ["Developer", [["F12 / Ctrl+Shift+I", "Developer tools"], ["Ctrl+Shift+C", "Inspect an element"], ["Ctrl+U", "View page source"]]],
        ];
        return `
        <div class="ab" data-title="About KLH Browser" data-icon="🧭">
            <section class="ab-hero">
                <div class="ab-logo">🧭</div>
                <div>
                    <h1>KLH Browser</h1>
                    <p class="ab-version">Version ${VERSION} (Official build) (64-bit)</p>
                    <p class="ab-status" id="ab-status"><span class="ab-dot ok"></span> KLH Browser is up to date</p>
                </div>
                <button class="btn ab-check" id="ab-check">Check for updates</button>
            </section>

            <section class="ab-card">
                <div class="ab-card-head"><h2>Build and system</h2><button class="btn" id="ab-copy">Copy details</button></div>
                <dl class="ab-info" id="ab-info"></dl>
            </section>

            <section class="ab-card">
                <h2>Keyboard shortcuts</h2>
                <div class="ab-groups">
                    ${groups.map(([title, rows]) => `
                        <div class="ab-group"><h3>${esc(title)}</h3>
                            ${rows.map(([k, v]) => `<div class="ab-key"><span>${esc(v)}</span><kbd>${esc(k)}</kbd></div>`).join("")}
                        </div>`).join("")}
                </div>
            </section>

            <section class="ab-card">
                <h2>Links</h2>
                <div class="ab-links">
                    <a class="ab-link" href="https://github.com/Kalmai221/TerminalPortfolio" target="_blank" rel="noopener noreferrer">💻 Source code</a>
                    <a class="ab-link" href="${PORTFOLIO_URL}">🌐 Portfolio</a>
                    <a class="ab-link" href="browser://settings">⚙️ Settings</a>
                    <a class="ab-link" href="browser://history">🕘 History</a>
                    <a class="ab-link" href="browser://bookmarks">⭐ Bookmarks</a>
                </div>
            </section>

            <p class="ab-foot">Built by Kurtis-Lee Hopewell with vanilla JavaScript. Runs entirely inside your browser.</p>

            <script>
                const $ = (s) => document.querySelector(s);
                const parent = window.parent;
                const storageKb = () => { let n = 0; try { Object.keys(localStorage).filter((k) => k.startsWith("klh-")).forEach((k) => { n += k.length + (localStorage.getItem(k) || "").length; }); } catch (e) {} return (n * 2 / 1024).toFixed(1) + " kB"; };
                const info = [
                    ["Version", "${VERSION} (Official build)"],
                    ["Engine", "KLH Engine 1.0 (simulated)"],
                    ["Platform", navigator.platform || "unknown"],
                    ["User agent", navigator.userAgent],
                    ["Language", navigator.language],
                    ["Time zone", Intl.DateTimeFormat().resolvedOptions().timeZone],
                    ["Screen", screen.width + " × " + screen.height + " @ " + (window.devicePixelRatio || 1) + "x"],
                    ["Viewport", parent.innerWidth + " × " + parent.innerHeight],
                    ["Network", navigator.onLine ? "Online" : "Offline"],
                    ["Local storage used", storageKb()],
                ];
                const dl = $("#ab-info");
                info.forEach(function (row) {
                    const dt = document.createElement("dt"); dt.textContent = row[0];
                    const dd = document.createElement("dd"); dd.textContent = row[1];
                    dl.append(dt, dd);
                });
                $("#ab-copy").onclick = function () {
                    const text = info.map(function (r) { return r[0] + ": " + r[1]; }).join("\\n");
                    const done = function () { $("#ab-copy").textContent = "Copied!"; setTimeout(function () { $("#ab-copy").textContent = "Copy details"; }, 1500); };
                    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
                    function fallback() { const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
                };
                $("#ab-check").onclick = function () {
                    const status = $("#ab-status"), btn = $("#ab-check");
                    btn.disabled = true;
                    status.innerHTML = '<span class="ab-spin"></span> Checking for updates…';
                    setTimeout(function () {
                        status.innerHTML = '<span class="ab-dot ok"></span> KLH Browser is up to date';
                        btn.disabled = false;
                    }, 1400);
                };
            <\/script>
        </div>`;
    };

    const historyBody = () => `
        <div class="settings" data-title="History" data-icon="🕘">
            <h1>History</h1>
            <p><button id="h-clear" class="btn">Clear browsing data</button></p>
            <div id="h-list"></div>
            <script>
                const api = window.parent.browserAPI;
                const list = document.getElementById("h-list");
                const draw = () => {
                    const items = api.getHistory();
                    list.innerHTML = items.length ? "" : "<p>No history yet.</p>";
                    items.forEach(function (h) {
                        const row = document.createElement("div");
                        row.className = "list-row";
                        const t = document.createElement("span"); t.className = "when"; t.textContent = new Date(h.time).toLocaleTimeString("en-GB", {hour:"2-digit", minute:"2-digit"});
                        const a = document.createElement("a"); a.href = h.url; a.textContent = h.title || h.url;
                        a.onclick = function (e) { e.preventDefault(); api.navigate(h.url); };
                        const u = document.createElement("span"); u.className = "url"; u.textContent = h.url;
                        row.append(t, a, u); list.append(row);
                    });
                };
                document.getElementById("h-clear").onclick = function () { api.clearHistory(); draw(); };
                draw();
            <\/script>
        </div>`;

    const bookmarksBody = () => `
        <div class="settings" data-title="Bookmarks" data-icon="⭐">
            <h1>Bookmarks</h1>
            <div id="b-list"></div>
            <script>
                const api = window.parent.browserAPI;
                const list = document.getElementById("b-list");
                const draw = () => {
                    const items = api.getBookmarks();
                    list.innerHTML = items.length ? "" : "<p>No bookmarks. Press Ctrl+D on a page to add one.</p>";
                    items.forEach(function (b) {
                        const row = document.createElement("div");
                        row.className = "list-row";
                        const i = document.createElement("span"); i.textContent = b.icon || "⭐";
                        const a = document.createElement("a"); a.href = b.url; a.textContent = b.title;
                        a.onclick = function (e) { e.preventDefault(); api.navigate(b.url); };
                        const u = document.createElement("span"); u.className = "url"; u.textContent = b.url;
                        const x = document.createElement("button"); x.className = "btn"; x.textContent = "Remove";
                        x.onclick = function () { api.removeBookmark(b.url); draw(); };
                        row.append(i, a, u, x); list.append(row);
                    });
                };
                draw();
            <\/script>
        </div>`;

    const sourceBody = (title, html) => `
        <div class="viewsource" data-title="${esc(title)}" data-icon="📄">
            ${html.split("\n").map((l, i) => `<div class="line"><span class="ln">${i + 1}</span><span class="lc">${esc(l) || " "}</span></div>`).join("")}
        </div>`;

    const fetchSite = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
    };

    // Build the full HTML document for a location. Returns { html, status, docUrl }
    const buildPage = async (loc) => {
        if (loc.kind === "browser") {
            const pages = { settings: settingsBody, about: aboutBody, history: historyBody, bookmarks: bookmarksBody };
            if (pages[loc.name]) return { html: pageDoc(pages[loc.name]()), status: 200, docUrl: `browser://${loc.name}` };
            if (loc.name === "newtab") {
                const docUrl = `${SITE_ROOT}/index/index.html`;
                return { html: pageDoc(await fetchSite(docUrl), "index"), status: 200, docUrl };
            }
            return { html: pageDoc(errorBody("This page can't be found", "That browser:// page doesn't exist.", "ERR_UNKNOWN_URL_SCHEME", `browser://${loc.name}`)), status: 404, docUrl: `browser://${loc.name}` };
        }
        if (loc.kind === "external") {
            const docUrl = `${SITE_ROOT}/offline/index.html`;
            const raw = await fetchSite(docUrl);
            const safeUrl = JSON.stringify(canonical(loc)).replace(/</g, "\\u003c");
            return { html: pageDoc(raw.replace('"{{URL}}"', () => safeUrl), "offline"), status: 200, docUrl };
        }
        if (loc.kind === "source") {
            const target = parseLocation(loc.target);
            if (target.kind === "remote" || target.kind === "external") {
                return { html: pageDoc(errorBody("Can't show the source", "The source of another site's page isn't available here. Open it in a new tab and use the browser's own tools.", "VIEW_SOURCE_UNAVAILABLE", loc.target)), status: 200, docUrl: "view-source" };
            }
            const inner = await buildPage(target);
            return { html: pageDoc(sourceBody(`view-source:${loc.target}`, inner.html), "index"), status: 200, docUrl: "view-source" };
        }
        const docUrl = `${SITE_ROOT}/${loc.folder}/${loc.page}.html`;
        try {
            return { html: pageDoc(await fetchSite(docUrl), loc.folder), status: 200, docUrl };
        } catch {
            return { html: pageDoc(errorBody("404 Not Found", "The requested page doesn't exist on this server.", "HTTP ERROR 404", canonical(loc))), status: 404, docUrl };
        }
    };

    // ---- Settings application ----------------------------------------------
    const applyToFrame = (frame) => {
        let doc = null;
        try { doc = frame && frame.contentDocument; } catch { /* cross-origin */ }
        if (!doc || !doc.documentElement) return;
        doc.documentElement.dataset.theme = settings.darkMode ? "dark" : "light";
        doc.documentElement.style.fontSize = { small: "14px", medium: "16px", large: "20px" }[settings.fontSize];
        doc.documentElement.style.filter = settings.highContrast ? "contrast(1.4)" : "";
    };

    const applyChrome = () => {
        browser.classList.toggle("dark-mode-theme", settings.darkMode);
        $("#bookmarks").hidden = !settings.showBookmarks;
    };

    const saveBookmarks = () => { writeJSON(KEYS.bookmarks, bookmarks); renderBookmarks(); updateStar(); };

    window.browserAPI = {
        getSettings: () => settings,
        updateSetting: (key, value) => {
            settings[key] = value;
            writeJSON(KEYS.settings, settings);
            applyChrome();
            tabs.forEach((t) => applyToFrame(t.frame));
        },
        navigate: (url) => navigate(url),
        resetSettings: () => {
            Object.assign(settings, { darkMode: false, highContrast: false, fontSize: "medium", showBookmarks: true });
            writeJSON(KEYS.settings, settings);
            applyChrome();
            tabs.forEach((t) => applyToFrame(t.frame));
        },
        restoreBookmarks: () => { bookmarks = DEFAULT_BOOKMARKS.map((b) => ({ ...b })); saveBookmarks(); },
        getBookmarks: () => bookmarks.map((b) => ({ ...b })),
        removeBookmark: (url) => { bookmarks = bookmarks.filter((b) => b.url !== url); saveBookmarks(); },
        getHistory: () => history.slice(0, 200).map((h) => ({ ...h })),
        clearHistory: () => { history = []; writeJSON(KEYS.history, history); },
        devLog: (win, level, args) => devtools.log(win, level, args),
    };
    applyChrome();

    // ---- Loading indicator ---------------------------------------------------
    let loaderTimer = null;
    const startLoading = (tab) => {
        tab.loading = true;
        renderTabs();
        if (tab !== activeTab()) return;
        refreshBtn.textContent = "✕";
        refreshBtn.title = "Stop loading (Esc)";
        clearTimeout(loaderTimer);
        loader.style.transition = "none";
        loader.style.opacity = "1";
        loader.style.width = "0%";
        void loader.offsetWidth; // restart the transition
        loader.style.transition = "";
        loader.style.width = "65%";
    };
    const finishLoading = (tab) => {
        tab.loading = false;
        renderTabs();
        if (tab !== activeTab()) return;
        refreshBtn.textContent = "⟳";
        refreshBtn.title = "Reload (F5)";
        loader.style.width = "100%";
        loaderTimer = setTimeout(() => { loader.style.opacity = "0"; loader.style.width = "0%"; }, 250);
    };

    // ---- Zoom -----------------------------------------------------------------
    const applyZoom = (tab) => {
        const z = tab.zoom / 100;
        Object.assign(tab.frame.style, { transformOrigin: "0 0", transform: z === 1 ? "" : `scale(${z})`, width: `${100 / z}%`, height: `${100 / z}%` });
        if (tab === activeTab()) {
            zoomBadge.hidden = tab.zoom === 100;
            zoomBadge.textContent = `🔍 ${tab.zoom}%`;
            $("#zoom-val").textContent = `${tab.zoom}%`;
        }
    };
    const changeZoom = (dir) => {
        const t = activeTab();
        let i = ZOOM_STEPS.indexOf(t.zoom);
        if (i < 0) i = ZOOM_STEPS.indexOf(100);
        t.zoom = dir === 0 ? 100 : ZOOM_STEPS[Math.min(Math.max(i + dir, 0), ZOOM_STEPS.length - 1)];
        applyZoom(t);
    };

    // ---- Navigation ----------------------------------------------------------
    const isBookmarkable = (url) => url && url !== "browser://newtab" && !url.startsWith("view-source:");
    function updateStar() {
        const t = activeTab();
        const url = t && t.history[t.index];
        const marked = !!url && bookmarks.some((b) => b.url === url);
        starBtn.textContent = marked ? "★" : "☆";
        starBtn.classList.toggle("on", marked);
        starBtn.disabled = !isBookmarkable(url);
    }

    function syncToolbar() {
        const t = activeTab();
        if (!t) return;
        const url = t.history[t.index] || "";
        if (document.activeElement !== urlInput) urlInput.value = url === "browser://newtab" ? "" : url;
        urlIcon.textContent = url.startsWith("browser://") || url.startsWith("view-source:") ? "⚙" : url.startsWith("localhost") ? "ⓘ" : t.remote ? "🔒" : "⚠";
        backBtn.disabled = t.index <= 0;
        fwdBtn.disabled = t.index >= t.history.length - 1;
        embedNotice.hidden = !t.remote || noticeDismissed;
        embedOpen.href = t.remote || "#";
        refreshBtn.textContent = t.loading ? "✕" : "⟳";
        applyZoom(t);
        updateStar();
    }

    const navigate = async (input, { push = true, tab = activeTab() } = {}) => {
        const loc = typeof input === "string" ? parseLocation(input) : input;
        const url = canonical(loc);
        const navId = ++tab.navId;
        statusBar.classList.remove("show");
        startLoading(tab);
        devtools.onNavigateStart(tab);
        if (tab === activeTab()) urlInput.value = loc.kind === "browser" && loc.name === "newtab" ? "" : url;

        await sleep(loc.kind === "external" ? 700 : 100 + Math.random() * 120);
        if (navId !== tab.navId || !tabs.includes(tab)) return;
        tab.remote = loc.kind === "remote" ? url : null;
        const t0 = performance.now();
        let page = { status: 200, docUrl: url, html: "" };

        if (loc.kind === "remote") {
            // Real site in an iframe: wait for it to load, but don't hang forever
            await new Promise((resolve) => {
                const done = () => { clearTimeout(timer); resolve(); };
                const timer = setTimeout(done, 8000);
                tab.frame.addEventListener("load", done, { once: true });
                tab.frame.removeAttribute("srcdoc");
                tab.frame.src = loc.url;
            });
        } else {
            page = await buildPage(loc);
            if (navId !== tab.navId || !tabs.includes(tab)) return; // a newer navigation took over
            await new Promise((resolve) => {
                tab.frame.addEventListener("load", resolve, { once: true });
                tab.frame.srcdoc = page.html;
            });
        }
        if (navId !== tab.navId || !tabs.includes(tab)) return;

        let doc = null;
        try { doc = loc.kind === "remote" ? null : tab.frame.contentDocument; } catch { /* ignore */ }
        const marker = doc && doc.querySelector("[data-title]");
        tab.title = loc.kind === "remote" ? "Kurtis-Lee Hopewell" : marker ? marker.dataset.title : "Untitled";
        tab.icon = loc.kind === "remote" ? "🌐" : marker && marker.dataset.icon ? marker.dataset.icon : "📄";

        if (push) {
            tab.history = tab.history.slice(0, tab.index + 1);
            tab.history.push(url);
            tab.index = tab.history.length - 1;
            if (isBookmarkable(url) && loc.kind !== "external") {
                history = [{ url, title: tab.title, time: Date.now() }, ...history.filter((h) => h.url !== url)].slice(0, 200);
                writeJSON(KEYS.history, history);
            }
        }

        wireFrame(tab, loc);
        applyToFrame(tab.frame);
        applyZoom(tab);
        finishLoading(tab);
        if (findBar.hidden === false) runFind(false, true);
        devtools.onLoaded(tab, { url: page.docUrl, name: (page.docUrl || url).split("/").pop() || url, display: url, status: page.status, size: page.html ? new Blob([page.html]).size : null, time: performance.now() - t0 });
        if (tab === activeTab()) syncToolbar();
    };

    const stopLoading = (tab = activeTab()) => {
        if (!tab || !tab.loading) return;
        tab.navId++;
        finishLoading(tab);
        if (tab === activeTab()) syncToolbar();
    };
    const go = (delta) => {
        const t = activeTab();
        const target = t.index + delta;
        if (target < 0 || target >= t.history.length) return;
        t.index = target;
        syncToolbar();
        navigate(t.history[t.index], { push: false });
    };
    const reload = () => { const t = activeTab(); if (t.loading) return stopLoading(t); if (t.history[t.index]) navigate(t.history[t.index], { push: false }); };
    const goHome = () => navigate(PORTFOLIO_URL);

    // Links, hover status and shortcuts inside a loaded page
    const wireFrame = (tab, loc) => {
        let doc = null;
        try { doc = loc.kind === "remote" ? null : tab.frame.contentDocument; } catch { /* ignore */ }
        if (!doc) return;
        const baseFolder = loc.kind === "internal" ? loc.folder : "index";
        const isLocalAbsolute = (h) => new RegExp(`^(https?://)?(localhost|127\\.0\\.0\\.1):${port}`, "i").test(h);

        // returns null for real external links the browser should leave alone
        const resolveHref = (href) => {
            if (REMOTE_RE.test(href)) return href; // my portfolio opens inside the browser
            if (/^(https?:)?\/\//i.test(href) && !isLocalAbsolute(href)) return null;
            if (/^(mailto:|tel:)/i.test(href)) return null;
            if (/^(browser:\/\/|view-source:)/i.test(href) || isLocalAbsolute(href)) return href;
            if (href.startsWith("/")) return href.slice(1);
            if (!href.includes("/") && !href.includes(":")) return `${baseFolder}/${href}`;
            return href;
        };

        doc.addEventListener("click", (e) => {
            dropdown.classList.remove("show");
            hideSuggestions();
            hideMenu();
            const a = e.target.closest && e.target.closest("a[href]");
            if (!a) return;
            const href = a.getAttribute("href");
            if (href.startsWith("#")) return;
            const target = resolveHref(href);
            if (target === null) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                return;
            }
            e.preventDefault();
            navigate(target, { tab });
        });
        doc.addEventListener("mouseover", (e) => {
            const a = e.target.closest && e.target.closest("a[href]");
            if (!a) return;
            const target = resolveHref(a.getAttribute("href"));
            statusBar.textContent = target === null ? a.href : canonical(parseLocation(target));
            statusBar.classList.add("show");
        });
        doc.addEventListener("mouseout", () => statusBar.classList.remove("show"));
        doc.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            statusBar.classList.remove("show");
            const fr = tab.frame.getBoundingClientRect();
            const z = tab.zoom / 100;
            const x = fr.left + e.clientX * z;
            const y = fr.top + e.clientY * z;
            const target = e.target;
            const a = target.closest && target.closest("a[href]");
            const img = target.closest && target.closest("img");
            const field = target.closest && target.closest("input, textarea, [contenteditable='true']");
            const selection = (doc.getSelection && doc.getSelection().toString().trim()) || "";
            const items = [];

            if (a) {
                const t = resolveHref(a.getAttribute("href"));
                const open = (inNewTab) => {
                    if (t === null) window.open(a.href, "_blank", "noopener,noreferrer");
                    else if (inNewTab) createTab(t);
                    else navigate(t, { tab });
                };
                items.push(
                    { label: "Open link", action: () => open(false) },
                    { label: "Open link in new tab", action: () => open(true) },
                    { label: "Copy link address", action: () => copyText(t === null ? a.href : canonical(parseLocation(t)), "Link copied") },
                    "-");
            }
            if (img) {
                items.push(
                    { label: "Open image in new tab", action: () => window.open(img.src, "_blank", "noopener,noreferrer") },
                    { label: "Copy image address", action: () => copyText(img.src, "Image address copied") },
                    "-");
            }
            if (field) {
                items.push(
                    { label: "Cut", hint: "Ctrl+X", disabled: !selection, action: () => doc.execCommand("cut") },
                    { label: "Copy", hint: "Ctrl+C", disabled: !selection, action: () => doc.execCommand("copy") },
                    { label: "Paste", hint: "Ctrl+V", action: () => navigator.clipboard.readText().then((text) => { field.focus(); doc.execCommand("insertText", false, text); }).catch(() => toast("Allow clipboard access to paste")) },
                    { label: "Select all", hint: "Ctrl+A", action: () => { field.focus(); if (field.select) field.select(); else doc.execCommand("selectAll"); } },
                    "-");
            } else if (selection) {
                items.push(
                    { label: "Copy", hint: "Ctrl+C", action: () => doc.execCommand("copy") },
                    { label: "Select all", hint: "Ctrl+A", action: () => doc.execCommand("selectAll") },
                    "-");
            }
            if (!a && !img && !field && !selection) {
                items.push(
                    { label: "Back", hint: "Alt+←", disabled: tab.index <= 0, action: () => go(-1) },
                    { label: "Forward", hint: "Alt+→", disabled: tab.index >= tab.history.length - 1, action: () => go(1) },
                    { label: "Reload", hint: "F5", action: reload },
                    "-",
                    { label: "Bookmark this page", hint: "Ctrl+D", disabled: !isBookmarkable(tab.history[tab.index]), action: toggleBookmark },
                    { label: "Print…", hint: "Ctrl+P", action: printPage },
                    { label: "Select all", hint: "Ctrl+A", action: () => doc.execCommand("selectAll") },
                    "-",
                    { label: "View page source", hint: "Ctrl+U", disabled: tab.history[tab.index] && tab.history[tab.index].startsWith("view-source:"), action: viewSource },
                    "-");
            }
            items.push({ label: "Inspect", hint: "F12", action: () => devtools.inspect(target) });
            showMenu(x, y, items);
        });
        doc.addEventListener("keydown", onKey);
    };

    // ---- Tabs ----------------------------------------------------------------
    const renderTabs = () => {
        tabsContainer.innerHTML = "";
        tabs.forEach((tab, index) => {
            const el = document.createElement("div");
            el.className = `tab${index === activeIndex ? " active" : ""}${tab.loading ? " loading" : ""}`;
            el.setAttribute("role", "tab");
            el.setAttribute("aria-selected", String(index === activeIndex));
            el.title = `${tab.title}\n${tab.history[tab.index] || ""}`;
            el.innerHTML = `
                <span class="tab-icon">${tab.loading ? "⟳" : esc(tab.icon)}</span>
                <span class="tab-label">${esc(tab.title)}</span>
                <span class="tab-close" aria-label="Close tab">×</span>`;
            el.addEventListener("click", (e) => {
                if (e.target.classList.contains("tab-close")) return;
                switchTab(index);
            });
            el.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); closeTab(index); } });
            el.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); showTabMenu(e, index); });
            el.querySelector(".tab-close").addEventListener("click", (e) => { e.stopPropagation(); closeTab(index); });
            tabsContainer.appendChild(el);
        });
    };

    const createTab = (input) => {
        if (tabs.length >= MAX_TABS) { toast(`Too many tabs open (max ${MAX_TABS})`); return Promise.resolve(); }
        const frame = document.createElement("iframe");
        frame.className = "browser-frame";
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox");
        frame.title = "Page content";
        viewport.appendChild(frame);
        const tab = { frame, history: [], index: -1, title: "New Tab", icon: "✨", loading: false, navId: 0, remote: null, zoom: 100 };
        tabs.push(tab);
        switchTab(tabs.length - 1);
        return navigate(input, { tab });
    };

    function switchTab(index) {
        if (index < 0 || index >= tabs.length) return;
        activeIndex = index;
        tabs.forEach((t, i) => t.frame.classList.toggle("active", i === index));
        renderTabs();
        syncToolbar();
        clearTimeout(loaderTimer);
        loader.style.opacity = "0";
        loader.style.width = "0%";
        devtools.onTabChanged();
        if (findBar.hidden === false) runFind(false, true);
    }

    function closeTab(index) {
        if (tabs.length === 1) return closeBrowser();
        const [removed] = tabs.splice(index, 1);
        if (removed.history[removed.index]) closedTabs.push(removed.history[removed.index]);
        removed.frame.remove();
        switchTab(Math.min(activeIndex > index ? activeIndex - 1 : activeIndex, tabs.length - 1));
    }

    const duplicateTab = (index) => {
        const t = tabs[index];
        createTab(t.history[t.index] || "browser://newtab");
    };

    // ---- Context menus ---------------------------------------------------------
    let menuIndex = -1;
    function hideMenu() { ctxMenu.hidden = true; menuIndex = -1; }
    function showMenu(x, y, items) {
        ctxMenu.innerHTML = "";
        items.forEach((it) => {
            if (it === "-") {
                const sep = document.createElement("div");
                sep.className = "menu-separator";
                ctxMenu.appendChild(sep);
                return;
            }
            const d = document.createElement("div");
            d.className = `menu-item${it.disabled ? " disabled" : ""}`;
            d.setAttribute("role", "menuitem");
            d.innerHTML = `<span class="mi-check">${it.checked ? "✓" : ""}</span><span class="mi-label">${esc(it.label)}</span>${it.hint ? `<span class="hint">${esc(it.hint)}</span>` : ""}`;
            if (!it.disabled) d.addEventListener("click", (e) => { e.stopPropagation(); hideMenu(); it.action(); });
            ctxMenu.appendChild(d);
        });
        ctxMenu.hidden = false;
        const r = ctxMenu.getBoundingClientRect();
        ctxMenu.style.left = `${Math.max(4, Math.min(x, window.innerWidth - r.width - 6))}px`;
        ctxMenu.style.top = `${Math.max(4, Math.min(y, window.innerHeight - r.height - 6))}px`;
        menuIndex = -1;
    }

    async function copyText(text, message = "Copied to clipboard") {
        try { await navigator.clipboard.writeText(text); }
        catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.cssText = "position:fixed;opacity:0";
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); } catch { /* ignore */ }
            ta.remove();
        }
        toast(message);
    }

    const closedTabs = [];
    const reopenTab = () => { const url = closedTabs.pop(); if (url) createTab(url); else toast("No recently closed tabs"); };

    function showTabMenu(e, index) {
        const t = tabs[index];
        showMenu(e.clientX, e.clientY + 6, [
            { label: "New tab", hint: "Ctrl+T", action: () => createTab("browser://newtab") },
            { label: "Reload", hint: "F5", action: () => { switchTab(index); reload(); } },
            { label: "Duplicate", action: () => duplicateTab(index) },
            { label: "Copy page address", action: () => copyText(t.history[t.index] || "") },
            "-",
            { label: "Close tab", hint: "Ctrl+W", action: () => closeTab(index) },
            { label: "Close other tabs", disabled: tabs.length < 2, action: () => {
                const keep = tabs[index];
                tabs.filter((x) => x !== keep).forEach((x) => x.frame.remove());
                tabs.splice(0, tabs.length, keep);
                switchTab(0);
            } },
            { label: "Close tabs to the right", disabled: index >= tabs.length - 1, action: () => {
                tabs.splice(index + 1).forEach((x) => x.frame.remove());
                switchTab(Math.min(activeIndex, index));
            } },
            "-",
            { label: "Reopen closed tab", hint: "Ctrl+Shift+T", disabled: !closedTabs.length, action: reopenTab },
        ]);
    }

    // ---- Find in page ----------------------------------------------------------
    function runFind(backwards = false, recount = false) {
        const t = activeTab();
        const q = findInput.value;
        let win = null, doc = null;
        try { win = !t.remote && t.frame.contentWindow; doc = !t.remote && t.frame.contentDocument; } catch { /* ignore */ }
        if (!win || !doc || !doc.body) { findCount.textContent = t.remote ? "Can't search this page" : ""; return; }
        if (!q) { findCount.textContent = ""; try { win.getSelection().removeAllRanges(); } catch { /* ignore */ } return; }
        const text = (doc.body.innerText || "").toLowerCase();
        let count = 0;
        for (let i = text.indexOf(q.toLowerCase()); i !== -1; i = text.indexOf(q.toLowerCase(), i + q.length)) count++;
        findCount.textContent = count ? `${count} match${count === 1 ? "" : "es"}` : "No matches";
        if (!recount && count && typeof win.find === "function") win.find(q, false, backwards, true, false, false, false);
    }
    const openFind = () => {
        findBar.hidden = false;
        findInput.focus();
        findInput.select();
        runFind(false, true);
    };
    const closeFind = () => {
        findBar.hidden = true;
        try { activeTab().frame.contentWindow.getSelection().removeAllRanges(); } catch { /* ignore */ }
    };
    findInput.addEventListener("input", () => runFind(false));
    findInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); runFind(e.shiftKey); }
        else if (e.key === "Escape") closeFind();
        e.stopPropagation();
    });
    $("#find-next").addEventListener("click", () => runFind(false));
    $("#find-prev").addEventListener("click", () => runFind(true));
    $("#find-close").addEventListener("click", closeFind);

    // ---- Misc actions ----------------------------------------------------------
    const toggleBookmark = () => {
        const t = activeTab();
        const url = t.history[t.index];
        if (!isBookmarkable(url)) return;
        if (bookmarks.some((b) => b.url === url)) {
            bookmarks = bookmarks.filter((b) => b.url !== url);
            toast("Bookmark removed");
        } else {
            bookmarks.push({ icon: t.icon, title: t.title, url, external: false });
            toast("Bookmark added");
        }
        saveBookmarks();
    };
    const viewSource = () => { const t = activeTab(); const url = t.history[t.index]; if (url && !url.startsWith("view-source:")) createTab(`view-source:${url}`); };
    const printPage = () => {
        const t = activeTab();
        try { if (t.remote) throw new Error("cross-origin"); t.frame.contentWindow.focus(); t.frame.contentWindow.print(); }
        catch { toast("Open this page in a new tab to print it"); }
    };

    // ---- Closing -------------------------------------------------------------
    let closing = false;
    async function closeBrowser() {
        if (closing) return;
        closing = true;
        document.removeEventListener("keydown", onKey);
        delete window.browserAPI;
        await exitGui({ browser, fast: opts.fast, command: "klh-browser" });
    }

    // ---- Shortcuts -----------------------------------------------------------
    function onKey(e) {
        const k = e.key;
        const key = k.length === 1 ? k.toLowerCase() : k;
        const ctrl = e.ctrlKey || e.metaKey;
        const done = () => e.preventDefault();
        if (!ctxMenu.hidden && (k === "ArrowDown" || k === "ArrowUp" || k === "Enter")) {
            done();
            const items = [...ctxMenu.querySelectorAll(".menu-item:not(.disabled)")];
            if (!items.length) return;
            if (k === "Enter") { if (items[menuIndex]) items[menuIndex].click(); return; }
            menuIndex = menuIndex < 0 ? (k === "ArrowDown" ? 0 : items.length - 1) : (menuIndex + (k === "ArrowDown" ? 1 : -1) + items.length) % items.length;
            items.forEach((n, i) => n.classList.toggle("focus", i === menuIndex));
            return;
        }
        if (k === "F5" || (ctrl && key === "r")) { done(); reload(); }
        else if ((ctrl && key === "l") || k === "F6") { done(); urlInput.focus(); urlInput.select(); }
        else if (e.altKey && k === "ArrowLeft") { done(); go(-1); }
        else if (e.altKey && k === "ArrowRight") { done(); go(1); }
        else if (e.altKey && k === "Home") { done(); goHome(); }
        else if (k === "F12" || (ctrl && e.shiftKey && key === "i")) { done(); devtools.toggle(); }
        else if (ctrl && e.shiftKey && key === "c") { done(); devtools.togglePicker(); }
        else if (ctrl && key === "f") { done(); openFind(); }
        else if (ctrl && key === "d") { done(); toggleBookmark(); }
        else if (ctrl && key === "h") { done(); createTab("browser://history"); }
        else if (ctrl && key === "u") { done(); viewSource(); }
        else if (ctrl && key === "p") { done(); printPage(); }
        else if (ctrl && (k === "+" || k === "=")) { done(); changeZoom(1); }
        else if (ctrl && (k === "-" || k === "_")) { done(); changeZoom(-1); }
        else if (ctrl && k === "0") { done(); changeZoom(0); }
        else if (ctrl && e.shiftKey && key === "t") { done(); reopenTab(); }
        else if (ctrl && key === "t") { done(); createTab("browser://newtab"); }
        else if (ctrl && key === "w") { done(); closeTab(activeIndex); }
        else if (ctrl && k === "PageDown") { done(); switchTab((activeIndex + 1) % tabs.length); }
        else if (ctrl && k === "PageUp") { done(); switchTab((activeIndex - 1 + tabs.length) % tabs.length); }
        else if (e.altKey && /^[1-9]$/.test(k)) { done(); switchTab(Math.min(Number(k) - 1, tabs.length - 1)); }
        else if (k === "Escape") {
            dropdown.classList.remove("show");
            ctxMenu.hidden = true;
            hideSuggestions();
            if (!findBar.hidden) closeFind();
            else stopLoading();
        }
    }
    document.addEventListener("keydown", onKey);

    // ---- Omnibox suggestions -----------------------------------------------------
    let suggestIndex = -1;
    let suggestItems = [];
    function hideSuggestions() { suggestionsEl.hidden = true; urlInput.setAttribute("aria-expanded", "false"); suggestIndex = -1; }
    function showSuggestions() {
        const q = urlInput.value.trim().toLowerCase();
        if (!q) return hideSuggestions();
        const pool = [
            ...bookmarks.map((b) => ({ icon: "⭐", title: b.title, url: b.url })),
            ...history.slice(0, 50).map((h) => ({ icon: "🕘", title: h.title || h.url, url: h.url })),
        ];
        const seen = new Set();
        const matches = pool.filter((p) => (p.title + " " + p.url).toLowerCase().includes(q) && !seen.has(p.url) && seen.add(p.url)).slice(0, 5);
        suggestItems = [{ icon: "🔎", title: `Go to or search for "${urlInput.value.trim()}"`, url: urlInput.value.trim() }, ...matches];
        suggestionsEl.innerHTML = "";
        suggestItems.forEach((s, i) => {
            const row = document.createElement("div");
            row.className = "suggestion";
            row.setAttribute("role", "option");
            row.innerHTML = `<span class="sg-icon">${esc(s.icon)}</span><span class="sg-title">${esc(s.title)}</span>${i ? `<span class="sg-url">${esc(s.url)}</span>` : ""}`;
            row.addEventListener("mousedown", (e) => { e.preventDefault(); hideSuggestions(); urlInput.blur(); navigate(s.url); });
            suggestionsEl.appendChild(row);
        });
        suggestIndex = -1;
        suggestionsEl.hidden = false;
        urlInput.setAttribute("aria-expanded", "true");
    }
    const highlightSuggestion = () => [...suggestionsEl.children].forEach((c, i) => c.classList.toggle("active", i === suggestIndex));

    urlInput.addEventListener("input", showSuggestions);
    urlInput.addEventListener("focus", () => urlInput.select());
    urlInput.addEventListener("blur", () => { setTimeout(hideSuggestions, 120); syncToolbar(); });
    urlInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" && !suggestionsEl.hidden) { e.preventDefault(); suggestIndex = (suggestIndex + 1) % suggestItems.length; highlightSuggestion(); }
        else if (e.key === "ArrowUp" && !suggestionsEl.hidden) { e.preventDefault(); suggestIndex = (suggestIndex - 1 + suggestItems.length) % suggestItems.length; highlightSuggestion(); }
        else if (e.key === "Enter") {
            const target = suggestIndex > 0 ? suggestItems[suggestIndex].url : urlInput.value;
            hideSuggestions();
            navigate(target);
            urlInput.blur();
        } else if (e.key === "Escape") { hideSuggestions(); syncToolbar(); urlInput.blur(); }
        e.stopPropagation();
    });

    // ---- Chrome wiring -------------------------------------------------------
    backBtn.addEventListener("click", () => go(-1));
    fwdBtn.addEventListener("click", () => go(1));
    refreshBtn.addEventListener("click", reload);
    $("#home-btn").addEventListener("click", goHome);
    $("#new-tab-btn").addEventListener("click", () => createTab("browser://newtab"));
    $("#close-browser-btn").addEventListener("click", closeBrowser);
    starBtn.addEventListener("click", toggleBookmark);
    zoomBadge.addEventListener("click", () => changeZoom(0));
    tabsContainer.addEventListener("dblclick", (e) => { if (e.target === tabsContainer) createTab("browser://newtab"); });

    $("#menu-btn").addEventListener("click", (e) => { e.stopPropagation(); dropdown.classList.toggle("show"); });
    browser.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target.id !== "menu-btn") dropdown.classList.remove("show");
        if (!ctxMenu.contains(e.target)) ctxMenu.hidden = true;
    });
    const menu = (id, fn) => $(id).addEventListener("click", () => { dropdown.classList.remove("show"); fn(); });
    menu("#menu-newtab", () => createTab("browser://newtab"));
    menu("#menu-bookmark", toggleBookmark);
    menu("#menu-history", () => createTab("browser://history"));
    menu("#menu-bookmarks", () => createTab("browser://bookmarks"));
    menu("#menu-find", openFind);
    menu("#menu-print", printPage);
    menu("#menu-source", viewSource);
    menu("#menu-devtools", () => devtools.toggle());
    menu("#open-settings", () => createTab("browser://settings"));
    menu("#menu-about", () => createTab("browser://about"));
    menu("#menu-exit", closeBrowser);
    $("#zoom-in").addEventListener("click", (e) => { e.stopPropagation(); changeZoom(1); });
    $("#zoom-out").addEventListener("click", (e) => { e.stopPropagation(); changeZoom(-1); });
    $("#zoom-reset").addEventListener("click", (e) => { e.stopPropagation(); changeZoom(0); });

    // Bookmarks bar
    function renderBookmarks() {
        const bar = $("#bookmarks");
        bar.innerHTML = "";
        bookmarks.forEach((b) => {
            const btn = document.createElement("button");
            btn.className = "bookmark";
            btn.title = b.url;
            btn.innerHTML = `<span>${esc(b.icon || "⭐")}</span><span>${esc(b.title)}</span>`;
            btn.addEventListener("click", () => {
                if (b.external) window.open(b.url, "_blank", "noopener,noreferrer");
                else navigate(b.url);
            });
            btn.addEventListener("auxclick", (e) => { if (e.button === 1 && !b.external) { e.preventDefault(); createTab(b.url); } });
            btn.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const open = (inNewTab) => { if (b.external) window.open(b.url, "_blank", "noopener,noreferrer"); else if (inNewTab) createTab(b.url); else navigate(b.url); };
                showMenu(e.clientX, e.clientY, [
                    { label: "Open", action: () => open(false) },
                    { label: "Open in new tab", action: () => open(true) },
                    "-",
                    { label: "Rename…", action: () => { const name = window.prompt("Bookmark name", b.title); if (name && name.trim()) { b.title = name.trim(); saveBookmarks(); } } },
                    { label: "Copy link address", action: () => copyText(b.url, "Link copied") },
                    { label: "Delete", action: () => { bookmarks = bookmarks.filter((x) => x !== b); saveBookmarks(); toast("Bookmark removed"); } },
                ]);
            });
            bar.appendChild(btn);
        });
    }
    renderBookmarks();

    // Right-click on the toolbar, tab strip, bookmarks bar and the back/forward buttons
    const isEditable = (n) => n && n.closest && n.closest("input, textarea, [contenteditable='true']");
    const toggleBookmarksBar = () => window.browserAPI.updateSetting("showBookmarks", !settings.showBookmarks);

    browser.addEventListener("contextmenu", (e) => {
        if (isEditable(e.target)) return; // keep the native cut/copy/paste menu in text fields
        e.preventDefault();
        if (e.target.closest(".devtools")) return;
        if (e.target.closest("#bookmarks")) {
            const t = activeTab();
            showMenu(e.clientX, e.clientY, [
                { label: "Bookmark this page", hint: "Ctrl+D", disabled: !isBookmarkable(t && t.history[t.index]), action: toggleBookmark },
                { label: "Bookmark manager", action: () => createTab("browser://bookmarks") },
                "-",
                { label: "Show bookmarks bar", checked: settings.showBookmarks, action: toggleBookmarksBar },
            ]);
        } else if (e.target.closest(".browser-header")) {
            showMenu(e.clientX, e.clientY, [
                { label: "New tab", hint: "Ctrl+T", action: () => createTab("browser://newtab") },
                { label: "Reopen closed tab", hint: "Ctrl+Shift+T", disabled: !closedTabs.length, action: reopenTab },
                "-",
                { label: "Show bookmarks bar", checked: settings.showBookmarks, action: toggleBookmarksBar },
                { label: "Developer tools", hint: "F12", action: () => devtools.toggle() },
                { label: "Settings", action: () => createTab("browser://settings") },
            ]);
        }
    });

    const historyMenu = (dir) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const t = activeTab();
        const items = [];
        for (let i = t.index + dir, n = 0; i >= 0 && i < t.history.length && n < 10; i += dir, n++) {
            const idx = i;
            items.push({ label: t.history[idx], action: () => { t.index = idx; syncToolbar(); navigate(t.history[idx], { push: false }); } });
        }
        if (!items.length) return;
        const r = e.currentTarget.getBoundingClientRect();
        showMenu(r.left, r.bottom + 4, items);
    };
    backBtn.addEventListener("contextmenu", historyMenu(-1));
    fwdBtn.addEventListener("contextmenu", historyMenu(1));

    // Start
    createTab(initialPath || PORTFOLIO_URL);
}
