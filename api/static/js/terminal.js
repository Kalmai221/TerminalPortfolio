// --- CONFIGURATION ---
const CONFIG = {
    user: "guest",
    host: "kal-os",
    path: "~",
    typingSpeed: 0, 
};

// --- STATE ---
let availableCommands = ["help", "clear", "history", "exit", "mywork"]; 
let commandHistory = [];
let historyIndex = -1;
let currentInput = "";
let cursorPosition = 0;
let isBusy = false; 

// --- DOM REFERENCES ---
const output = document.getElementById("output");
const terminalContainer = document.getElementById("terminal");
const bootContainer = document.getElementById("boot-sequence");
const bootOutput = document.getElementById("boot-output");

// Mobile Input Helper
const mobileInput = document.createElement("input");
setupMobileInput();

let currentLine = null;
let cursor = null;

// --- ENTRY POINT ---
bootSystem();

// ============================================================================
//  1. REALISTIC BOOT SEQUENCE ENGINE
// ============================================================================

async function bootSystem() {
    loadCommandList(); 

    // Helper to scroll the MAIN CONTAINER
    const scrollToBottom = () => {
        bootContainer.scrollTop = bootContainer.scrollHeight;
    };

    // Phase 1: Kernel Initialization 
    let currentTime = 0.0;

    // ... [Kernel Messages Array - Same as before] ...
    const kernelMessages = [
        "Linux version 5.15.0-76-generic (buildd@lcy02-amd64-046)",
        "Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0-76-generic ro quiet splash",
        "KERNEL supported cpus: Intel GenuineIntel, AMD AuthenticAMD",
        "x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'",
        "BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable",
        "ACPI: Early table checksum verification disabled",
        "Zone ranges: DMA [mem 0x00001000-0x00ffffff], Normal [mem 0x01000000-0x023fffff]",
        "Memory: 16362540K/16777216K available (14339K kernel code)",
        "TCP: Hash tables configured (established 131072 bind 131072)",
        "rcu: Hierarchical RCU implementation.",
        "Console: colour VGA+ 80x25",
        "Calibrating delay loop... 4224.00 BogoMIPS (lpj=2112000)",
        "smpboot: CPU0: Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz",
        "devtmpfs: initialized",
        "NET: Registered protocol family 16",
        "SCSI subsystem initialized",
        "usbcore: registered new interface driver usbfs",
        "Dynamic Kernel Service Technology: v2.1.4 active"
    ];

    const printKernelLine = (msg) => {
        currentTime += Math.random() * 0.05;
        const timeStr = `[${currentTime.toFixed(6).padStart(12, " ")}]`;
        const line = document.createElement("div");
        line.className = "boot-line";
        line.innerHTML = `<span class="boot-time">${timeStr}</span><span class="boot-message">${msg}</span>`;
        bootOutput.appendChild(line);
        scrollToBottom();
    };

    let i = 0;
    while(i < kernelMessages.length) {
        const burst = Math.floor(Math.random() * 12) + 3;
        for(let j=0; j<burst && i<kernelMessages.length; j++) {
            printKernelLine(kernelMessages[i]);
            i++;
            await sleep(5); 
        }
        await sleep(Math.random() * 150 + 20);
    }

    // Phase 2: Systemd Services
    await sleep(600);
    const serviceMessages = [
        { name: "systemd-modules-load.service", desc: "Load Kernel Modules" },
        { name: "blk-availability.service", desc: "Availability of block devices" },
        { name: "ufw.service", desc: "Uncomplicated firewall" },
        { name: "keyboard-setup.service", desc: "Set the console keyboard layout", delay: 400 },
        { name: "apparmor.service", desc: "Load AppArmor profiles" },
        { name: "networking.service", desc: "Raise network interfaces", delay: 800 },
        { name: "ssh.service", desc: "OpenBSD Secure Shell server" },
        { name: "kal-browser-core.service", desc: "KalBrowser Render Engine", delay: 300 },
        { name: "snapd.service", desc: "Snap Daemon" },
        { name: "dbus.service", desc: "D-Bus System Message Bus" },
        { name: "user@1000.service", desc: "User Manager for UID 1000", delay: 200 }
    ];

    for (let svc of serviceMessages) {
        const line = document.createElement("div");
        line.innerHTML = `<span class="status-block" style="color:#bd93f9; font-weight:bold;">[ ** ]</span> Starting ${svc.desc}...`;
        bootOutput.appendChild(line);
        scrollToBottom();

        await sleep(svc.delay || Math.random() * 100 + 50);

        line.innerHTML = `<span class="status-block st-ok">[ OK ]</span> Started ${svc.desc}.`;
    }

    // Finalization
    await sleep(400);
    const finalMsg = document.createElement("div");
    finalMsg.innerHTML = `<br>Welcome to KalOS 22.04 LTS!<br><br>Press any key to activate console...`;
    bootOutput.appendChild(finalMsg);
    scrollToBottom();

    const onStart = () => {
        document.removeEventListener("keydown", onStart);
        document.removeEventListener("click", onStart);
        document.removeEventListener("touchstart", onStart);

        bootContainer.style.display = "none";
        terminalContainer.style.display = "flex";

        output.innerHTML = "";
        printLine("Welcome to KalOS Terminal v1.01");
        printLine("Type <span style='color:#50fa7b'>help</span> to see available commands.");
        printLine(""); 
        createNewLine();
        focusInput();
    };

    document.addEventListener("keydown", onStart);
    document.addEventListener("click", onStart);
    document.addEventListener("touchstart", onStart);
}

// ============================================================================
//  2. COMMAND EXECUTION KERNEL
// ============================================================================

async function loadCommandList() {
    try {
        // OLD: const res = await fetch('/static/js/commands/index.json');

        // NEW: Fetch from your Flask route
        const res = await fetch('/commands_list'); 

        if (res.ok) {
            const external = await res.json();
            // Merge unique commands
            availableCommands = [...new Set([...availableCommands, ...external])];
        }
    } catch (e) {
        console.warn("Could not load external command list.");
    }
}

function scrollToBottom() {
    // We scroll the CONTAINER, not the body or the output div
    terminalContainer.scrollTop = terminalContainer.scrollHeight;
}

async function runCommand(rawCmd) {
    if (!rawCmd.trim()) return;

    isBusy = true; 
    const rawArgs = rawCmd.trim().split(/\s+/);
    const cmd = rawArgs[0].toLowerCase();

    if (cmd === "clear") {
        output.innerHTML = "";
        isBusy = false;
        return;
    }

    if (cmd === "history") {
        const text = commandHistory.map((c, i) => ` ${i + 1}  ${c}`).join("\n");
        printLine(text);
        isBusy = false;
        return;
    }

    if (cmd === "exit") {
        location.reload();
        return;
    }

    if (cmd === "help") {
        printLine(`
GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)
These shell commands are defined internally. Type 'help' to see this list.

<span style="color:#8be9fd">Available commands:</span>
${availableCommands.join("  ")}
        `);
        isBusy = false;
        return;
    }

    try {
        const module = await import(`./commands/${cmd}.js?v=${Date.now()}`);

        const systemApi = {
            print: (text, color) => printLine(text, color),
            error: (text) => printLine(text, "#ff5555"),
            clear: () => output.innerHTML = "",
            sleep: sleep,
            openBrowser: (await import('./browser.js')).default, 
            colors: {
                green: "#50fa7b",
                cyan: "#8be9fd",
                orange: "#ffb86c", 
                purple: "#bd93f9",
                red: "#ff5555",
                gray: "#6272a4"
            }
        };

        const { flags, args } = parseArgs(rawArgs.slice(1));

        if (module.default && typeof module.default === "function") {
            await module.default({ flags, args, system: systemApi });
        } else {
            printLine(`Error: ${cmd} is not a valid executable.`, "#ff5555");
        }

    } catch (err) {
        if (err.message.includes("Failed to fetch") || err.message.includes("Cannot find module")) {
            printLine(`bash: ${cmd}: command not found`, "#ff5555");
        } else {
            console.error(err);
            printLine(`Runtime Error: ${err.message}`, "#ff5555");
        }
    }

    isBusy = false;
}

// ============================================================================
//  3. INPUT ENGINE & RENDERER
// ============================================================================

function createNewLine() {
    const div = document.createElement("div");
    div.className = "line-wrapper";
    const promptHtml = `<span class="prompt-user">${CONFIG.user}@${CONFIG.host}</span>:<span class="prompt-path">${CONFIG.path}</span>$ `;
    div.innerHTML = `${promptHtml}<span class="input-line"></span>`;
    output.appendChild(div);
    updateCurrentLineRef();
    currentInput = "";
    cursorPosition = 0;
    renderInputLine();
    window.scrollTo(0, document.body.scrollHeight);
}

function updateCurrentLineRef() {
    const inputLines = document.getElementsByClassName("input-line");
    if (inputLines.length > 0) {
        currentLine = inputLines[inputLines.length - 1];
    }
}

function renderInputLine() {
    if (!currentLine) return;
    const left = currentInput.substring(0, cursorPosition);
    const charAtCursor = currentInput.substring(cursorPosition, cursorPosition + 1) || " ";
    const right = currentInput.substring(cursorPosition + 1);
    currentLine.innerHTML = escapeHtml(left) + 
        `<span id="cursor">${escapeHtml(charAtCursor)}</span>` + 
        escapeHtml(right);
    cursor = document.getElementById("cursor");
}

async function handleCommandEntry() {
    if (cursor) {
        const char = cursor.textContent;
        cursor.replaceWith(char); 
    }
    const cmd = currentInput.trim();
    if (cmd) {
        commandHistory.push(cmd);
        historyIndex = commandHistory.length;
        await runCommand(cmd);
    }
    if (!isBusy) {
        createNewLine();
    }
}

// ============================================================================
//  4. EVENT LISTENERS (FIXED)
// ============================================================================

document.addEventListener("keydown", (e) => {
    // 1. Basic Guards
    if (isBusy || terminalContainer.style.display === "none") return;

    // 2. Identify if we are using the hidden mobile input
    const isMobileInput = e.target === mobileInput;

    // --- Control Keys (Always Handle These) ---

    // Enter
    if (e.key === "Enter") {
        e.preventDefault();
        handleCommandEntry();
        return;
    }

    // Backspace (Now works even if focused on mobileInput)
    if (e.key === "Backspace") {
        e.preventDefault();
        if (cursorPosition > 0) {
            currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
            cursorPosition--;
            renderInputLine();
        }
        return;
    }

    // Ctrl+C / Ctrl+L
    if (e.ctrlKey) {
        if (e.key === "c") {
            e.preventDefault();
            const breakLine = document.createElement("div");
            breakLine.innerText = "^C";
            output.lastElementChild.appendChild(breakLine);
            currentInput = "";
            createNewLine();
            return;
        }
        if (e.key === "l") {
            e.preventDefault();
            output.innerHTML = "";
            createNewLine();
            return;
        }
    }

    // Arrows
    if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (cursorPosition > 0) { cursorPosition--; renderInputLine(); }
        return;
    }
    if (e.key === "ArrowRight") {
        e.preventDefault();
        if (cursorPosition < currentInput.length) { cursorPosition++; renderInputLine(); }
        return;
    }
    if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            currentInput = commandHistory[historyIndex];
            cursorPosition = currentInput.length;
            renderInputLine();
        }
        return;
    }
    if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            currentInput = commandHistory[historyIndex];
            cursorPosition = currentInput.length;
        } else {
            historyIndex = commandHistory.length;
            currentInput = "";
            cursorPosition = 0;
        }
        renderInputLine();
        return;
    }

    // Tab Completion
    if (e.key === "Tab") {
        e.preventDefault();
        const args = currentInput.split(" ");
        const currentWord = args[args.length - 1];
        if (!currentWord) return;
        const matches = availableCommands.filter(c => c.startsWith(currentWord));
        if (matches.length === 1) {
            args[args.length - 1] = matches[0];
            currentInput = args.join(" ") + " "; 
            cursorPosition = currentInput.length;
            renderInputLine();
        }
        return;
    }

    // --- Typing Characters ---

    // If we are on mobile input, let the 'input' event handle characters!
    if (isMobileInput) return;

    // Otherwise (Desktop without focus on hidden input), handle here
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        currentInput = currentInput.slice(0, cursorPosition) + e.key + currentInput.slice(cursorPosition);
        cursorPosition++;
        renderInputLine();
    }
});

// Force focus on click
document.addEventListener("click", focusInput);

// ============================================================================
//  5. UTILITIES & MOBILE SUPPORT
// ============================================================================

function printLine(text, color) {
    const div = document.createElement("div");
    if (color) div.style.color = color;
    div.innerHTML = text; 
    output.appendChild(div);

    // FIX: Use the helper
    scrollToBottom();
}

function parseArgs(rawArgs) {
    const flags = {};
    const args = [];
    for (let i = 0; i < rawArgs.length; i++) {
        const arg = rawArgs[i];
        if (arg.startsWith("--")) {
            const key = arg.slice(2);
            const next = rawArgs[i + 1];
            if (next && !next.startsWith("-")) {
                flags[key] = next;
                i++;
            } else {
                flags[key] = true;
            }
        } else if (arg.startsWith("-")) {
            const key = arg.slice(1);
            flags[key] = true;
        } else {
            args.push(arg);
        }
    }
    return { flags, args };
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/ /g, "&nbsp;");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setupMobileInput() {
    mobileInput.style.cssText = "position:absolute; opacity:0; top:-1000px; font-size: 16px;";
    // Important: Disable autocomplete to prevent weird mobile keyboard behaviors
    mobileInput.setAttribute("autocomplete", "off");
    mobileInput.setAttribute("autocorrect", "off");
    mobileInput.setAttribute("autocapitalize", "off");
    mobileInput.setAttribute("spellcheck", "false");

    document.body.appendChild(mobileInput);

    mobileInput.addEventListener("input", (e) => {
        if (isBusy) { mobileInput.value = ""; return; }

        if(e.inputType === "insertText" && e.data) {
             currentInput = currentInput.slice(0, cursorPosition) + e.data + currentInput.slice(cursorPosition);
             cursorPosition++;
        } else if (e.inputType === "deleteContentBackward") {
            // Fallback for mobile backspace if keydown didn't catch it
            if(cursorPosition > 0) {
                currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
                cursorPosition--;
            }
        }
        mobileInput.value = ""; 
        renderInputLine();
    });

    // We removed the keydown listener here because the Global listener now handles it
}

function focusInput() {
    if (terminalContainer.style.display !== "none") {
        mobileInput.focus();
    }
}