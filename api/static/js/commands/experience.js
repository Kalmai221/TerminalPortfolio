export default async function({ flags, system }) {
    const { print, sleep, colors } = system;

    // 1. Simulation: Employment Background Check
    if (!flags.fast) {
        print(`<span style="color:${colors.gray}">[HR]</span> Initiating background verification...`);
        await sleep(400);

        // Simple loading bar effect
        let bar = "";
        const total = 20;
        const line = document.createElement("div");
        print(``); // Spacer

        // We can't update the same line easily with the current print helper, 
        // so we'll just simulate steps.
        print(`<span style="color:${colors.gray}">[HR]</span> Verifying project history... <span style="color:${colors.green}">[VERIFIED]</span>`);
        await sleep(300);
        print(`<span style="color:${colors.gray}">[HR]</span> Analyzing technical skill set... <span style="color:${colors.green}">[COMPLETED]</span>`);
        await sleep(400);
    }

    // 2. Formatting Helpers
    const header = (text) => `<br><span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const subHeader = (text) => `<span style="color:${colors.cyan}; font-weight:bold;">${text}</span>`;
    const key = (text) => `<span style="color:${colors.green}">${text}</span>`;
    const bullet = `<span style="color:${colors.gray}">•</span>`;

    // 3. Content
    const content = [
        header("💼 Work Experience & Status"),
        `<span style="color:${colors.gray}">===============================</span>`,
        "",
        subHeader("🔍 Current Status"),
        `  ${bullet} Status:       <span style="color:${colors.green}; font-weight:bold;">🟢 Open to Work</span>`,
        `  ${bullet} Availability: Remote / Freelance`,
        "",
        subHeader("🎯 Project Experience"),
        `  ${bullet} ${key("Roblox Game Dev:")}   4+ Years (Lua, Game Design)`,
        `  ${bullet} ${key("Web Development:")}   Full-stack (Frontend & Backend)`,
        `  ${bullet} ${key("Freelancing:")}       Custom Client Solutions`,
        "",
        subHeader("🚀 Key Accomplishments"),
        `  ${bullet} Developed interactive CLI/Terminal portfolios in JS`,
        `  ${bullet} Launched multiple games with active user engagement`,
        `  ${bullet} Mastered modern stack: React, Node.js, Python`,
        `  ${bullet} Built 'KalOS', a Python-based mock operating system`,
        "",
        `<span style="color:${colors.gray}">---------------------------------------------------</span>`,
        `Type <span style="color:${colors.cyan}">pastwork</span> for detailed project case studies.`,
        ""
    ];

    // 4. Render
    for (const line of content) {
        print(line);
        if(!flags.fast) await sleep(20);
    }
}