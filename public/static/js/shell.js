// shell.js - virtual filesystem and built-in shell commands

import { DOCS, usageText, builtinHelp, manPage, helpIndex } from "./docs.js";
import { PROJECTS, plainText, slug } from "./portfolio-data.js";

const HOME = "/home/guest";
const START = Date.now();

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f = (content) => ({ type: "file", content });
const d = (children) => ({ type: "dir", children });

const FS = d({
    home: d({
        guest: d({
            "about.txt": f(plainText("about")),
            "contact.txt": f(plainText("contact")),
            "education.txt": f(plainText("education")),
            "grades.txt": f(plainText("grades")),
            "experience.txt": f(plainText("experience")),
            "skills.txt": f(plainText("skills")),
            projects: d(Object.fromEntries(PROJECTS.map((p) => [`${slug(p.name)}.txt`, f(plainText("project", slug(p.name)))]))),
            ".bashrc": f(`# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PS1='\\u@\\h:\\w\\$ '\nalias ll='ls -l'`),
            ".profile": f(`# ~/.profile: executed by the command interpreter for login shells.`),
        }),
    }),
    etc: d({
        hostname: f("klh-os"),
        "os-release": f(`PRETTY_NAME="KLH OS 22.04 LTS"\nNAME="KLH OS"\nVERSION_ID="22.04"\nID=ubuntu\nID_LIKE=debian`),
        passwd: f(`root:x:0:0:root:/root:/bin/bash\nguest:x:1000:1000:Guest,,,:/home/guest:/bin/bash`),
    }),
    bin: d({}),
    usr: d({ bin: d({}) }),
    var: d({ log: d({}) }),
    tmp: d({}),
});

let cwd = HOME;

// ---- path helpers ----
function resolvePath(p) {
    if (!p || p === "~") p = HOME;
    else if (p.startsWith("~/")) p = HOME + p.slice(1);
    if (!p.startsWith("/")) p = cwd + "/" + p;
    const out = [];
    for (const seg of p.split("/")) {
        if (!seg || seg === ".") continue;
        if (seg === "..") out.pop();
        else out.push(seg);
    }
    return "/" + out.join("/");
}

function getNode(abs) {
    let node = FS;
    for (const seg of abs.split("/").filter(Boolean)) {
        if (node.type !== "dir" || !node.children[seg]) return null;
        node = node.children[seg];
    }
    return node;
}

export function promptPath() {
    if (cwd === HOME) return "~";
    if (cwd.startsWith(HOME + "/")) return "~" + cwd.slice(HOME.length);
    return cwd;
}

// Tab completion for file arguments; returns matching names (dirs get a trailing /)
export function completePath(word) {
    const slash = word.lastIndexOf("/");
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
    const base = slash >= 0 ? word.slice(slash + 1) : word;
    const dir = getNode(resolvePath(dirPart || "."));
    if (!dir || dir.type !== "dir") return [];
    return Object.keys(dir.children)
        .filter((n) => n.startsWith(base) && (base.startsWith(".") || !n.startsWith(".")))
        .map((n) => dirPart + n + (dir.children[n].type === "dir" ? "/" : ""));
}

// ---- builtins ----
const C = { dir: "#8be9fd", gray: "#6272a4", green: "#50fa7b", red: "#ff5555" };

const plain = (html) => html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// Lay items out in columns, column-major, like ls does on a tty
function columns(items, cols) {
    const width = Math.max(...items.map((i) => i.text.length)) + 2;
    const perRow = Math.max(1, Math.floor(cols / width));
    const rows = Math.ceil(items.length / perRow);
    const lines = [];
    for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < perRow; c++) {
            const it = items[c * rows + r];
            if (!it) continue;
            const last = !items[(c + 1) * rows + r];
            line += last ? it.html : it.html + " ".repeat(width - it.text.length);
        }
        lines.push(line);
    }
    return lines;
}

const BUILD_DATE = "Oct  1 09:00";

function lsCmd(args, print, ctx) {
    const flagArgs = args.filter((a) => a.startsWith("-") && a.length > 1);
    const paths = args.filter((a) => !(a.startsWith("-") && a.length > 1));
    const flags = flagArgs.join("");
    for (const ch of flags.replace(/-/g, "")) {
        if (!"alh1".includes(ch)) return print(`ls: invalid option -- '${ch}'\nTry 'ls --help' for more information.`, C.red);
    }
    const showAll = flags.includes("a");
    const long = flags.includes("l");
    const targets = paths.length ? paths : ["."];

    targets.forEach((t, i) => {
        const node = getNode(resolvePath(t));
        if (!node) return print(`ls: cannot access '${esc(t)}': No such file or directory`, C.red);
        if (targets.length > 1) print((i ? "\n" : "") + esc(t) + ":");
        if (node.type === "file") return print(esc(t));

        const key = (n) => n.replace(/^\./, "").toLowerCase();
        let names = Object.keys(node.children).sort((x, y) => key(x).localeCompare(key(y)));
        names = showAll ? [".", "..", ...names] : names.filter((n) => !n.startsWith("."));

        const isDirName = (n) => { const child = node.children[n]; return !child || child.type === "dir"; };
        const render = (n) => isDirName(n) ? `<span style="color:${C.dir}; font-weight:bold">${esc(n)}</span>` : esc(n);

        if (long) {
            const sizes = names.map((n) => isDirName(n) ? 4096 : node.children[n].content.length);
            const blocks = names.reduce((sum, n, idx) => sum + (isDirName(n) ? 4 : Math.max(4, Math.ceil(sizes[idx] / 4096) * 4)), 0);
            print(`total ${blocks}`);
            const w = String(Math.max(0, ...sizes)).length;
            names.forEach((n, idx) => {
                const dir = isDirName(n);
                print(`${dir ? "drwxr-xr-x" : "-rw-r--r--"} ${dir ? 2 : 1} guest guest ${String(sizes[idx]).padStart(w)} ${BUILD_DATE} ${render(n)}`);
            });
        } else if (flags.includes("1") || !names.length || ctx.tty === false) {
            names.forEach((n) => print(render(n)));
        } else {
            columns(names.map((n) => ({ text: n, html: render(n) })), ctx.cols || 80).forEach((l) => print(l));
        }
    });
}

function treeCmd(args, print) {
    const start = resolvePath(args[0] || ".");
    const root = getNode(start);
    if (!root) return print(`${esc(args[0])} [error opening dir]`, C.red);
    let dirs = 0, files = 0;
    const walk = (node, prefix) => {
        const names = Object.keys(node.children).filter((n) => !n.startsWith(".")).sort();
        names.forEach((n, i) => {
            const last = i === names.length - 1;
            const child = node.children[n];
            const isDir = child.type === "dir";
            print(`${prefix}${last ? "└── " : "├── "}${isDir ? `<span style="color:${C.dir}">${n}</span>` : n}`);
            if (isDir) { dirs++; walk(child, prefix + (last ? "    " : "│   ")); } else files++;
        });
    };
    print(root.type === "dir" ? "." : esc(args[0]));
    if (root.type === "dir") walk(root, "");
    print(`\n${dirs} directories, ${files} files`);
}

function uptimeStr() {
    const mins = Math.floor((Date.now() - START) / 60000);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
}

function neofetch(print) {
    const logo = [
        "   ,-----.   ",
        "  /  KLH  \\  ",
        " |   OS    | ",
        "  \\  22.04 /  ",
        "   `-----'   ",
    ];
    const info = [
        `<span style="color:${C.green}">guest</span>@<span style="color:${C.green}">klh-os</span>`,
        "-----------",
        `<span style="color:${C.dir}">OS</span>: KLH OS 22.04 LTS x86_64`,
        `<span style="color:${C.dir}">Kernel</span>: 5.15.0-76-generic`,
        `<span style="color:${C.dir}">Uptime</span>: ${uptimeStr()}`,
        `<span style="color:${C.dir}">Shell</span>: bash 5.1.16`,
        `<span style="color:${C.dir}">Owner</span>: Kurtis-Lee Hopewell`,
        `<span style="color:${C.dir}">Location</span>: Coventry, UK`,
    ];
    const lines = Math.max(logo.length, info.length);
    for (let i = 0; i < lines; i++) {
        const l = esc(logo[i] || " ".repeat(13));
        print(`<span style="color:#bd93f9">${l}</span>  ${info[i] || ""}`);
    }
}

// ---- text helpers (stdin aware) ----
// Returns input lines as HTML: from files, or from piped stdin when no files are given (null if neither).
function inputLines(files, ctx, print, cmd) {
    if (!files.length) return ctx.stdin ? [...ctx.stdin] : null;
    const out = [];
    for (const name of files) {
        const node = getNode(resolvePath(name));
        if (!node) print(`${cmd}: ${esc(name)}: No such file or directory`, C.red);
        else if (node.type === "dir") print(`${cmd}: ${esc(name)}: Is a directory`, C.red);
        else out.push(...node.content.split("\n").map(esc));
    }
    return out;
}

// Parse `-n 5`, `-5`, `-n5`
function numFlag(args, def = 10) {
    const rest = [];
    let n = def;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-n" && args[i + 1] !== undefined) n = parseInt(args[++i], 10);
        else if (/^-n\d+$/.test(a)) n = parseInt(a.slice(2), 10);
        else if (/^-\d+$/.test(a)) n = parseInt(a.slice(1), 10);
        else rest.push(a);
    }
    return [Number.isNaN(n) ? def : n, rest];
}

// e.g. "Sun Oct  4 14:03:12 BST 2026"
function dateString() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London", weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, year: "numeric", timeZoneName: "short",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    return `${parts.weekday} ${parts.month} ${String(parts.day).padStart(2, " ")} ${parts.hour}:${parts.minute}:${parts.second} ${parts.timeZoneName} ${parts.year}`;
}

const ALIASES = { ll: "ls -l" };
const expandVars = (t) => t
    .replace(/\$\{?USER\}?/g, "guest").replace(/\$\{?HOME\}?/g, HOME)
    .replace(/\$\{?PWD\}?/g, cwd).replace(/\$\{?HOSTNAME\}?/g, "klh-os").replace(/\$\{?SHELL\}?/g, "/bin/bash");

const builtins = {
    pwd: (a, print) => print(cwd),
    cd: (a, print) => {
        if (a[0] === "-") return print("bash: cd: OLDPWD not set", C.red);
        const target = resolvePath(a[0] || "~");
        const node = getNode(target);
        if (!node) return print(`bash: cd: ${esc(a[0])}: No such file or directory`, C.red);
        if (node.type !== "dir") return print(`bash: cd: ${esc(a[0])}: Not a directory`, C.red);
        cwd = target;
    },
    ls: (a, print, ctx) => lsCmd(a, print, ctx),
    ll: (a, print, ctx) => lsCmd(["-l", ...a], print, ctx),
    tree: (a, print) => treeCmd(a, print),
    cat: (a, print, ctx) => {
        const number = a.includes("-n");
        const lines = inputLines(a.filter((x) => x !== "-n" && x !== "-"), ctx, print, "cat");
        if (lines) lines.forEach((l, i) => print(number ? `${String(i + 1).padStart(6)}\t${l}` : l));
    },
    head: (a, print, ctx) => {
        const [n, files] = numFlag(a);
        const lines = inputLines(files, ctx, print, "head");
        if (lines) lines.slice(0, n).forEach((l) => print(l));
    },
    tail: (a, print, ctx) => {
        const [n, files] = numFlag(a);
        const lines = inputLines(files, ctx, print, "tail");
        if (lines) (n > 0 ? lines.slice(-n) : []).forEach((l) => print(l));
    },
    wc: (a, print, ctx) => {
        const flags = a.filter((x) => x.startsWith("-")).join("");
        const files = a.filter((x) => !x.startsWith("-"));
        const lines = inputLines(files, ctx, print, "wc");
        if (!lines) return;
        const text = lines.map(plain);
        const counts = { l: text.length, w: text.join(" ").split(/\s+/).filter(Boolean).length, c: text.join("\n").length + (text.length ? 1 : 0) };
        const want = ["l", "w", "c"].filter((k) => flags.includes(k));
        const shown = want.length ? want : ["l", "w", "c"];
        print(shown.map((k) => String(counts[k]).padStart(want.length === 1 ? 0 : 7)).join(" ") + (files.length === 1 ? ` ${esc(files[0])}` : ""));
    },
    grep: (a, print, ctx) => {
        const flags = a.filter((x) => /^-[a-z]+$/.test(x)).join("");
        const rest = a.filter((x) => !/^-[a-z]+$/.test(x));
        if (!rest.length) return print("Usage: grep [OPTION]... PATTERN [FILE]...\nTry 'grep --help' for more information.", C.red);
        const pattern = rest[0].replace(/^(["'])(.*)\1$/, "$2");
        const ci = flags.includes("i") ? "i" : "";
        let re;
        try { re = new RegExp(pattern, ci); } catch { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), ci); }
        const lines = inputLines(rest.slice(1), ctx, print, "grep");
        if (!lines) return;
        const invert = flags.includes("v");
        const hits = [];
        lines.forEach((l, i) => { if (re.test(plain(l)) !== invert) hits.push([i + 1, l]); });
        if (flags.includes("c")) return print(String(hits.length));
        const hl = new RegExp(re.source, ci + "g");
        hits.forEach(([n, l]) => {
            // highlight matches on plain-text lines (colour is lost on piped coloured lines, like real grep)
            const body = invert ? l : esc(plain(l)).replace(hl, (m) => `<span style="color:#ff5555;font-weight:bold">${m}</span>`);
            print((flags.includes("n") ? `<span style="color:#50fa7b">${n}</span>:` : "") + body);
        });
    },
    sort: (a, print, ctx) => {
        const lines = inputLines(a.filter((x) => !x.startsWith("-")), ctx, print, "sort");
        if (!lines) return;
        lines.sort((x, y) => plain(x).localeCompare(plain(y)));
        if (a.includes("-r")) lines.reverse();
        lines.forEach((l) => print(l));
    },
    echo: (a, print) => {
        let escapes = false;
        let newline = true;
        while (a[0] && /^-[neE]+$/.test(a[0])) {
            if (a[0].includes("n")) newline = false;
            if (a[0].includes("e")) escapes = true;
            a = a.slice(1);
        }
        let text = expandVars(a.join(" ")).replace(/(["'])(.*?)\1/g, "$2");
        if (escapes) text = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
        print(esc(text));
    },
    whoami: (a, print) => print("guest"),
    id: (a, print) => print("uid=1000(guest) gid=1000(guest) groups=1000(guest)"),
    who: (a, print) => print(`guest    tty1         ${new Date(START).toISOString().slice(0, 10)} ${new Date(START).toTimeString().slice(0, 5)}`),
    hostname: (a, print) => print("klh-os"),
    date: (a, print) => print(dateString()),
    uptime: (a, print) => print(` ${new Date().toTimeString().slice(0, 8)} up ${uptimeStr()},  1 user,  load average: 0.08, 0.03, 0.01`),
    uname: (a, print) => {
        const f = a.join("");
        if (f.includes("a")) return print("Linux klh-os 5.15.0-76-generic #83-Ubuntu SMP Thu Jun 15 19:16:32 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux");
        const out = [];
        if (f.includes("s") || !f) out.push("Linux");
        if (f.includes("n")) out.push("klh-os");
        if (f.includes("r")) out.push("5.15.0-76-generic");
        if (f.includes("m")) out.push("x86_64");
        print(out.join(" "));
    },
    env: (a, print) => print(`USER=guest\nHOME=${HOME}\nPWD=${cwd}\nSHELL=/bin/bash\nHOSTNAME=klh-os\nLANG=en_GB.UTF-8\nTERM=xterm-256color\nPATH=/usr/local/bin:/usr/bin:/bin`),
    ps: (a, print) => print("    PID TTY          TIME CMD\n   1042 tty1     00:00:00 bash\n   1187 tty1     00:00:00 ps"),
    df: (a, print) => {
        const h = a.includes("-h");
        print(h ? "Filesystem      Size  Used Avail Use% Mounted on" : "Filesystem     1K-blocks     Used Available Use% Mounted on");
        print(h ? "/dev/sda2       234G   18G  205G   8% /" : "/dev/sda2      244838396 18874368 214466900   8% /");
        print(h ? "tmpfs           7.8G     0  7.8G   0% /dev/shm" : "tmpfs            8181270        0   8181270   0% /dev/shm");
    },
    free: (a, print) => {
        const h = a.includes("-h");
        print("               total        used        free      shared  buff/cache   available");
        print(h ? "Mem:            15Gi       1.9Gi        11Gi        58Mi       2.3Gi        13Gi" : "Mem:        16362540     1993128    11902716       59392     2466696    13927104");
        print(h ? "Swap:          2.0Gi          0B       2.0Gi" : "Swap:        2097148           0     2097148");
    },
    neofetch: (a, print) => neofetch(print),
    alias: (a, print) => {
        if (!a.length) return Object.entries(ALIASES).forEach(([k, v]) => print(`alias ${k}='${v}'`));
        for (const name of a) {
            if (ALIASES[name]) print(`alias ${esc(name)}='${ALIASES[name]}'`);
            else print(`bash: alias: ${esc(name)}: not found`, C.red);
        }
    },
    type: (a, print, ctx) => {
        for (const n of a) {
            if (ALIASES[n]) print(`${esc(n)} is aliased to \`${ALIASES[n]}'`);
            else if (DOCS[n] && DOCS[n].section === "bash") print(`${esc(n)} is a shell builtin`);
            else if (ctx.commands.includes(n)) print(`${esc(n)} is /usr/bin/${esc(n)}`);
            else print(`bash: type: ${esc(n)}: not found`, C.red);
        }
    },
    which: (a, print, ctx) => {
        for (const n of a.filter((x) => !x.startsWith("-"))) {
            if (ctx.commands.includes(n) && !(DOCS[n] && DOCS[n].section === "bash")) print(`/usr/bin/${esc(n)}`);
        }
    },
    history: (a, print, ctx) => {
        const n = parseInt(a[0], 10);
        const list = ctx.history.map((c, i) => [i + 1, c]);
        (Number.isNaN(n) ? list : list.slice(-n)).forEach(([i, c]) => print(`${String(i).padStart(5)}  ${esc(c)}`));
    },
    help: (a, print, ctx) => {
        if (!a.length) return print(helpIndex(ctx.commands));
        for (const n of a) {
            const text = DOCS[n] && DOCS[n].section === "bash" ? builtinHelp(n) : null;
            if (text) print(text);
            else print(`bash: help: no help topics match \`${esc(n)}'.  Try \`help help' or \`man -k ${esc(n)}' or \`info ${esc(n)}'.`, C.red);
        }
    },
    man: (a, print) => {
        if (!a.length) return print("What manual page do you want?\nFor example, try 'man man'.", C.red);
        const text = manPage(a[0]);
        if (text) print(text);
        else print(`No manual entry for ${esc(a[0])}`, C.red);
    },
    sudo: (a, print) => print("guest is not in the sudoers file.  This incident will be reported.", C.red),
    su: (a, print) => print("su: Authentication failure", C.red),
    mkdir: (a, print) => print(`mkdir: cannot create directory '${esc(a[0] || "")}': Read-only file system`, C.red),
    touch: (a, print) => print(`touch: cannot touch '${esc(a[0] || "")}': Read-only file system`, C.red),
    rm: (a, print) => print(`rm: cannot remove '${esc(a.filter((x) => !x.startsWith("-"))[0] || "")}': Read-only file system`, C.red),
    ping: (a, print) => print(`ping: ${esc(a[0] || "")}: Network is unreachable`, C.red),
};

export const builtinNames = Object.keys(builtins);

// Returns true if handled. `--help` prints usage for any documented program.
export function runBuiltin(cmd, args, print, ctx) {
    if (!Object.prototype.hasOwnProperty.call(builtins, cmd)) return false;
    if (args.includes("--help") && DOCS[cmd] && DOCS[cmd].section === "user") {
        print(usageText(cmd));
        return true;
    }
    builtins[cmd](args, print, ctx);
    return true;
}

export { plain };
