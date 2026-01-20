export default async function({ flags, system }) {
    const { print, colors, sleep } = system;

    // 1. Realistic "Fetching" Simulation
    // If the user didn't ask for raw output, show a little network simulation
    if (!flags.fast) {
        print(`<span style="color:${colors.gray}">[network]</span> Resolving contact endpoints...`);
        await sleep(300);
        print(`<span style="color:${colors.gray}">[network]</span> Fetching user profile for 'Kal'...`);
        await sleep(400);
    }

    // 2. Date & Time Logic (Preserved from your original code)
    const now = new Date();
    const timeZoneNameFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        timeZoneName: "short",
    });

    const parts = timeZoneNameFormatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === "timeZoneName");
    const simplifiedTZ = timeZonePart ? timeZonePart.value : "GMT";

    function getLondonOffsetMinutes(date) {
        const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
        const londonDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/London" }));
        return (londonDate.getTime() - utcDate.getTime()) / (60 * 1000);
    }

    const offsetMinutes = getLondonOffsetMinutes(now);
    const offsetHours = offsetMinutes / 60;
    const sign = offsetHours >= 0 ? "+" : "-";
    const absOffset = Math.abs(offsetHours);
    const exactOffset = `UTC${sign}${absOffset % 1 === 0 ? absOffset : absOffset.toFixed(2)}`;

    // 3. Render the Output
    // We use HTML to style keys in Green and headers in Purple/Cyan

    const headerColor = colors.purple;
    const keyColor = colors.green;
    const linkColor = colors.cyan;

    const output = [
        `<br><span style="color:${headerColor}; font-weight:bold;">📧 Contact Information</span>`,
        `<span style="color:${colors.gray}">======================</span>`,
        `<span style="color:${keyColor}">📬 Email:</span>      <a href="mailto:Kal@roschol.uk" style="color:${linkColor}">Kal@roschol.uk</a>`,
        `<span style="color:${keyColor}">🔗 GitHub:</span>     <a href="https://github.com/Kalmai221" target="_blank" style="color:${linkColor}">github.com/Kalmai221</a>`,
        `<span style="color:${keyColor}">🎮 Roblox:</span>     @Kalmai221P`,
        `<span style="color:${keyColor}">📬 Discord:</span>    itsjustkal`,
        "",
        `<span style="color:${keyColor}">📍 Location:</span>   United Kingdom (${simplifiedTZ} / ${exactOffset})`,
        `<span style="color:${keyColor}">⏰ Available:</span>  Weekdays 8AM-9PM ${simplifiedTZ}`,
        "",
        `<span style="color:${headerColor}">💬 Open for:</span>`,
        `  • Freelance opportunities`,
        `  • Collaboration projects`,
        `  • Technical discussions`,
        `  • Roblox game development`,
        ""
    ];

    // Print each line instantly
    for (const line of output) {
        print(line);
    }

    // 4. Handle a special flag example (e.g., 'contact --vcard')
    if (flags.vcard) {
        await sleep(500);
        print(`<span style="color:${colors.orange}">[FS]</span> Generating vCard...`);
        await sleep(800);
        print(`Saved to /home/guest/kal.vcf <span style="color:${colors.green}">[OK]</span>`);
    }
}