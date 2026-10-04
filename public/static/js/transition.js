// transition.js - CLI <-> GUI hand-off: terminal fades out, a tiny compositor boots, a desktop with a dock
// appears and the app window opens from the dock. exitGui() plays the same thing in reverse.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reducedMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

let session = null;   // the .gui-session overlay (desktop) while a GUI app is running
let clockTimer = null;

const clockText = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Terminal -> desktop. Resolves once the desktop is visible and the dock icon has bounced. */
export async function enterGui({ fast = false, app = "KLH Browser", icon = "🧭" } = {}) {
    const instant = fast || reducedMotion();
    const terminal = document.getElementById("terminal");

    // 1. The terminal fades and shrinks away
    if (terminal && !instant) {
        terminal.classList.add("tx-exit");
        await sleep(280);
    }
    if (terminal) {
        terminal.style.display = "none";
        terminal.classList.remove("tx-exit");
    }

    // 2. Black screen while the "compositor" starts
    session = document.createElement("div");
    session.className = "gui-session";
    session.innerHTML = `
        <pre class="gui-boot" aria-hidden="true"></pre>
        <div class="gui-desktop" hidden>
            <div class="gui-panel">
                <span class="gui-activities">Activities</span>
                <span class="gui-clock">${clockText()}</span>
                <span class="gui-tray" aria-hidden="true">🔊 📶 🔋</span>
            </div>
            <div class="gui-dock" aria-hidden="true">
                <div class="gui-dock-icon" title="Files">📁</div>
                <div class="gui-dock-icon app" title="${app}">${icon}<i class="gui-dot"></i></div>
                <div class="gui-dock-icon" title="Settings">⚙️</div>
            </div>
            <div class="gui-toast" hidden></div>
        </div>`;
    document.body.appendChild(session);

    const boot = session.querySelector(".gui-boot");
    if (!instant) {
        const lines = [
            "klh-wm 1.0 (Wayland) starting on tty1",
            "[  OK  ] Output eDP-1: 1920x1080 @ 60.00 Hz",
            "[  OK  ] Loading session \"portfolio\"",
            "[  OK  ] Starting compositor",
            `[  OK  ] Launching ${app}`,
        ];
        for (const line of lines) {
            boot.textContent += line + "\n";
            await sleep(100 + Math.random() * 90);
        }
        await sleep(160);
    }

    // 3. Desktop with panel + dock
    boot.hidden = true;
    const desktop = session.querySelector(".gui-desktop");
    desktop.hidden = false;
    session.classList.add("show-desktop");
    clockTimer = setInterval(() => {
        const c = session && session.querySelector(".gui-clock");
        if (c) c.textContent = clockText();
    }, 20000);

    // 4. App icon bounces in the dock while it "launches"
    const dockIcon = session.querySelector(".gui-dock-icon.app");
    if (!instant) {
        dockIcon.classList.add("bounce");
        await sleep(650);
        dockIcon.classList.remove("bounce");
    }
    dockIcon.classList.add("running");
}

/** Small "app is starting" window over the desktop. Resolves with a handle whose close() fades it out. */
export async function launchSplash({ fast = false, title = "KLH Browser", icon = "🧭", steps = [] } = {}) {
    const instant = fast || reducedMotion();
    if (instant) return { close() {} };

    const splash = document.createElement("div");
    splash.className = "app-splash";
    splash.innerHTML = `
        <div class="app-splash-logo">${icon}</div>
        <div class="app-splash-title">${title}</div>
        <div class="app-splash-bar"><div></div></div>
        <div class="app-splash-status"></div>`;
    document.body.appendChild(splash);
    const status = splash.querySelector(".app-splash-status");
    const bar = splash.querySelector(".app-splash-bar > div");
    for (let i = 0; i < steps.length; i++) {
        status.textContent = steps[i];
        bar.style.width = `${((i + 1) / steps.length) * 100}%`;
        await sleep(200 + Math.random() * 120);
    }
    return {
        close() {
            splash.classList.add("fade");
            setTimeout(() => splash.remove(), 260);
        },
    };
}

/** Desktop -> terminal. Closes `browser`, plays the reverse animation and restores the shell. */
export async function exitGui({ browser = null, fast = false, command = "klh-browser" } = {}) {
    const instant = fast || reducedMotion();
    const terminal = document.getElementById("terminal");

    // The window shrinks back toward the dock
    if (browser) {
        if (!instant) {
            browser.classList.add("closing");
            await sleep(230);
        }
        browser.remove();
    }

    // Brief look at the empty desktop with a notification, then it fades out
    if (session && !instant) {
        const toast = session.querySelector(".gui-toast");
        const dockIcon = session.querySelector(".gui-dock-icon.app");
        if (dockIcon) dockIcon.classList.remove("running");
        if (toast) {
            toast.textContent = `${command} closed`;
            toast.hidden = false;
        }
        await sleep(650);
        session.classList.add("leaving");
        await sleep(300);
    }
    clearInterval(clockTimer);
    clockTimer = null;
    if (session) session.remove();
    session = null;

    // Terminal comes back with a job-control style note above the prompt
    if (terminal) {
        const out = document.getElementById("output");
        if (out) {
            const prompts = out.querySelectorAll(".line-wrapper");
            const prompt = prompts[prompts.length - 1];
            const note = document.createElement("div");
            note.style.color = "#6272a4";
            note.textContent = `[1]+  Done                    ${command}`;
            if (prompt) out.insertBefore(note, prompt);
            else out.appendChild(note);
        }
        terminal.style.display = "flex";
        if (!instant) {
            terminal.classList.add("tx-enter");
            setTimeout(() => terminal.classList.remove("tx-enter"), 320);
        }
        terminal.scrollTop = terminal.scrollHeight;
    }
}
