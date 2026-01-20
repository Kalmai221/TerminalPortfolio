export default async function({ system }) {
    const { print, sleep, colors, clear } = system;

    // 1. The "Wall" Broadcast (Standard Linux behavior)
    const date = new Date().toTimeString().split(' ')[0];
    print("");
    print(`Broadcast message from root@kal-os`);
    print(`(${date}):`);
    print("");
    print(`<span style="color:${colors.orange}; font-weight:bold;">The system is going down for reboot NOW!</span>`);

    await sleep(2000); // Pause for user to read

    // 2. Systemd Shutdown Sequence
    const services = [
        { name: "Session 1 of user guest", type: "service" },
        { name: "User Manager for UID 1000", type: "service" },
        { name: "Graphical Interface", type: "target" },
        { name: "Multi-User System", type: "target" },
        { name: "KalBrowser Render Engine", type: "service" }, // Custom service
        { name: "Network Manager", type: "service" },
        { name: "D-Bus System Message Bus", type: "service" },
        { name: "Basic System", type: "target" },
        { name: "Path Units", type: "target" },
        { name: "Slice Units", type: "target" },
        { name: "Socket Units", type: "target" },
        { name: "System Initialization", type: "target" },
        { name: "Local File Systems", type: "target" },
        { name: "/run/user/1000", type: "mount" },
        { name: "/boot/efi", type: "mount" },
        { name: "Swap Partition", type: "swap" }
    ];

    // Helper for status lines
    const printStatus = (name) => {
        const ok = `<span style="color:${colors.green}; font-weight:bold;">[  OK  ]</span>`;
        // Randomize verb based on context for realism
        const verb = name.includes("mount") ? "Unmounted" : (name.includes("target") ? "Reached" : "Stopped");
        const text = name.includes("target") ? `target ${name}` : name;
        print(`${ok} ${verb} ${text}.`);
    };

    // Fast scroll effect for services
    for (const svc of services) {
        printStatus(svc.name);
        // Varying speed: some stop instantly, others hang slightly
        await sleep(Math.random() * 80 + 20);
    }

    await sleep(400);
    print(`<span style="color:${colors.green}; font-weight:bold;">[  OK  ]</span> Reached target System Reboot.`);

    await sleep(800);
    print(`reboot: Restarting system`);

    // 3. Screen Cut-to-Black
    await sleep(1000);
    clear();
    document.body.style.backgroundColor = "black"; // Force black out

    // 4. Actual Browser Reload
    await sleep(500);
    window.location.reload();
}