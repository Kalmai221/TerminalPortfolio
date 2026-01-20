export default async function({ system }) {
    const { print, sleep, colors, clear } = system;

    // 1. Broadcast Message
    const date = new Date().toTimeString().split(' ')[0];
    print("");
    print(`Broadcast message from root@kal-os`);
    print(`(${date}):`);
    print("");
    print(`<span style="color:${colors.orange}; font-weight:bold;">The system is going down for poweroff NOW!</span>`);

    await sleep(2000); 

    // 2. Shutdown Sequence 
    const services = [
        { name: "Graphical Interface", type: "target" },
        { name: "Multi-User System", type: "target" },
        { name: "KalBrowser Render Engine", type: "service" },
        { name: "Network Manager", type: "service" },
        { name: "Snap Daemon", type: "service" },
        { name: "System Initialization", type: "target" },
        { name: "Local File Systems", type: "target" },
        { name: "/boot/efi", type: "mount" },
        { name: "Swap Partition", type: "swap" }
    ];

    const printStatus = (name) => {
        const ok = `<span style="color:${colors.green}; font-weight:bold;">[  OK  ]</span>`;
        const verb = name.includes("mount") ? "Unmounted" : "Stopped";
        print(`${ok} ${verb} ${name}.`);
    };

    for (const svc of services) {
        printStatus(svc.name);
        await sleep(Math.random() * 40 + 10); // Fast shutdown
    }

    await sleep(500);
    print(`<span style="color:${colors.green}; font-weight:bold;">[  OK  ]</span> Reached target Power-Off.`);

    // 3. Final Kernel Messages 
    await sleep(800);
    const now = (performance.now() / 1000).toFixed(6);
    print(`[  ${now}] systemd-shutdown[1]: Syncing filesystems and block devices.`);
    await sleep(100);
    print(`[  ${now}] systemd-shutdown[1]: Powering off.`);

    // 4. "Monitor Off" State & Power On Logic
    await sleep(1500);

    document.body.style.backgroundColor = "black";
    document.body.style.cursor = "default";

    // Replace the entire body with the Halt Screen
    document.body.innerHTML = `
        <div style="
            color: #444; 
            font-family: monospace; 
            padding: 20px; 
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        ">
            <div style="text-align: left; width: 100%; position: absolute; bottom: 20px; left: 20px;">
                <div>[  ${now}] systemd-shutdown[1]: Powering off.</div>
                <div>System halted.</div>
            </div>

            <div id="power-msg" style="opacity: 0; transition: opacity 2s; font-size: 18px; color: #666; border: 1px solid #333; padding: 10px 20px; border-radius: 4px;">
                ⏻ Press <strong style="color: #fff">ENTER</strong> to Power On
            </div>
        </div>
    `;

    // 5. Fade in the "Power On" hint after a moment
    setTimeout(() => {
        const msg = document.getElementById("power-msg");
        if(msg) msg.style.opacity = "1";
    }, 2000);

    // 6. Listen for ENTER to reload (Reboot)
    const rebootListener = (e) => {
        if (e.key === "Enter") {
            window.location.reload();
        }
    };

    document.addEventListener("keydown", rebootListener);
}