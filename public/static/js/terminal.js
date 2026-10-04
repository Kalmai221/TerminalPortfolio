import { runBoot } from "./boot.js";
import { runBuiltin, builtinNames, promptPath, completePath } from "./shell.js";

// --- CONFIGURATION ---
const CONFIG = {
    user: "guest",
    host: "klh-os",
    path: "~",
    typingSpeed: 0, 
};

// --- STATE ---
// Commands implemented as modules in ./commands/ (add new ones here)
const moduleCommands = ["portfolio", "reboot"];
// Commands that moved into `portfolio`, so people (and muscle memory) get pointed to the right place
const MOVED = { profile: "portfolio --cli", tui: "portfolio --tui", mywork: "portfolio --web" };
const availableCommands = [...new Set(["help", "clear", "exit", "logout", ...moduleCommands, ...builtinNames])];
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
    const scrollToBottom = () => {
        bootContainer.scrollTop = bootContainer.scrollHeight;
    };

    // Any key / click / tap fast-forwards the boot animation
    let skipped = false;
    const onSkip = () => { skipped = true; hint.remove(); };
    const hint = document.createElement("div");
    hint.textContent = "Press any key to skip boot";
    hint.style.cssText = "position:fixed;right:12px;bottom:8px;color:#6272a4;font-size:12px;pointer-events:none";
    bootContainer.appendChild(hint);
    document.addEventListener("keydown", onSkip, { once: true });
    document.addEventListener("click", onSkip, { once: true });
    document.addEventListener("touchstart", onSkip, { once: true });

    await runBoot({ bootOutput, scrollToBottom, skipSignal: () => skipped });

    hint.remove();
    document.removeEventListener("keydown", onSkip);
    document.removeEventListener("click", onSkip);
    document.removeEventListener("touchstart", onSkip);

    bootContainer.style.display = "none";
    terminalContainer.style.display = "flex";
    document.body.classList.add("booted");

    output.innerHTML = "";
    printLine("Type <span style='color:#50fa7b'>help</span> to see available commands.");
    printLine("");
    createNewLine();
    focusInput();
}

// ============================================================================
//  2. COMMAND EXECUTION KERNEL
// ============================================================================

function scrollToBottom() {
    // We scroll the CONTAINER, not the body or the output div
    terminalContainer.scrollTop = terminalContainer.scrollHeight;
}

const RED = "#ff5555";
let lastStatus = 0;

// Approximate terminal width in characters (used for ls columns)
function termCols() {
    const probe = document.createElement("span");
    probe.textContent = "M".repeat(50);
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
    output.appendChild(probe);
    const charW = probe.getBoundingClientRect().width / 50 || 8;
    probe.remove();
    return Math.max(20, Math.floor(output.clientWidth / charW));
}

// Split a command line into words, honouring single and double quotes
function tokenize(str) {
    const tokens = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(str))) tokens.push(m[1] ?? m[2] ?? m[3]);
    return tokens;
}

function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
    }
    return dp[a.length][b.length];
}

async function runCommand(rawCmd) {
    if (!rawCmd.trim()) return;

    isBusy = true;
    const stages = rawCmd.split("|").map((s) => s.trim());
    if (stages.some((s) => !s)) {
        printLine("bash: syntax error near unexpected token `|'", RED);
        lastStatus = 2;
        isBusy = false;
        return;
    }

    let status = 0;
    let stdin = null;
    for (let i = 0; i < stages.length; i++) {
        const isLast = i === stages.length - 1;
        const collected = [];
        const print = (text, color) => {
            if (color === RED) { status = 1; printLine(text, color); return; } // stderr always shows
            if (isLast) return printLine(text, color);
            else collected.push(...String(text).split("\n"));
        };
        const code = await runStage(stages[i], print, stdin, isLast);
        if (code !== undefined) status = code;
        stdin = collected;
    }

    lastStatus = status;
    isBusy = false;
}

// Runs one command; returns an exit status (undefined = derive from stderr output)
async function runStage(stageStr, print, stdin, isTty) {
    const tokens = tokenize(stageStr).map((t) => t.replace(/\$\?/g, String(lastStatus)));
    if (!tokens.length) return 0;
    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (cmd === "clear") {
        output.innerHTML = "";
        return 0;
    }

    if (cmd === "exit" || cmd === "logout") {
        print("logout");
        await sleep(600);
        location.reload();
        return 0;
    }

    const ctx = { commands: availableCommands, history: commandHistory, stdin, cols: termCols(), tty: isTty };
    if (runBuiltin(cmd, args, print, ctx)) return undefined;

    if (!moduleCommands.includes(cmd)) {
        if (Object.prototype.hasOwnProperty.call(MOVED, cmd)) {
            print(`${escapeHtml(cmd)}: command not found`, RED);
            print(`<span style="color:#6272a4">It's part of the portfolio command now. Try: </span><span style="color:#50fa7b">${MOVED[cmd]}</span>`);
            return 127;
        }
        const maxDist = cmd.length <= 3 ? 1 : 2;
        const close = availableCommands.filter((c) => c.length >= 2 && editDistance(cmd, c) <= maxDist);
        if (close.length) {
            print(`Command '${escapeHtml(cmd)}' not found, did you mean:\n\n${close.map((c) => `  command '${c}'`).join("\n")}\n`, RED);
        } else {
            print(`${escapeHtml(cmd)}: command not found`, RED);
        }
        return 127;
    }

    try {
        const module = await import(`./commands/${cmd}.js`);

        const systemApi = {
            print: (text, color) => print(text, color),
            error: (text) => print(text, RED),
            clear: () => output.innerHTML = "",
            sleep: sleep,
            openBrowser: (await import('./browser.js')).default,
            colors: {
                green: "#50fa7b",
                cyan: "#8be9fd",
                orange: "#ffb86c",
                purple: "#bd93f9",
                red: RED,
                gray: "#6272a4"
            }
        };

        const { flags, args: positional } = parseArgs(args);

        if (module.default && typeof module.default === "function") {
            await module.default({ flags, args: positional, system: systemApi });
        } else {
            print(`Error: ${cmd} is not a valid executable.`, RED);
        }
    } catch (err) {
        if (err.message.includes("Failed to fetch") || err.message.includes("Cannot find module")) {
            print(`bash: ${escapeHtml(cmd)}: command not found`, RED);
            return 127;
        }
        console.error(err);
        print(`Runtime Error: ${err.message}`, RED);
        return 1;
    }
    return undefined;
}

// ============================================================================
//  3. INPUT ENGINE & RENDERER
// ============================================================================

function createNewLine() {
    const div = document.createElement("div");
    div.className = "line-wrapper";
    const promptHtml = `<span class="prompt-user">${CONFIG.user}@${CONFIG.host}</span>:<span class="prompt-path">${promptPath()}</span>$ `;
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
        if (e.key === "a") { e.preventDefault(); cursorPosition = 0; renderInputLine(); return; }
        if (e.key === "e") { e.preventDefault(); cursorPosition = currentInput.length; renderInputLine(); return; }
        if (e.key === "u") { e.preventDefault(); currentInput = currentInput.slice(cursorPosition); cursorPosition = 0; renderInputLine(); return; }
        if (e.key === "w") {
            e.preventDefault();
            const left = currentInput.slice(0, cursorPosition).replace(/\S+\s*$/, "");
            currentInput = left + currentInput.slice(cursorPosition);
            cursorPosition = left.length;
            renderInputLine();
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
        const isFirst = (args.length === 1 && !currentWord.includes("/")) || (args.length === 2 && ["man", "help", "which", "type"].includes(args[0]));
        const matches = isFirst
            ? availableCommands.filter(c => c.startsWith(currentWord))
            : completePath(currentWord);
        if (matches.length === 1) {
            args[args.length - 1] = matches[0];
            currentInput = args.join(" ") + (matches[0].endsWith("/") ? "" : " ");
            cursorPosition = currentInput.length;
            renderInputLine();
        } else if (matches.length > 1) {
            // Longest common prefix, then list the options like bash does
            let prefix = matches[0];
            for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
            if (prefix.length > currentWord.length) {
                args[args.length - 1] = prefix;
                currentInput = args.join(" ");
                cursorPosition = currentInput.length;
            } else {
                const typed = currentInput;
                if (cursor) cursor.replaceWith(cursor.textContent);
                printLine(matches.map(escapeHtml).join("  "));
                createNewLine();
                currentInput = typed;
                cursorPosition = typed.length;
            }
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
    return div;
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