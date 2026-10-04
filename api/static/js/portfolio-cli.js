// portfolio-cli.js - prints the portfolio in the terminal (`portfolio --cli`).
import { PERSON, EDUCATION, GRADES, EXPERIENCE, SKILLS, PROJECTS, SITE } from "./portfolio-data.js";

export async function printPortfolio({ flags, system }) {
    const { print, colors, sleep } = system;

    // =========================================================================
    // 1. HELPERS & FORMATTERS
    // =========================================================================

    const getLondonTime = () => {
        const now = new Date();
        const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "short" }).formatToParts(now);
        const tz = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
        const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
        const london = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
        const hours = (london.getTime() - utc.getTime()) / 3600000;
        const abs = Math.abs(hours);
        return { tz, offset: `UTC${hours >= 0 ? "+" : "-"}${abs % 1 === 0 ? abs : abs.toFixed(2)}` };
    };

    const header = (text) => `<br><span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const subHeader = (text) => `<span style="color:${colors.cyan}; font-weight:bold;">${text}</span>`;
    const key = (text) => `<span style="color:${colors.green}">${text}</span>`;
    const dim = (text) => `<span style="color:${colors.gray}">${text}</span>`;
    const bullet = `<span style="color:${colors.gray}">•</span>`;
    const link = (t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer" style="color:${colors.cyan}; text-decoration:underline">${t}</a>`;
    const gradeColor = (g) => (g === "Distinction" ? colors.green : g === "Merit" ? colors.cyan : colors.orange);
    const grade = (g) => `<span style="color:${gradeColor(g)}">${g}</span>`;
    const rule = (n) => dim("-".repeat(n));

    // =========================================================================
    // 2. RENDER FUNCTIONS
    // =========================================================================

    const render = {
        whoami: async () => {
            const { tz, offset } = getLondonTime();
            print(header("👤 User Profile"));
            print(rule(25));
            const rows = [
                ["Name", PERSON.name],
                ["Role", PERSON.headline],
                ["Location", `${PERSON.location} (${tz} / ${offset})`],
                ["Focus", "Backend, automation & infrastructure"],
                ["Stack", "Python, Flask, MongoDB, HTML/CSS"],
                ["Status", `<span style="color:${colors.green}; font-weight:bold">${PERSON.available}</span>`],
            ];
            for (const [label, value] of rows) {
                print(`<span style="color:${colors.green}; min-width:100px; display:inline-block">${label}:</span> ${value}`);
                if (!flags.fast) await sleep(15);
            }
            print("");
            print(PERSON.summary);
            print("");
            print(`${subHeader("Looking for:")} ${PERSON.looking}`);
            print("");
        },

        education: async () => {
            print(header("🎓 Education & Qualifications"));
            print(rule(31));
            for (const e of EDUCATION) {
                print(subHeader(`🏫 ${e.school}${e.years ? ` · ${e.years}` : ""}`));
                print(`  ${bullet} ${e.title}`);
                if (e.result) print(`  ${bullet} Result: ${key(e.result)}`);
                if (e.note) print(`  ${bullet} ${dim(e.note)}`);
                print("");
            }
            print(dim("Run portfolio --cli --grades for unit-by-unit results."));
            print("");
        },

        grades: async () => {
            print(header("★ Grades"));
            print(rule(31));
            print(`${GRADES.qualification}`);
            print(`Overall: ${key(GRADES.overall)}   ${dim(`(updated ${GRADES.updated})`)}`);
            print("");
            for (const y of GRADES.years) {
                print(subHeader(`${y.year}${y.status === "Predicted" ? "  (grades are predicted)" : ""}`));
                for (const u of y.units) {
                    print(`  ${grade(u.grade.padEnd(12))} ${u.name} ${dim(`(${u.kind.toLowerCase()})`)}`);
                    if (!flags.fast) await sleep(8);
                }
                print("");
            }
            print(subHeader("GCSEs"));
            print(`  ${GRADES.gcse}`);
            print("");
            print(`${dim("Full breakdown:")} ${link(`${SITE.replace("https://", "")}/grades`, `${SITE}/grades`)}`);
            print("");
        },

        experience: async () => {
            print(header("💼 Work Experience"));
            print(rule(31));
            for (const x of EXPERIENCE) {
                print(subHeader(`${x.role} · ${x.org}`));
                print(`  ${dim(x.when)}`);
                x.points.forEach((p) => print(`  ${bullet} ${p}`));
                print("");
            }
        },

        skills: async () => {
            print(header("🛠️ Technical Skills"));
            print(rule(18));
            const color = { "Daily use": colors.green, "Regular use": colors.cyan, Foundations: colors.orange };
            for (const s of SKILLS) {
                print(`${s.name.padEnd(24, " ")} <span style="color:${color[s.level]}">${s.level}</span>`);
                print(`  ${dim(s.note)}`);
                if (!flags.fast) await sleep(15);
            }
            print("");
            print(subHeader("Outside of work:"));
            print(`  ${PERSON.outside}`);
            print("");
        },

        projects: async () => {
            print(header("🚀 Projects"));
            print(rule(18));
            for (const p of PROJECTS) {
                print(`${subHeader(p.name)} ${dim(`[${p.status}]`)}`);
                print(`  ${dim(p.tagline)}`);
                print(`  ${p.text}`);
                p.points.forEach((x) => print(`  ${bullet} ${x}`));
                print(`  ${dim(p.tags.join(" · "))}`);
                print(`  ${p.links.map(([l, u]) => link(l, u)).join("   ")}`);
                print("");
            }
        },

        contact: async () => {
            print(header("📬 Contact Information"));
            print(rule(22));
            print(`  📧 Email:    ${link(PERSON.email, `mailto:${PERSON.email}`)}`);
            print(`  🔗 GitHub:   ${link(PERSON.github.replace("https://", ""), PERSON.github)}`);
            print(`  💼 LinkedIn: ${link("linkedin.com/in/kurtishopewell", PERSON.linkedin)}`);
            print(`  🌐 Website:  ${link(SITE.replace("https://", ""), SITE)}`);
            print(`  📍 Based in: ${PERSON.location}`);
            print("");
            print(`  ${PERSON.looking}`);
            print(`  ${dim(PERSON.reply)}`);
            print("");
        },
    };

    // =========================================================================
    // 3. MAIN EXECUTION
    // =========================================================================

    const order = ["whoami", "education", "grades", "experience", "skills", "projects", "contact"];
    const filterFlags = Object.keys(flags).filter((f) => f !== "fast" && f !== "vcard");
    const showAll = filterFlags.length === 0;
    const toShow = Object.fromEntries(order.map((n) => [n, showAll || Boolean(flags[n])]));
    const anyShown = order.some((n) => toShow[n]);

    if (!anyShown && filterFlags.length) {
        system.error(`portfolio: unrecognised option '--${filterFlags[0].replace(/</g, "&lt;")}'`);
        print("Try 'portfolio --help' for more information.");
        return;
    }

    // Loading simulation
    if (!flags.fast && anyShown) {
        const steps = {
            whoami: ["auth", "Retrieving user profile for UID 1000...", 300],
            education: ["DB", "Connecting to academic records...", 200],
            grades: ["DB", "Fetching unit results...", 200],
            experience: ["HR", "Verifying work history...", 250],
            skills: ["sys", "Analysing capabilities...", 200],
            projects: ["git", "Listing repositories...", 200],
            contact: ["net", "Resolving contact endpoints...", 200],
        };
        for (const n of order) {
            if (!toShow[n]) continue;
            const [tag, msg, ms] = steps[n];
            print(`<span style="color:${colors.gray}">[${tag}]</span> ${msg}`);
            await sleep(ms);
        }
        print(`<span style="color:${colors.green}">[OK]</span> Data retrieval complete.`);
        await sleep(250);
        print("");
    }

    for (const n of order) if (toShow[n]) await render[n]();

    if (flags.vcard && (toShow.contact || showAll)) {
        await sleep(flags.fast ? 0 : 500);
        print(`<span style="color:${colors.orange}">[FS]</span> Generating vCard...`);
        await sleep(flags.fast ? 0 : 800);
        print(`Saved to /home/guest/kurtis-lee-hopewell.vcf <span style="color:${colors.green}">[OK]</span>`);
    }
}
