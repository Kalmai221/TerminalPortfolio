export default async function({ flags, system }) {
    const { print, colors, sleep } = system;

    // 1. Simulation Effect
    if (!flags.fast) {
        print(`<span style="color:${colors.gray}">[sys]</span> Analyzing kernel capabilities...`);
        await sleep(200);
        print(`<span style="color:${colors.gray}">[sys]</span> Loading development modules...`);
        await sleep(400);
    }

    // 2. Data Structure
    const languages = [
        { name: "Python", level: 85 },
        { name: "JavaScript", level: 80 },
        { name: "Lua", level: 90 },
        { name: "HTML/CSS", level: 85 }
    ];

    const frameworks = [
        "Flask",
        "Git & GitHub",
        "Roblox Studio"
    ];

    const learning = [
        "Advanced JavaScript concepts",
        "Database management (SQL, NoSQL)",
        "Cloud deployment (AWS, Azure)"
    ];

    // 3. Helper: Draw Progress Bar [████░░░░░░] 80%
    const drawBar = (percent) => {
        const width = 20; // Width of the bar in characters
        const filledLen = Math.floor((percent / 100) * width);
        const emptyLen = width - filledLen;

        // Use full block character for filled, light shade for empty
        const filled = "█".repeat(filledLen); 
        const empty = "░".repeat(emptyLen);

        return `[${filled}${empty}] ${percent}%`;
    };

    // 4. Render Output
    const header = (text) => `<br><span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const subHeader = (text) => `<span style="color:${colors.cyan}; font-weight:bold;">${text}</span>`;

    // --- Section 1: Languages ---
    print(header("🛠️ Technical Skills"));
    print(`<span style="color:${colors.gray}">==================</span>`);

    print(subHeader("Programming Languages:"));
    for (const lang of languages) {
        const name = lang.name.padEnd(12, " "); // Align text
        const bar = drawBar(lang.level);

        // Color coding based on proficiency
        let color = colors.green;
        if (lang.level >= 90) color = colors.purple; // Expert
        else if (lang.level < 80) color = colors.cyan;

        print(`${name} <span style="color:${color}">${bar}</span>`);
        if (!flags.fast) await sleep(50);
    }

    // --- Section 2: Frameworks ---
    print("");
    print(subHeader("Frameworks & Tools:"));
    for (const item of frameworks) {
        print(`  <span style="color:${colors.green}">•</span> ${item}`);
        if (!flags.fast) await sleep(30);
    }

    // --- Section 3: Expanding ---
    print("");
    print(subHeader("Currently Expanding:"));
    for (const item of learning) {
        print(`  <span style="color:${colors.orange}">•</span> ${item}`);
        if (!flags.fast) await sleep(30);
    }

    print("");
}