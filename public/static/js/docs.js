// docs.js - help text: bash-style `help`, `help <cmd>`, `<cmd> --help` and `man <cmd>`

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// name: { usage, summary, desc, options: [[flag, text]], section }
// section: "bash" (shell builtin) or "user" (a regular program, shown by man/--help)
export const DOCS = {
    cd: { section: "bash", usage: "cd [dir]", summary: "Change the shell working directory.",
        desc: "Change the current directory to DIR. The default DIR is the value of the HOME shell variable. `..` is the parent directory and `~` is your home directory." },
    pwd: { section: "bash", usage: "pwd", summary: "Print the name of the current working directory." },
    echo: { section: "bash", usage: "echo [-ne] [arg ...]", summary: "Write arguments to the standard output.",
        options: [["-n", "do not append a newline"], ["-e", "enable interpretation of backslash escapes"]] },
    history: { section: "bash", usage: "history [n]", summary: "Display the command history list with line numbers.",
        desc: "With an argument N, list only the last N entries." },
    alias: { section: "bash", usage: "alias [name[=value] ...]", summary: "Define or display aliases." },
    type: { section: "bash", usage: "type name [name ...]", summary: "Display information about command type." },
    clear: { section: "user", usage: "clear", summary: "Clear the terminal screen.", desc: "Ctrl+L does the same thing." },
    exit: { section: "bash", usage: "exit [n]", summary: "Exit the shell.", desc: "Logs out and restarts the session." },
    logout: { section: "bash", usage: "logout", summary: "Exit a login shell." },
    help: { section: "bash", usage: "help [pattern ...]", summary: "Display information about builtin commands.",
        desc: "Displays brief summaries of builtin commands. If PATTERN is specified, gives detailed help on all commands matching PATTERN, otherwise the list of help topics is printed." },
    man: { section: "user", usage: "man page", summary: "An interface to the system reference manuals." },
    which: { section: "user", usage: "which [-a] filename ...", summary: "Locate a command." },
    ls: { section: "user", usage: "ls [OPTION]... [FILE]...", summary: "List directory contents.",
        desc: "List information about the FILEs (the current directory by default). Entries are sorted alphabetically.",
        options: [["-a", "do not ignore entries starting with ."], ["-l", "use a long listing format"], ["-1", "list one file per line"]] },
    ll: { section: "user", usage: "ll [OPTION]... [FILE]...", summary: "Alias for `ls -l`." },
    cat: { section: "user", usage: "cat [OPTION]... [FILE]...", summary: "Concatenate files and print on the standard output.",
        options: [["-n", "number all output lines"]] },
    tree: { section: "user", usage: "tree [directory]", summary: "List contents of directories in a tree-like format." },
    grep: { section: "user", usage: "grep [OPTION]... PATTERN [FILE]...", summary: "Print lines that match patterns.",
        options: [["-i", "ignore case distinctions"], ["-v", "select non-matching lines"], ["-c", "print only a count of selected lines"], ["-n", "prefix each line with its line number"]] },
    head: { section: "user", usage: "head [-n NUM] [FILE]...", summary: "Output the first part of files (10 lines by default)." },
    tail: { section: "user", usage: "tail [-n NUM] [FILE]...", summary: "Output the last part of files (10 lines by default)." },
    wc: { section: "user", usage: "wc [OPTION]... [FILE]...", summary: "Print newline, word, and byte counts for each file.",
        options: [["-l", "print the newline counts"], ["-w", "print the word counts"], ["-c", "print the byte counts"]] },
    sort: { section: "user", usage: "sort [-r] [FILE]...", summary: "Sort lines of text files.", options: [["-r", "reverse the result of comparisons"]] },
    date: { section: "user", usage: "date", summary: "Print the system date and time." },
    uname: { section: "user", usage: "uname [-a]", summary: "Print system information.", options: [["-a", "print all information"]] },
    whoami: { section: "user", usage: "whoami", summary: "Print the user name associated with the current effective user ID." },
    id: { section: "user", usage: "id", summary: "Print real and effective user and group IDs." },
    hostname: { section: "user", usage: "hostname", summary: "Show the system's host name." },
    uptime: { section: "user", usage: "uptime", summary: "Tell how long the system has been running." },
    env: { section: "user", usage: "env", summary: "Print the environment." },
    ps: { section: "user", usage: "ps", summary: "Report a snapshot of the current processes." },
    df: { section: "user", usage: "df [-h]", summary: "Report file system disk space usage.", options: [["-h", "print sizes in powers of 1024 (e.g., 1023M)"]] },
    free: { section: "user", usage: "free [-h]", summary: "Display amount of free and used memory in the system.", options: [["-h", "show human-readable output"]] },
    neofetch: { section: "user", usage: "neofetch", summary: "Show system information next to an ASCII logo." },
    sudo: { section: "user", usage: "sudo command", summary: "Execute a command as another user." },
    portfolio: { section: "user", usage: "portfolio [--cli | --tui | --web] [options]", summary: "View my portfolio in the terminal, a text UI or a browser.",
        desc: "With no mode option, an interactive picker asks how you'd like to view it. --cli prints a copy of https://klhportfolio.vercel.app here, --tui opens a full-screen text interface, and --web starts KLH Browser (installing it on first run) on the live site.",
        options: [["--cli", "print the portfolio in the terminal"], ["--tui", "full-screen text interface"], ["--web", "open it in the built-in browser"], ["--external", "with --web: open a real browser tab instead"], ["--fast", "skip animations"], ["--whoami --education --grades --experience --skills --projects --contact", "with --cli: show only those sections"], ["--vcard", "with --cli: generate a .vcf file (simulated)"]] },
    reboot: { section: "user", usage: "reboot", summary: "Reboot the system." },
};

const row = (flag, text, width = 14) => `  ${esc(flag).padEnd(width)}${esc(text)}`;

// `cmd --help` for programs
export function usageText(name) {
    const d = DOCS[name];
    if (!d) return null;
    const lines = [`Usage: ${esc(d.usage)}`, esc(d.summary)];
    if (d.desc) lines.push("", esc(d.desc));
    if (d.options) {
        lines.push("");
        for (const [f, t] of d.options) lines.push(row(f, t));
    }
    if (name !== "portfolio") lines.push(row("--help", "display this help and exit"));
    return lines.join("\n");
}

// `help <name>` for bash builtins (matches bash's layout)
export function builtinHelp(name) {
    const d = DOCS[name];
    if (!d) return null;
    const lines = [`${esc(name)}: ${esc(d.usage)}`, `    ${esc(d.summary)}`];
    if (d.desc) lines.push("", `    ${esc(d.desc)}`);
    if (d.options) {
        lines.push("", "    Options:");
        for (const [f, t] of d.options) lines.push(`      ${esc(f).padEnd(6)}${esc(t)}`);
    }
    lines.push("", "    Exit Status:", "    Returns success unless an invalid option is given.");
    return lines.join("\n");
}

// `man <name>`
export function manPage(name) {
    const d = DOCS[name];
    if (!d) return null;
    const up = name.toUpperCase();
    const b = (t) => `<span style="font-weight:bold">${t}</span>`;
    const lines = [`${up}(1)${" ".repeat(24)}User Commands${" ".repeat(24)}${up}(1)`, "", b("NAME"), `       ${esc(name)} - ${esc(d.summary.replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase()))}`, "", b("SYNOPSIS"), `       ${b(esc(d.usage))}`];
    if (d.desc) lines.push("", b("DESCRIPTION"), `       ${esc(d.desc)}`);
    else lines.push("", b("DESCRIPTION"), `       ${esc(d.summary)}`);
    if (d.options) {
        lines.push("");
        for (const [f, t] of d.options) lines.push(`       ${b(esc(f))}`, `              ${esc(t)}`, "");
        lines.pop();
    }
    lines.push("", b("AUTHOR"), "       Kurtis-Lee Hopewell &lt;hkurtislee@outlook.com&gt;", "", `KLH OS${" ".repeat(30)}October 2026${" ".repeat(27)}${up}(1)`);
    return lines.join("\n");
}

// Bash-style `help` with no arguments: two columns of builtins, plus this system's extra commands.
export function helpIndex(commands) {
    const builtins = Object.keys(DOCS).filter((n) => DOCS[n].section === "bash");
    const usages = builtins.map((n) => DOCS[n].usage);
    const colW = Math.max(...usages.map((u) => u.length)) + 2;
    const rows = [];
    for (let i = 0; i < usages.length; i += 2) {
        rows.push((` ${esc(usages[i]).padEnd(colW)}${usages[i + 1] ? esc(usages[i + 1]) : ""}`).trimEnd());
    }
    const PORTFOLIO = ["portfolio"];
    const programs = commands.filter((c) => DOCS[c] && DOCS[c].section === "user" && !PORTFOLIO.includes(c));
    const heading = (t, note) => `<span style="color:#8be9fd;font-weight:bold">${t}</span>${note ? `<span style="color:#6272a4">  ${note}</span>` : ""}`;
    const rule = `<span style="color:#6272a4">${"─".repeat(46)}</span>`;
    const green = (t) => `<span style="color:#50fa7b">${t}</span>`;
    return [
        heading("Portfolio commands", "(made for this site)"),
        rule,
        ...PORTFOLIO.map((n) => `  ${green(n.padEnd(12))}${esc(DOCS[n].summary)}`),
        ...DOCS.portfolio.options.slice(0, 3).map(([f, text]) => `    ${green(f.padEnd(8))}${esc(text)}`),
        "",
        heading("Linux commands", "(a simulated bash shell)"),
        rule,
        "GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)",
        "These shell commands are defined internally.  Type `help' to see this list.",
        "Type `help name' to find out more about the function `name'.",
        "Use `man -k' or `info' to find out more about commands not in this list.",
        "",
        ...rows,
        "",
        "Programs:",
        `  ${programs.sort().join("  ")}`,
        "",
        `Start with ${green("portfolio")}, or try ${green("ls")} then ${green("cat about.txt")}.`,
        `Add --help to any command, or use ${green("man")} <i>command</i>, for details.`,
    ].join("\n");
}
