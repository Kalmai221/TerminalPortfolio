// browser.js

let isBrowserInstalled = false;

export default async function openBrowser(path = "/") {
    const output = document.getElementById("output");

    // 1. Install Simulation
    if (!isBrowserInstalled) {
        await runInstallationSimulation(output);
        isBrowserInstalled = true;
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    initBrowserUI(cleanPath);
}

// --- INSTALLATION ANIMATION ---
async function runInstallationSimulation(output) {
    const container = document.createElement("div");
    container.className = "command-output";
    output.appendChild(container);

    const packages = ["kalbrowser-core", "lib-render-engine", "common-styles", "dev-tools-eruda"];

    addLog(container, "Resolving dependencies...");
    await sleep(400);

    for (let pkg of packages) {
        const line = addLog(container, `Unpacking ${pkg}...`);
        for (let i = 0; i <= 5; i++) {
            if (line) line.textContent = `Unpacking ${pkg}... [${"#".repeat(i)}${".".repeat(5-i)}]`;
            await sleep(80);
        }
        if (line) line.textContent = `Setting up ${pkg}... [OK]`;
    }

    addLog(container, "Starting browser sub-system...");
    await sleep(600);
}

// --- MAIN BROWSER LOGIC ---
function initBrowserUI(initialPath) {
    const terminalElem = document.getElementById("terminal");
    if (terminalElem) terminalElem.style.display = "none";

    const browser = document.createElement("div");
    browser.className = "fake-browser fullscreen";

    // 1. STATE MANAGEMENT (Now supports Multiple Tabs)
    const state = {
        tabs: [
            // Tab Structure: { history: [], currentIndex: -1, title: "Loading...", isLoading: false }
        ],
        activeTabIndex: 0, // Which tab is currently visible
        settings: {
            darkMode: false,
            highContrast: false,
            fontSize: 'medium'
        }
    };

    // Initialize first tab
    state.tabs.push({ history: [], currentIndex: -1, title: "Loading...", isLoading: false });

    // 2. STYLES
    // Note: We use the CSS file for styling, but ensure classes match style.css
    browser.innerHTML = `
        <div class="browser-header">
            <div class="browser-tabs" id="tabs-container">
                </div>
            <div class="browser-toolbar">
                <button id="back-btn" class="toolbar-btn" disabled>←</button>
                <button id="fwd-btn" class="toolbar-btn" disabled>→</button>
                <button id="refresh-btn" class="toolbar-btn">⟳</button>

                <div class="url-bar-container">
                    <input type="text" id="url-input" class="url-input" placeholder="Search or enter address">
                </div>

                <div class="browser-menu-container">
                     <button id="menu-btn" class="toolbar-btn">⋮</button>

                     <div id="browser-dropdown" class="browser-dropdown">
                        <div class="menu-item disabled">New Tab <span style="color:#888">Ctrl+T</span></div>
                        <div class="menu-item disabled">History <span style="color:#888">Ctrl+H</span></div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="open-settings">⚙️ Settings</div>
                        <div class="menu-item" id="activate-eruda">Developer Tools <span style="color:#888">F12</span></div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="menu-exit">Exit</div>
                     </div>

                     <button id="close-browser-btn" class="toolbar-btn close" style="color:red; margin-left: 5px;">×</button>
                </div>
            </div>
            <div class="loading-bar" id="loader"></div>
        </div>
        <iframe id="content-frame" class="browser-frame" sandbox="allow-scripts allow-same-origin allow-forms allow-modals"></iframe>
    `;

    document.body.appendChild(browser);

    // References
    const iframe = browser.querySelector("#content-frame");
    const urlInput = browser.querySelector("#url-input");
    const loader = browser.querySelector("#loader");
    const tabsContainer = browser.querySelector("#tabs-container");
    const menuBtn = browser.querySelector("#menu-btn");
    const dropdown = browser.querySelector("#browser-dropdown");
    const backBtn = browser.querySelector("#back-btn");
    const fwdBtn = browser.querySelector("#fwd-btn");

    // --- 3. TAB MANAGEMENT SYSTEM ---

    const renderTabs = () => {
        tabsContainer.innerHTML = ""; // Clear current tabs

        state.tabs.forEach((tab, index) => {
            const tabEl = document.createElement("div");
            tabEl.className = `tab ${index === state.activeTabIndex ? 'active' : ''}`;

            // Icon logic
            let icon = "📄";
            if (tab.title === "Settings") icon = "⚙️";
            if (tab.title === "No Internet") icon = "🦖";
            if (tab.title === "Loading...") icon = "✨";

            tabEl.innerHTML = `
                <span class="tab-icon">${icon}</span>
                <span class="tab-label">${tab.title}</span>
                <span class="tab-close" data-index="${index}">×</span>
            `;

            // Switch Tab Click
            tabEl.addEventListener("click", (e) => {
                if(e.target.classList.contains("tab-close")) return; // Don't switch if closing
                switchTab(index);
            });

            // Close Tab Click
            tabEl.querySelector(".tab-close").addEventListener("click", (e) => {
                e.stopPropagation();
                closeTab(index);
            });

            tabsContainer.appendChild(tabEl);
        });
    };

    const createNewTab = (url) => {
        // Add new tab state
        state.tabs.push({ history: [], currentIndex: -1, title: "New Tab", isLoading: false });
        // Switch to it
        switchTab(state.tabs.length - 1);
        // Navigate
        handleNavigation(url, true);
    };

    const switchTab = (index) => {
        if (index < 0 || index >= state.tabs.length) return;

        state.activeTabIndex = index;
        renderTabs();

        const activeTab = state.tabs[index];

        // If tab has history, load the current URL. If brand new, URL bar is empty.
        if (activeTab.currentIndex >= 0) {
            const url = activeTab.history[activeTab.currentIndex];
            // Load without adding to history (it's already there)
            handleNavigation(url, false);
        } else {
            // Empty tab state
            urlInput.value = "";
            iframe.srcdoc = "";
        }
    };

    const closeTab = (index) => {
        // Prevent closing the last tab (just reset it instead)
        if (state.tabs.length === 1) {
            handleNavigation("index/index", true);
            return;
        }

        state.tabs.splice(index, 1);

        // Adjust active index
        if (state.activeTabIndex >= index) {
            state.activeTabIndex = Math.max(0, state.activeTabIndex - 1);
        }

        switchTab(state.activeTabIndex);
    };

    const updateTabTitle = (title) => {
        const activeTab = state.tabs[state.activeTabIndex];
        activeTab.title = title;
        renderTabs();
    };

    // --- 4. NAVIGATION LOGIC (Updated for Tabs) ---

    const handleNavigation = (inputUrl, addToHistory) => {
        const activeTab = state.tabs[state.activeTabIndex];

        // 1. Settings (Opens in current tab if typed, or via menu)
        if (inputUrl === "browser://settings" || inputUrl === "settings") {
            loadSettingsPage(addToHistory);
            return;
        }

        // 2. Local vs External
        const isLocal = inputUrl.includes("localhost:8080");

        if (isLocal) {
            const splitKey = "8080/";
            const pathPart = inputUrl.includes(splitKey) ? inputUrl.split(splitKey)[1] : "";
            const safePath = pathPart || "index/index";
            loadInternalPage(safePath, addToHistory);
        } else if (!inputUrl.includes(".") && !inputUrl.includes("://")) {
            loadInternalPage(inputUrl, addToHistory);
        } else {
            loadExternalError(inputUrl, addToHistory);
        }
    };

    // --- 5. PAGE LOADERS ---

    const loadSettingsPage = async (addToHistory) => {
        const activeTab = state.tabs[state.activeTabIndex];
        if (activeTab.isLoading) return;
        activeTab.isLoading = true;

        loader.style.width = "100%";
        urlInput.value = "browser://settings";
        updateTabTitle("Settings");

        const s = state.settings;

        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; transition: background 0.2s; }
                    h1 { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
                    input[type="checkbox"] { transform: scale(1.3); cursor: pointer; }
                </style>
            </head>
            <body>
                <h1>Settings</h1>
                <div class="setting-row">
                    <div><h3>Dark Mode</h3></div>
                    <input type="checkbox" ${s.darkMode ? 'checked' : ''} onchange="update('darkMode', this.checked)">
                </div>
                <div class="setting-row">
                    <div><h3>High Contrast</h3></div>
                    <input type="checkbox" ${s.highContrast ? 'checked' : ''} onchange="update('highContrast', this.checked)">
                </div>
                <script>function update(k, v) { window.parent.browserAPI.updateSetting(k, v); }</script>
            </body>
            </html>
        `;

        setTimeout(() => { applySettingsToIframe(); finishLoading(); }, 100);

        if (addToHistory) {
            activeTab.history.push("browser://settings");
            activeTab.currentIndex++;
        }
    };

    const loadInternalPage = async (pathKey, addToHistory = true) => {
        const activeTab = state.tabs[state.activeTabIndex];
        if (activeTab.isLoading) return;
        activeTab.isLoading = true;

        loader.style.width = "30%";
        loader.style.opacity = "1";
        updateTabTitle("Loading...");

        const parts = pathKey.split("/").filter(p => p);
        const folder = parts[0] || "index";
        const page = parts[1] || "index";
        const displayUrl = `localhost:8080/${folder}/${page}`;
        urlInput.value = displayUrl;

        await sleep(400);
        loader.style.width = "70%";

        try {
            const htmlPath = `/static/browsersites/${folder}/${page}.html`;
            const cssPath = `/static/browsersites/${folder}/style.css`;
            const jsPath = `/static/browsersites/${folder}/script.js`;

            const res = await fetch(htmlPath);
            if (!res.ok) throw new Error("404");
            const htmlContent = await res.text();

            iframe.srcdoc = `
                <!DOCTYPE html>
                <html><head><style>body{font-family:sans-serif;padding:20px;transition:background 0.3s}</style>
                <link rel="stylesheet" href="${cssPath}">
                <script src="//cdn.jsdelivr.net/npm/eruda"><\/script></head>
                <body><div id="app">${htmlContent}</div><script src="${jsPath}"><\/script></body></html>
            `;

            updateTabTitle(page.charAt(0).toUpperCase() + page.slice(1));
            iframe.onload = () => applySettingsToIframe();
            setTimeout(applySettingsToIframe, 100);

            if (addToHistory) {
                activeTab.history.push(displayUrl);
                activeTab.currentIndex++;
            }
        } catch (e) {
            renderInternalError(iframe, e.message);
        } finally {
            finishLoading();
        }
    };

    const loadExternalError = async (url, addToHistory = true) => {
        const activeTab = state.tabs[state.activeTabIndex];
        if (activeTab.isLoading) return;
        activeTab.isLoading = true;
        loader.style.width = "40%";
        updateTabTitle("Resolving...");
        await sleep(800);

        loader.style.width = "100%";
        urlInput.value = url;

        // (Simplified Dino Game HTML for brevity - insert full version here)
        iframe.srcdoc = `<html><body><h1 style="font-family:sans-serif;margin-top:50px;text-align:center">No Internet</h1></body></html>`;

        updateTabTitle("No Internet");
        if (addToHistory) {
            activeTab.history.push(url);
            activeTab.currentIndex++;
        }
        finishLoading();
    };

    const finishLoading = () => {
        loader.style.width = "100%";
        setTimeout(() => { loader.style.opacity = "0"; loader.style.width = "0%"; }, 200);
        state.tabs[state.activeTabIndex].isLoading = false;
        renderTabs(); // Ensure title updates are reflected
    };

    // --- 6. THEME & SETTINGS HELPERS ---

    const applySettingsToIframe = () => {
        const win = iframe.contentWindow;
        if (!win || !win.document || !win.document.body) return;

        const s = state.settings;
        win.document.body.style.fontSize = { small: '14px', medium: '16px', large: '20px' }[s.fontSize];

        if (s.darkMode) {
            win.document.body.style.backgroundColor = "#202124";
            win.document.body.style.color = "#e8eaed";
        } else {
            win.document.body.style.backgroundColor = "#ffffff";
            win.document.body.style.color = "#202124";
        }
        win.document.body.style.filter = s.highContrast ? "contrast(150%)" : "none";
    };

    const updateBrowserTheme = () => {
        if (state.settings.darkMode) browser.classList.add('dark-mode-theme');
        else browser.classList.remove('dark-mode-theme');
    };

    window.browserAPI = {
        getSettings: () => state.settings,
        updateSetting: (key, value) => {
            state.settings[key] = value;
            updateBrowserTheme();
            applySettingsToIframe();
        }
    };

    // --- 7. EVENT LISTENERS ---

    // Toggle Menu
    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); dropdown.classList.toggle("show"); });
    document.addEventListener("click", (e) => { if(!dropdown.contains(e.target) && e.target !== menuBtn) dropdown.classList.remove("show"); });

    // Open Settings in NEW TAB
    browser.querySelector("#open-settings").addEventListener("click", () => {
        dropdown.classList.remove("show");
        createNewTab("browser://settings"); // <--- THIS IS THE KEY CHANGE
    });

    // Close Browser
    const closeBrowser = () => { browser.remove(); if(terminalElem) terminalElem.style.display="flex"; };
    browser.querySelector("#close-browser-btn").addEventListener("click", closeBrowser);
    browser.querySelector("#menu-exit").addEventListener("click", closeBrowser);

    // Refresh & Input
    browser.querySelector("#refresh-btn").addEventListener("click", () => {
        const activeTab = state.tabs[state.activeTabIndex];
        if(activeTab.history[activeTab.currentIndex]) handleNavigation(activeTab.history[activeTab.currentIndex], false);
    });

    urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleNavigation(urlInput.value.trim(), true);
            urlInput.blur();
        }
    });

    // Start!
    renderTabs();
    handleNavigation(initialPath, true);
}

// Helpers
function renderInternalError(iframe, msg) { iframe.srcdoc = `Error: ${msg}`; }
function addLog(container, text) {
    const div = document.createElement("div");
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }