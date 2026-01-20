// browser.js

// State to track if we've already "installed" the browser in this session
let isBrowserInstalled = false;

export default async function openBrowser(path = "/") {
    const output = document.getElementById("output");

    // 1. Install Simulation (Runs only once)
    if (!isBrowserInstalled) {
        await runInstallationSimulation(output);
        isBrowserInstalled = true;
    }

    // 2. Initialize Browser UI
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
            line.textContent = `Unpacking ${pkg}... [${"#".repeat(i)}${".".repeat(5-i)}]`;
            await sleep(80);
        }
        line.textContent = `Setting up ${pkg}... [OK]`;
    }

    addLog(container, "Starting browser sub-system...");
    await sleep(600);
}

// --- MAIN BROWSER LOGIC ---
function initBrowserUI(initialPath) {
    // Hide Terminal
    const terminalElem = document.getElementById("terminal");
    if (terminalElem) terminalElem.style.display = "none";

    // Create Browser Container
    const browser = document.createElement("div");
    browser.className = "fake-browser fullscreen";

    // Internal State
    const state = {
        history: [],
        currentIndex: -1,
        isLoading: false
    };

    // Inject Styles for the new Menu
    const menuStyles = `
        <style>
            .browser-menu-container { position: relative; display: flex; align-items: center; gap: 5px; }
            .browser-dropdown {
                position: absolute; top: 100%; right: 0; width: 200px;
                background: white; border: 1px solid #ccc; border-radius: 4px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
                display: none; flex-direction: column; padding: 5px 0; margin-top: 5px;
            }
            .browser-dropdown.show { display: flex; }
            .menu-item {
                padding: 8px 16px; font-size: 13px; color: #333; cursor: pointer;
                display: flex; justify-content: space-between;
            }
            .menu-item:hover { background: #f1f3f4; }
            .menu-item.disabled { color: #aaa; cursor: default; }
            .menu-separator { height: 1px; background: #e0e0e0; margin: 4px 0; }
            .menu-icon { font-size: 16px; line-height: 1; }
        </style>
    `;

    browser.innerHTML = `
        ${menuStyles}
        <div class="browser-header">
            <div class="browser-tabs">
                <div class="tab active">
                    <span class="tab-icon">✨</span>
                    <span class="tab-label">Loading...</span>
                    <span class="tab-close">×</span>
                </div>
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
                        <div class="menu-item disabled">New Tab <span style="color:#999">Ctrl+T</span></div>
                        <div class="menu-item disabled">History <span style="color:#999">Ctrl+H</span></div>
                        <div class="menu-item disabled">Downloads <span style="color:#999">Ctrl+J</span></div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="dev-tools-item">More tools &nbsp; ▶</div>
                        <div class="menu-item" id="activate-eruda">Developer Tools <span style="color:#999">F12</span></div>
                        <div class="menu-separator"></div>
                        <div class="menu-item" id="menu-exit">Exit</div>
                     </div>

                     <button id="close-browser-btn" class="toolbar-btn close" style="color:red; margin-left: 5px;">×</button>
                </div>
            </div>
            <div class="loading-bar" id="loader"></div>
        </div>
        <iframe id="content-frame" class="browser-frame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
    `;

    document.body.appendChild(browser);

    // References
    const iframe = browser.querySelector("#content-frame");
    const urlInput = browser.querySelector("#url-input");
    const loader = browser.querySelector("#loader");
    const tabLabel = browser.querySelector(".tab-label");
    const menuBtn = browser.querySelector("#menu-btn");
    const dropdown = browser.querySelector("#browser-dropdown");

    // --- EVENT LISTENERS ---

    // 1. Menu Toggle
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!browser.contains(e.target)) return;
        if (!dropdown.contains(e.target) && e.target !== menuBtn) {
            dropdown.classList.remove("show");
        }
    });

    // 2. Developer Tools (Eruda) Trigger
    browser.querySelector("#activate-eruda").addEventListener("click", () => {
        dropdown.classList.remove("show");
        const win = iframe.contentWindow;

        if (win && win.eruda) {
            // 
            if (!win.eruda._isInit) {
                win.eruda.init({
                    tool: ['console', 'elements', 'network', 'resources', 'info'],
                    autoScale: true,
                    defaults: { displaySize: 50, theme: 'Dracula' }
                });
            }
            win.eruda.show();
        } else {
            alert("Developer Tools not loaded yet. Please wait for the page to finish loading.");
        }
    });

    // 3. Close Browser (Menu Item & Button)
    const closeBrowser = () => {
        browser.remove();
        if (terminalElem) terminalElem.style.display = "flex";
    };
    browser.querySelector("#close-browser-btn").addEventListener("click", closeBrowser);
    browser.querySelector("#menu-exit").addEventListener("click", closeBrowser);

    // 4. Refresh
    browser.querySelector("#refresh-btn").addEventListener("click", () => {
        const currentUrl = state.history[state.currentIndex];
        if (currentUrl) handleNavigation(currentUrl, false);
    });

    // 5. URL Input
    urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const val = urlInput.value.trim();
            handleNavigation(val, true);
            urlInput.blur();
        }
    });

    // --- NAVIGATION CONTROLLER ---
    const handleNavigation = (inputUrl, addToHistory) => {
        const isLocal = inputUrl.includes("localhost:8080") || inputUrl.includes("127.0.0.1:8080");

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

    const loadInternalPage = async (pathKey, addToHistory = true) => {
        if (state.isLoading) return;
        state.isLoading = true;

        loader.style.width = "30%";
        loader.style.opacity = "1";
        tabLabel.textContent = "Connecting...";

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
            if (!res.ok) throw new Error(`404: Page not found (${htmlPath})`);
            const htmlContent = await res.text();

            // NOTE: Eruda is loaded but NOT initialized here.
            const docContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>body { font-family: sans-serif; padding: 20px; }</style>
                    <link rel="stylesheet" href="${cssPath}">
                    <script src="//cdn.jsdelivr.net/npm/eruda"><\/script>
                </head>
                <body>
                    <div id="app">${htmlContent}</div>
                    <script src="${jsPath}"><\/script>
                </body>
                </html>
            `;

            iframe.srcdoc = docContent;
            tabLabel.textContent = page.charAt(0).toUpperCase() + page.slice(1);

            if (addToHistory) {
                state.history.push(displayUrl);
                state.currentIndex++;
            }

        } catch (error) {
            renderInternalError(iframe, error.message);
            tabLabel.textContent = "Error";
        } finally {
            finishLoading();
        }
    };

    const loadExternalError = async (url, addToHistory = true) => {
        if (state.isLoading) return;
        state.isLoading = true;
        loader.style.width = "40%";
        tabLabel.textContent = "Resolving...";

        await sleep(800);

        loader.style.width = "100%";
        urlInput.value = url.startsWith("http") ? url : `http://${url}`;

        iframe.srcdoc = `
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; color: #5f6368; padding: 5% 20px; max-width: 600px; margin: 0 auto; user-select: none; }
                    h1 { font-size: 24px; font-weight: 500; margin-bottom: 10px; color: #202124; }
                    p { font-size: 15px; margin-bottom: 20px; }
                    .error-code { color: #5f6368; font-size: 12px; margin-top: 20px; text-transform: uppercase; }

                    /* Game Canvas Styles */
                    #game-container { width: 100%; height: 150px; position: relative; border-bottom: 1px solid #5f6368; margin-bottom: 30px; overflow: hidden; }
                    canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated; } /* Pixel art look */
                    .press-space { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; color: #5f6368; font-family: monospace; }
                </style>
            </head>
            <body>
                <div id="game-container" onclick="jump()">
                    <canvas id="game" width="600" height="150"></canvas>
                    <div id="msg" class="press-space">PRESS SPACE TO PLAY</div>
                </div>

                <h1>No internet</h1>
                <p>Try:</p>
                <ul>
                    <li>Checking the network cables, modem, and router</li>
                    <li>Reconnecting to Wi-Fi</li>
                </ul>
                <p><strong>${url}</strong>’s server IP address could not be found.</p>
                <div class="error-code">DNS_PROBE_FINISHED_NO_INTERNET</div>

                <script>
                    const canvas = document.getElementById("game");
                    const ctx = canvas.getContext("2d");
                    const msg = document.getElementById("msg");

                    // --- PIXEL ART ASSETS (0 = Empty, 1 = Filled) ---
                    // These binary maps allow us to draw real shapes without image files

                    const DINO_STAND = [
                        "000000111110",
                        "000000111111",
                        "000000111000",
                        "000000111000",
                        "000000111000", // Head
                        "100001111100",
                        "100001111100",
                        "111111111100", // Body
                        "001111111000",
                        "000111110000",
                        "000110011000", // Legs
                        "000110011000"
                    ];

                    const DINO_RUN_1 = [
                        ...DINO_STAND.slice(0, 10),
                        "000110000000", // Left leg fwd
                        "000110000000" 
                    ];

                    const DINO_RUN_2 = [
                        ...DINO_STAND.slice(0, 10),
                        "000000011000", // Right leg fwd
                        "000000011000"
                    ];

                    const CACTUS_SMALL = [
                        "00011000",
                        "00111100",
                        "01111110",
                        "11011011",
                        "11011011",
                        "11011011",
                        "11011011",
                        "00011000",
                        "00011000"
                    ];

                    // --- GAME STATE ---
                    // Scale factor makes the pixels bigger (Retro look)
                    const SCALE = 2; 
                    let dino = { x: 40, y: 110, width: 12 * SCALE, height: 12 * SCALE, dy: 0, jumpPower: -11, grounded: true, animTimer: 0 };
                    let gravity = 0.8;
                    let obstacles = [];
                    let clouds = [];
                    let frame = 0;
                    let score = 0;
                    let gameRunning = false;
                    let gameSpeed = 5;

                    // --- DRAWING HELPER ---
                    function drawSprite(ctx, map, startX, startY, color = "#535353") {
                        ctx.fillStyle = color;
                        for (let r = 0; r < map.length; r++) {
                            const row = map[r];
                            for (let c = 0; c < row.length; c++) {
                                if (row[c] === "1") {
                                    // Draw a square for each "1" in the map
                                    ctx.fillRect(startX + (c * SCALE), startY + (r * SCALE), SCALE, SCALE);
                                }
                            }
                        }
                    }

                    function start() {
                        if (gameRunning) return;
                        gameRunning = true;
                        msg.style.display = "none";
                        obstacles = [];
                        clouds = [];
                        score = 0;
                        gameSpeed = 5;
                        dino.y = 110;
                        loop();
                    }

                    function jump() {
                        if (!gameRunning) { start(); return; }
                        if (dino.grounded) {
                            dino.dy = dino.jumpPower;
                            dino.grounded = false;
                        }
                    }

                    function update() {
                        // Dino Physics
                        dino.dy += gravity;
                        dino.y += dino.dy;

                        // Ground Collision
                        const groundY = 125 - dino.height; // Floor level
                        if (dino.y > groundY) {
                            dino.y = groundY;
                            dino.dy = 0;
                            dino.grounded = true;
                        }

                        // Clouds (Background decoration)
                        if (frame % 100 === 0 && Math.random() > 0.5) {
                            clouds.push({ x: 600, y: Math.random() * 80 + 10 });
                        }
                        clouds.forEach((c, i) => {
                            c.x -= 1; // Clouds move slow
                            if (c.x < -50) clouds.splice(i, 1);
                        });

                        // Obstacles (Spawn & Move)
                        if (frame % 100 === 0) {
                            // Randomize spawn time slightly
                            if (Math.random() > 0.1) {
                                obstacles.push({ x: 600, y: 125 - (9 * SCALE), map: CACTUS_SMALL, w: 8 * SCALE, h: 9 * SCALE });
                            }
                        }

                        obstacles.forEach((obs, index) => {
                            obs.x -= gameSpeed;

                            // Hitbox Collision (Simple box overlap)
                            // We shrink the hitbox slightly (padding) to be forgiving
                            const padding = 4; 
                            if (
                                dino.x + padding < obs.x + obs.w - padding &&
                                dino.x + dino.width - padding > obs.x + padding &&
                                dino.y + padding < obs.y + obs.h - padding &&
                                dino.y + dino.height - padding > obs.y + padding
                            ) {
                                gameOver();
                            }

                            if (obs.x + obs.w < 0) obstacles.splice(index, 1);
                        });

                        // Speed up game slowly
                        if (frame % 500 === 0) gameSpeed += 0.5;

                        score++;
                        frame++;
                        dino.animTimer++;
                    }

                    function gameOver() {
                        gameRunning = false;
                        msg.textContent = "GAME OVER";
                        msg.style.display = "block";

                        // Draw "Dead" Dino eyes (optional polish)
                        // But for now we just stop
                    }

                    function draw() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // 1. Draw Clouds
                        ctx.fillStyle = "#acacac";
                        clouds.forEach(c => {
                            ctx.fillRect(c.x, c.y, 30, 8); // Simple cloud shape
                            ctx.fillRect(c.x + 10, c.y - 5, 15, 5);
                        });

                        // 2. Draw Ground Line
                        ctx.fillStyle = "#535353";
                        ctx.fillRect(0, 130, 600, 1);

                        // 3. Draw Dino (Animated)
                        let currentMap = DINO_STAND;
                        if (gameRunning) {
                             // Switch leg frame every 10 ticks
                             currentMap = (Math.floor(dino.animTimer / 10) % 2 === 0) ? DINO_RUN_1 : DINO_RUN_2;
                        }
                        // If jumping, stick to stand frame
                        if (!dino.grounded) currentMap = DINO_STAND;

                        drawSprite(ctx, currentMap, dino.x, dino.y);

                        // 4. Draw Obstacles
                        obstacles.forEach(obs => {
                            drawSprite(ctx, obs.map, obs.x, obs.y);
                        });

                        // 5. Draw Score
                        ctx.fillStyle = "#535353";
                        ctx.font = "20px monospace";
                        ctx.fillText("HI " + Math.floor(score/5).toString().padStart(5, '0'), 500, 30);
                    }

                    function loop() {
                        if (!gameRunning) return;
                        update();
                        draw();
                        requestAnimationFrame(loop);
                    }

                    // Controls
                    document.addEventListener("keydown", (e) => {
                        if (e.code === "Space" || e.code === "ArrowUp") {
                            e.preventDefault(); 
                            jump();
                        }
                    });

                    // Initial Render
                    draw();
                </script>
            </body>
            </html>
        `;

        tabLabel.textContent = "No Internet";
        if (addToHistory) {
            state.history.push(url);
            state.currentIndex++;
        }
        finishLoading();
    };

    const finishLoading = () => {
        loader.style.width = "100%";
        setTimeout(() => { loader.style.opacity = "0"; loader.style.width = "0%"; }, 200);
        state.isLoading = false;
    };

    handleNavigation(initialPath, true);
}

// Helpers
function renderInternalError(iframe, msg) {
    iframe.srcdoc = `
        <div style="font-family:monospace; color:#333; text-align:center; margin-top:50px;">
            <h1>404 Not Found (Internal)</h1>
            <p>Could not load local resource.</p>
            <p style="color:red; font-size:0.8em">${msg}</p>
        </div>
    `;
}

function addLog(container, text) {
    const div = document.createElement("div");
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}