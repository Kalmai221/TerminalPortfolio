export default async function({ flags, system }) {
    const { print, colors, sleep } = system;

    // 1. Realistic API Fetch Simulation
    if (!flags.fast) {
        print(`<span style="color:${colors.gray}">[git]</span> git remote -v`);
        await sleep(200);
        print(`<span style="color:${colors.gray}">[git]</span> Fetching repository metadata...`);
        await sleep(500);
    }

    const header = (text) => `<br><span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const tag = (text, color) => `<span style="background:${color}; color:#1e1e1e; padding:0 4px; border-radius:2px; font-size:12px; font-weight:bold;">${text}</span>`;
    const link = (url) => `<a href="${url}" target="_blank" style="color:${colors.cyan}; text-decoration:underline;">View on GitHub</a>`;

    const projects = [
        {
            name: "Portfolio Terminal",
            desc: "An interactive terminal-style portfolio website showcasing skills and projects.",
            stack: ["JavaScript", "HTML5", "CSS3"],
            status: "Active",
            statusColor: colors.green,
            url: "https://github.com/Kalmai221/TerminalPortfolio"
        },
        {
            name: "FlaskProfilerForked",
            desc: "A modernized profiler tool for Flask web applications, improving performance monitoring.",
            stack: ["Python", "Flask", "SQLAlchemy"],
            status: "Maintenance",
            statusColor: colors.orange,
            url: "https://github.com/Kalmai221/FlaskProfilerForked"
        }
    ];

    print(header("📂 Project Repository"));
    print(`<span style="color:${colors.gray}">================================</span>`);

    for (const p of projects) {
        print(""); // Spacer
        // Line 1: Name + Status Tag
        print(`<span style="color:${colors.green}; font-weight:bold; font-size:15px;">${p.name}</span>  ${tag(p.status, p.statusColor)}`);

        // Line 2: Description
        print(`<span style="color:${colors.text}; margin-left: 10px;">${p.desc}</span>`);

        // Line 3: Tech Stack
        const stackStr = p.stack.map(s => `<span style="color:${colors.gray}">#${s}</span>`).join(" ");
        print(`<span style="margin-left: 10px;">${stackStr}</span>`);

        // Line 4: Link
        print(`<span style="margin-left: 10px;">🔗 ${link(p.url)}</span>`);

        if (!flags.fast) await sleep(200);
    }

    print("");
    print(`Type <span style="color:${colors.cyan}">contact</span> to discuss collaboration opportunities!`);
    print("");
}