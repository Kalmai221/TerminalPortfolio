export default async function({ flags, system }) {
    const { print, colors, sleep } = system;

    // =========================================================================
    // 0. HELP MENU
    // =========================================================================
    if (flags.help) {
        print(`<br><span style="color:${colors.purple}; font-weight:bold;">📖 Manual: profile</span>`);
        print(`Displays the user's full portfolio, resume, and contact info.`);
        print("");
        print(`<span style="color:${colors.cyan}">Usage:</span> profile [options]`);
        print("");
        print(`<span style="color:${colors.cyan}">Options:</span>`);
        print(`  --whoami       <span style="color:${colors.gray}">Show user summary & location</span>`);
        print(`  --education    <span style="color:${colors.gray}">Show academic history</span>`);
        print(`  --experience   <span style="color:${colors.gray}">Show work experience & projects</span>`);
        print(`  --skills       <span style="color:${colors.gray}">Show technical stack & stats</span>`);
        print(`  --contact      <span style="color:${colors.gray}">Show email & social links</span>`);
        print(`  --vcard        <span style="color:${colors.gray}">Generate a .vcf file (simulated)</span>`);
        print(`  --fast         <span style="color:${colors.gray}">Use cached information</span>`);
        print("");
        print(`<span style="color:${colors.cyan}">Examples:</span>`);
        print(`  profile                    <span style="color:${colors.gray}"># Show everything</span>`);
        print(`  profile --skills --contact <span style="color:${colors.gray}"># Show only skills and contact</span>`);
        print("");
        return; // Stop execution here
    }

    // =========================================================================
    // 1. HELPERS & FORMATTERS
    // =========================================================================

    const getLondonTime = () => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "short" });
        const parts = formatter.formatToParts(now);
        const simplifiedTZ = parts.find(p => p.type === "timeZoneName")?.value || "GMT";

        const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
        const londonDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
        const diff = (londonDate.getTime() - utcDate.getTime()) / (60 * 1000);
        const hours = diff / 60;
        const absOffset = Math.abs(hours);
        const sign = hours >= 0 ? "+" : "-";
        const exactOffset = `UTC${sign}${absOffset % 1 === 0 ? absOffset : absOffset.toFixed(2)}`;

        return { simplifiedTZ, exactOffset };
    };

    const drawBar = (percent) => {
        const width = 15;
        const filledLen = Math.floor((percent / 100) * width);
        const filled = "█".repeat(filledLen);
        const empty = "░".repeat(width - filledLen);
        return `[${filled}${empty}] ${percent}%`;
    };

    const header = (text) => `<br><span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const subHeader = (text) => `<span style="color:${colors.cyan}; font-weight:bold;">${text}</span>`;
    const key = (text) => `<span style="color:${colors.green}">${text}</span>`;
    const bullet = `<span style="color:${colors.gray}">•</span>`;

    // =========================================================================
    // 2. RENDER FUNCTIONS (Pure Output, No Loading Delays)
    // =========================================================================

    const render = {
        whoami: async () => {
            const { simplifiedTZ, exactOffset } = getLondonTime();

            print(header("👤 User Profile"));
            print(`<span style="color:${colors.gray}">-------------------------</span>`);

            const data = [
                { label: "Name", value: "Kal" },
                { label: "Role", value: "IT College Student & Developer" },
                { label: "Location", value: `United Kingdom (${simplifiedTZ} / ${exactOffset})` },
                { label: "Stack", value: "Python, JavaScript, Lua, HTML/CSS" },
                { label: "Status", value: `<span style="color:${colors.green}; font-weight:bold">🟢 Open for Work</span>` }
            ];

            for (const item of data) {
                print(`<span style="color:${colors.green}; min-width:100px; display:inline-block">${item.label}:</span> <span style="color:${colors.text}">${item.value}</span>`);
                if(!flags.fast) await sleep(15);
            }
            print("");
        },

        education: async () => {
            print(header("🎓 Education & Qualifications"));
            print(`<span style="color:${colors.gray}">-------------------------------</span>`);

            print(subHeader("🏫 Current Institution"));
            print(`  ${bullet} <strong>UK College</strong>`);
            print(`  ${bullet} Course:  ${key("Information Technology")}`);
            print(`  ${bullet} Year:    ${key("2")}`);
            print(`  ${bullet} Status:  <span style="color:${colors.green}">In Progress</span>`);
            print("");

            print(subHeader("📚 Key Modules"));
            print(`  ${bullet} Computer Science Fundamentals`);
            print(`  ${bullet} Web Development`);
            print(`  ${bullet} Software Engineering Principles`);
            print(`  ${bullet} Systems Architecture`);
            print("");
        },

        experience: async () => {
            print(header("💼 Work Experience & Status"));
            print(`<span style="color:${colors.gray}">-------------------------------</span>`);

            print(subHeader("🔍 Current Status"));
            print(`  ${bullet} Status:       <span style="color:${colors.green}; font-weight:bold;">🟢 Open to Work</span>`);
            print(`  ${bullet} Availability: Remote / Freelance`);
            print("");

            print(subHeader("🎯 Project Experience"));
            print(`  ${bullet} ${key("Roblox Game Dev:")}   4+ Years (Lua, Game Design)`);
            print(`  ${bullet} ${key("Web Development:")}   Full-stack (Frontend & Backend)`);
            print(`  ${bullet} ${key("Freelancing:")}       Custom Client Solutions`);
            print("");

            print(subHeader("🚀 Key Accomplishments"));
            print(`  ${bullet} Developed interactive CLI/Terminal portfolios in JS`);
            print(`  ${bullet} Launched multiple games with active user engagement`);
            print(`  ${bullet} Built 'KalOS', a Python-based mock operating system`);
            print("");
        },

        skills: async () => {
            print(header("🛠️ Technical Skills"));
            print(`<span style="color:${colors.gray}">==================</span>`);

            const languages = [
                { name: "Python", level: 85 },
                { name: "JavaScript", level: 80 },
                { name: "Lua", level: 90 },
                { name: "HTML/CSS", level: 85 }
            ];

            print(subHeader("Programming Languages:"));
            for (const lang of languages) {
                const bar = drawBar(lang.level);
                let color = lang.level >= 90 ? colors.purple : (lang.level < 80 ? colors.cyan : colors.green);
                print(`${lang.name.padEnd(12)} <span style="color:${color}">${bar}</span>`);
                if(!flags.fast) await sleep(15);
            }

            print("");
            print(subHeader("Frameworks & Tools:"));
            print(`  ${bullet} Flask, Git & GitHub, Roblox Studio`);
            print("");
        },

        contact: async () => {
            print(header("📬 Contact Information"));
            print(`<span style="color:${colors.gray}">======================</span>`);

            const link = (t, u) => `<a href="${u}" target="_blank" style="color:${colors.cyan}; text-decoration:underline">${t}</a>`;

            print(`  📧 Email:    ${link("Kal@roschol.uk", "mailto:Kal@roschol.uk")}`);
            print(`  🔗 GitHub:   ${link("github.com/Kalmai221", "https://github.com/Kalmai221")}`);
            print(`  🎮 Roblox:   @Kalmai221P`);
            print(`  💬 Discord:  itsjustkal`);
            print("");
            print(`Type <span style="color:${colors.cyan}">pastwork</span> for detailed project case studies.`);
            print("");
        }
    };

    // =========================================================================
    // 3. MAIN EXECUTION (Fetch First -> Then Print)
    // =========================================================================

    // A. Determine what the user wants to see
    const filterFlags = Object.keys(flags).filter(f => f !== 'fast' && f !== 'vcard');
    const showAll = filterFlags.length === 0;

    const toShow = {
        whoami: showAll || flags.whoami,
        education: showAll || flags.education,
        experience: showAll || flags.experience,
        skills: showAll || flags.skills,
        contact: showAll || flags.contact
    };

    // B. PHASE 1: LOADING SIMULATION
    // Run all "network calls" upfront if not in fast mode
    if (!flags.fast) {
        let loaded = false;

        if (toShow.whoami) {
             print(`<span style="color:${colors.gray}">[auth]</span> Checking active session...`);
             await sleep(150);
             print(`<span style="color:${colors.gray}">[auth]</span> Retrieving user profile for UID 1000...`);
             await sleep(300);
             loaded = true;
        }
        if (toShow.education) {
             print(`<span style="color:${colors.gray}">[DB]</span> Connecting to Academic Records...`);
             await sleep(200);
             loaded = true;
        }
        if (toShow.experience) {
             print(`<span style="color:${colors.gray}">[HR]</span> Verifying work history...`);
             await sleep(250);
             loaded = true;
        }
        if (toShow.skills) {
             print(`<span style="color:${colors.gray}">[sys]</span> Analyzing kernel capabilities...`);
             await sleep(200);
             loaded = true;
        }
        if (toShow.contact) {
             print(`<span style="color:${colors.gray}">[net]</span> Resolving contact endpoints...`);
             await sleep(200);
             loaded = true;
        }

        if (loaded) {
            print(`<span style="color:${colors.green}">[OK]</span> Data retrieval complete.`);
            await sleep(300);
            print(""); // Visual separation between loading logs and content
        }
    }

    // C. PHASE 2: RENDERING
    // Print the content sequentially
    if (toShow.whoami) await render.whoami();
    if (toShow.education) await render.education();
    if (toShow.experience) await render.experience();
    if (toShow.skills) await render.skills();
    if (toShow.contact) await render.contact();

    // D. Optional VCard generation (Post-render action)
    if (flags.vcard && toShow.contact) {
        await sleep(500);
        print(`<span style="color:${colors.orange}">[FS]</span> Generating vCard...`);
        await sleep(800);
        print(`Saved to /home/guest/kal.vcf <span style="color:${colors.green}">[OK]</span>`);
    }
}