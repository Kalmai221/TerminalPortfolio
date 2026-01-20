export default async function({ flags, system }) {
    const { print, colors, sleep } = system;

    // 1. Identity Lookup Simulation
    if (!flags.fast) {
        print(`<span style="color:${colors.gray}">[auth]</span> Checking active session...`);
        await sleep(200);
        print(`<span style="color:${colors.gray}">[auth]</span> Retrieving user profile for UID 1000...`);
        await sleep(400);
    }

    // 2. Timezone Logic (Preserved from your original code)
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

    // 3. Render Output
    const header = (text) => `<br><span style="color:${colors.purple}; font-weight:bold;">${text}</span>`;
    const key = (text) => `<span style="color:${colors.green}; min-width: 100px; display: inline-block;">${text}:</span>`;
    const val = (text) => `<span style="color:${colors.text}">${text}</span>`;

    const data = [
        { label: "Name", value: "Kal" },
        { label: "Role", value: "IT College Student & Developer" },
        { label: "Location", value: `United Kingdom (${simplifiedTZ} / ${exactOffset})` },
        { label: "Stack", value: "Python, JavaScript, Lua, HTML/CSS" },
        { label: "Interests", value: "Roblox Dev, Web Dev, System Architecture" },
        { label: "Status", value: `<span style="color:${colors.green}; font-weight:bold">🟢 Open for Work</span>` }
    ];

    print(header("👤 User Profile"));
    print(`<span style="color:${colors.gray}">-------------------------</span>`);

    for (const item of data) {
        print(`${key(item.label)} ${val(item.value)}`);
        if (!flags.fast) await sleep(50);
    }

    print(`<span style="color:${colors.gray}">-------------------------</span>`);
    print("");
}