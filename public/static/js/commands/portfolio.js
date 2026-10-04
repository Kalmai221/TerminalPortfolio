import { launchBrowser } from "../launcher.js";
import { usageText } from "../docs.js";

const URL = "https://klhportfolio.vercel.app";
// Sections that `--cli` can show on their own
const SECTION_FLAGS = ["whoami", "education", "grades", "experience", "skills", "projects", "contact", "vcard"];

const MODES = [
    { id: "cli", label: "CLI", hint: "print it here in the terminal" },
    { id: "tui", label: "TUI", hint: "full-screen text interface" },
    { id: "web", label: "Web", hint: "open it in the built-in browser" },
];

export default async function({ flags, system }) {
    const { print, error, colors } = system;

    if (flags.help || flags.h) {
        print(usageText("portfolio"));
        return;
    }

    // --external opens a real browser tab and implies --web
    const chosen = MODES.filter((m) => flags[m.id]).map((m) => m.id);
    if (flags.external && !chosen.includes("web")) chosen.push("web");
    const sections = SECTION_FLAGS.filter((f) => flags[f]);
    if (sections.length && !chosen.length) chosen.push("cli"); // e.g. `portfolio --grades`
    if (chosen.length > 1) {
        error("portfolio: choose only one of --cli, --tui and --web");
        return;
    }
    if (sections.length && chosen[0] !== "cli") {
        error(`portfolio: --${sections[0]} only works with --cli`);
        return;
    }

    const mode = chosen[0] || (await pickMode({ print, colors }));
    if (!mode) return; // cancelled

    if (mode === "cli") {
        const { printPortfolio } = await import("../portfolio-cli.js");
        const passed = {};
        for (const f of [...SECTION_FLAGS, "fast"]) if (flags[f]) passed[f] = true;
        await printPortfolio({ flags: passed, system });
    } else if (mode === "tui") {
        const { runTui } = await import("../tui.js");
        const next = await runTui();
        if (next === "web") {
            // "View CMS Portfolio in Terminal" in the TUI closes it and runs `portfolio --web`
            print(`<span class="prompt-user">guest@klh-os</span>:<span class="prompt-path">~</span>$ portfolio --web`);
            await launchBrowser({ flags, system, path: URL });
        }
    } else if (flags.external) {
        openExternal({ print, colors });
    } else {
        await launchBrowser({ flags, system, path: URL });
    }
}

function openExternal({ print, colors }) {
    const link = `<a href="${URL}" target="_blank" rel="noopener noreferrer" style="color:${colors.cyan}; text-decoration:underline">${URL}</a>`;
    print(`<span style="color:${colors.gray}">[xdg-open]</span> Opening ${link} in your web browser...`);
    const win = window.open(URL, "_blank");
    if (win) {
        win.opener = null; // don't let the new page reach back into this one
        print(`<span style="color:${colors.green}">[OK]</span> Opened.`);
    } else {
        // window.open returns null when a pop-up blocker stops it
        print(`<span style="color:${colors.orange}">Your browser blocked the pop-up. Click the link above instead.</span>`);
    }
}

// An interactive picker drawn in the terminal. Resolves to a mode id, or null if cancelled.
function pickMode({ print, colors }) {
    const question = `<span style="color:${colors.purple}; font-weight:bold">?</span> <b>How would you like to view the portfolio?</b>`;
    const block = print("");
    if (!block) {
        // Output is piped, so there's no one to ask
        print(question);
        MODES.forEach((m, i) => print(`  ${i + 1}) ${m.label} - ${m.hint}`));
        print("Re-run with --cli, --tui or --web.");
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        let index = 0;

        const draw = () => {
            const rows = MODES.map((m, i) => {
                const on = i === index;
                const pointer = on ? `<span style="color:${colors.green}">❯</span>` : " ";
                const name = `${i + 1}) ${m.label}`.padEnd(8, " ");
                return `<div class="pick-row" data-i="${i}" style="cursor:pointer;${on ? `color:${colors.green}; font-weight:bold` : ""}">  ${pointer} ${name} <span style="color:${colors.gray}; font-weight:normal">${m.hint}</span></div>`;
            }).join("");
            block.innerHTML = `${question}${rows}<div style="color:${colors.gray}">  ↑/↓ move · Enter select · 1-3 pick · q cancel</div>`;
            block.querySelectorAll(".pick-row").forEach((row) => {
                row.addEventListener("click", () => finish(Number(row.dataset.i)));
            });
        };

        const cleanup = () => document.removeEventListener("keydown", onKey, true);
        const finish = (i) => {
            cleanup();
            if (i === null) {
                block.innerHTML = `${question} <span style="color:${colors.gray}">cancelled</span>`;
                resolve(null);
                return;
            }
            block.innerHTML = `<span style="color:${colors.green}">✔</span> <b>How would you like to view the portfolio?</b> <span style="color:${colors.cyan}">${MODES[i].label}</span>`;
            resolve(MODES[i].id);
        };
        function onKey(e) {
            const k = e.key;
            if (e.ctrlKey && k.toLowerCase() === "c") { e.preventDefault(); e.stopImmediatePropagation(); return finish(null); }
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (k === "ArrowDown" || k === "j" || k === "Tab") { index = (index + 1) % MODES.length; draw(); }
            else if (k === "ArrowUp" || k === "k") { index = (index - 1 + MODES.length) % MODES.length; draw(); }
            else if (/^[1-3]$/.test(k)) finish(Number(k) - 1);
            else if (k === "Enter") finish(index);
            else if (k === "q" || k === "Escape") finish(null);
        }

        document.addEventListener("keydown", onKey, true);
        draw();
    });
}
