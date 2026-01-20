export default async function({ flags, system }) {
    const { print, sleep, colors } = system;

    // 1. Database Access Simulation
    // Adds a bit of realism before showing the data
    if (!flags.fast) {
        print(`<span style="color:${colors.gray}">[DB]</span> Connecting to Academic Records Database...`);
        await sleep(300);
        print(`<span style="color:${colors.gray}">[DB]</span> Authenticating user 'guest'...`);
        await sleep(400);
        print(`<span style="color:${colors.green}">[OK]</span> Record retrieved successfully.`);
        await sleep(200);
    }

    // 2. Styling Helpers
    const header = (text) => `<span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const subHeader = (text) => `<span style="color:${colors.cyan}; font-weight:bold;">${text}</span>`;
    const highlight = (text) => `<span style="color:${colors.green}">${text}</span>`;
    const bullet = `<span style="color:${colors.gray}">•</span>`;

    // 3. The Content
    const content = [
        "",
        header("🎓 Education & Qualifications"),
        `<span style="color:${colors.gray}">===============================</span>`,
        "",
        subHeader("🏫 Current Institution"),
        `  ${bullet} <strong>UK College</strong>`,
        `  ${bullet} Course:  ${highlight("Information Technology")}`,
        `  ${bullet} Year:    ${highlight("2")}`,
        `  ${bullet} Status:  <span style="color:${colors.green}">In Progress</span>`,
        "",
        subHeader("📚 Key Modules"),
        `  ${bullet} Computer Science Fundamentals`,
        `  ${bullet} Web Development`,
        `  ${bullet} Software Engineering Principles`,
        `  ${bullet} Systems Architecture`,
        "",
        subHeader("📖 Self-Learning & Development"),
        `  ${bullet} Full-stack development via online docs/courses`,
        `  ${bullet} Open source contributions on GitHub`,
        `  ${bullet} Building scalable personal projects`,
        ""
    ];

    // 4. Print Loop
    for (const line of content) {
        print(line);
        // A tiny delay between lines makes it feel like it's being "printed" out
        if (!flags.fast) await sleep(30); 
    }
}