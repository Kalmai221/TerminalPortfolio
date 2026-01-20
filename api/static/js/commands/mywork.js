import openBrowser from "../browser.js";

export default async function({ flags, args, system }) {
    const { print, sleep, colors, error } = system;

    // 1. Handle Help Flag
    if (flags.help || flags.h) {
        print(`
<span style="color:${colors.cyan}">Usage:</span> mywork [options]

<span style="color:${colors.cyan}">Options:</span>
  --port <number>   Specify server port (default: 8080)
  --force           Force restart if running
  --verbose         Show detailed memory logs
  --help            Show this help message
        `);
        return;
    }

    // 2. Setup Configuration
    const PORT = flags.port || 8080;
    const PID = Math.floor(Math.random() * 8000) + 1000;
    const isVerbose = flags.verbose || false;

    // 3. Realistic "Service Start" Simulation
    print(`[sudo] password for guest: **********`);
    await sleep(600);

    print(`<span style="color:${colors.gray}">[SYSTEM]</span> Initializing KalBrowser Service Wrapper...`);
    await sleep(300);

    // Simulated checks
    const checks = [
        `Allocating virtual memory (PID ${PID})...`,
        `Checking port ${PORT} availability...`,
        `Loading V8 engine resources...`,
        `Mounting virtual file system /var/www/html...`
    ];

    for (const check of checks) {
        if (isVerbose) {
            print(`<span style="color:${colors.gray}">[DEBUG] ${check}</span>`);
            await sleep(150);
        }
    }

    await sleep(400);

    // systemd style logs
    const logs = [
        { msg: `Starting KalPortfolio Web Server...`, status: "DONE" },
        { msg: `Listening on tcp://0.0.0.0:${PORT}`, status: "OK", color: colors.green },
        { msg: `Connecting to graphical subsystem...`, status: "WAIT", delay: 800 },
    ];

    for (const log of logs) {
        // Create a flex container for the log line (text .... [ OK ])
        const lineText = log.msg.padEnd(50, ".");
        const statusHtml = `<span style="color:${log.color || colors.cyan}; font-weight:bold">[ ${log.status} ]</span>`;

        print(`${lineText} ${statusHtml}`);

        await sleep(log.delay || 300);
    }

    // 4. Launch the Browser
    print(`<br><span style="color:${colors.green}">✔ Successfully connected. Launching UI...</span>`);
    await sleep(800);

    openBrowser("/mywork"); // Opens the browser iframe
    return null;
}