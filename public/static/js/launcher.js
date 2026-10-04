// launcher.js - installs (first run) and boots KLH Browser, then opens a page. Used by `portfolio`.
import openBrowser from "./browser.js";

const INSTALLED_KEY = "klh-browser-installed";

const readInstalled = () => { try { return localStorage.getItem(INSTALLED_KEY) === "1"; } catch { return false; } };
const writeInstalled = () => { try { localStorage.setItem(INSTALLED_KEY, "1"); } catch { /* storage unavailable */ } };

// Packages "downloaded" during the install: [name, version, size in kB]
const PACKAGES = [
    ["libnss3", "2:3.68.2-0ubuntu1.2", 1244],
    ["libxss1", "1:1.2.3-1build2", 8216],
    ["fonts-liberation", "1:1.07.4-11", 822],
    ["libgtk-3-0", "3.24.33-1ubuntu2", 2506],
    ["klh-browser", "1.0.0", 39600],
];

const fmtKb = (kb) => kb.toLocaleString("en-GB");
const fmtMb = (kb) => (kb / 1024).toFixed(1);

export async function launchBrowser({ flags, system, path }) {
    const { print, sleep, colors, error } = system;
    const fast = Boolean(flags.fast);
    const wait = (ms) => (fast ? Promise.resolve() : sleep(ms));

    let port = 8080;
    if (flags.port !== undefined) {
        port = Number(flags.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            error(`portfolio: invalid port '${String(flags.port).replace(/</g, "&lt;")}'`);
            return;
        }
    }
    const verbose = Boolean(flags.verbose);
    const gray = (t) => `<span style="color:${colors.gray}">${t}</span>`;
    const ok = `<span style="color:${colors.green}">[ OK ]</span>`;

    // ------------------------------------------------------------------
    // 1. Install (first run, or with --reinstall)
    // ------------------------------------------------------------------
    if (!readInstalled() || flags.reinstall) {
        const total = PACKAGES.reduce((sum, p) => sum + p[2], 0);
        const names = PACKAGES.map((p) => p[0]).sort();

        print("portfolio: klh-browser is not installed.");
        print(`Installing from ${gray("http://repo.klh-os.local/ubuntu")} ...`);
        await wait(400);
        for (const step of ["Reading package lists... Done", "Building dependency tree... Done", "Reading state information... Done"]) {
            print(step);
            await wait(250);
        }
        print("The following NEW packages will be installed:");
        print(`  ${names.join(" ")}`);
        print(`0 upgraded, ${PACKAGES.length} newly installed, 0 to remove and 0 not upgraded.`);
        print(`Need to get ${fmtMb(total)} MB of archives.`);
        print(`After this operation, ${Math.round(total * 3.4 / 1024)} MB of additional disk space will be used.`);
        await wait(400);

        // Download each package with a live progress bar
        const start = Date.now();
        for (let i = 0; i < PACKAGES.length; i++) {
            const [name, version, size] = PACKAGES[i];
            const label = `Get:${i + 1} http://repo.klh-os.local/ubuntu jammy/main amd64 ${name} amd64 ${version} [${fmtKb(size)} kB]`;
            const line = print(label);
            const steps = fast ? 1 : Math.max(2, Math.min(10, Math.round(size / 4000)));
            for (let s = 1; s <= steps && line; s++) {
                const pct = Math.round((s / steps) * 100);
                const filled = Math.round(pct / 5);
                line.innerHTML = `${label} ${gray(`[${"#".repeat(filled)}${".".repeat(20 - filled)}] ${String(pct).padStart(3)}%`)}`;
                await wait(90);
            }
        }
        const secs = Math.max(1, Math.round((Date.now() - start) / 1000));
        print(`Fetched ${fmtMb(total)} MB in ${secs}s (${(total / 1024 / secs).toFixed(1)} MB/s)`);
        await wait(300);

        // Unpack
        let count = 184233;
        for (const [name, version, size] of PACKAGES) {
            print(`Selecting previously unselected package ${name}:amd64.`);
            print(`(Reading database ... ${count} files and directories currently installed.)`);
            print(`Preparing to unpack .../${name}_${version.replace(/:/g, "%3a")}_amd64.deb ...`);
            print(`Unpacking ${name}:amd64 (${version}) ...`);
            count += Math.round(size / 18);
            await wait(260);
        }

        // Configure, with apt's in-place progress line
        const progress = print("");
        for (let i = 0; i < PACKAGES.length; i++) {
            const [name, version] = PACKAGES[i];
            print(`Setting up ${name}:amd64 (${version}) ...`);
            const pct = Math.round(((i + 1) / PACKAGES.length) * 100);
            if (progress) {
                const filled = Math.round(pct / 5);
                progress.innerHTML = gray(`Progress: [${String(pct).padStart(3)}%] [${"#".repeat(filled)}${".".repeat(20 - filled)}]`);
            }
            await wait(300);
        }
        print("Processing triggers for desktop-file-utils (0.26-1ubuntu3) ...");
        print("Processing triggers for hicolor-icon-theme (0.17-2) ...");
        await wait(300);
        print(`${ok} klh-browser 1.0.0 installed to /usr/bin/klh-browser`);
        print("");
        writeInstalled();
    } else if (verbose) {
        print(gray("klh-browser is already the newest version (1.0.0)."));
    }

    // ------------------------------------------------------------------
    // 2. Boot the browser process
    // ------------------------------------------------------------------
    const pid = Math.floor(Math.random() * 8000) + 1000;
    const stamp = () => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, "0");
        return `${p(d.getMonth() + 1)}${p(d.getDate())}/${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
    };
    const log = async (level, source, msg, delay = 180) => {
        print(gray(`[${pid}:${pid}:${stamp()}:${level}:${source}]`) + ` ${msg}`);
        await wait(delay);
    };

    print("klh-browser 1.0.0 (build 2026.10.01, x86_64)");
    await wait(200);
    await log("INFO", "browser_main_loop.cc(312)", "Starting KLH Browser");
    if (verbose) await log("VERBOSE", "gpu_init.cc(88)", "Probing GPU: using software rasteriser (llvmpipe)", 120);
    await log("INFO", "profile_manager.cc(141)", "Loading profile /home/guest/.config/klh-browser/Default");
    if (verbose) await log("VERBOSE", "cache.cc(57)", "Opening disk cache (0 entries)", 120);
    await log("INFO", "renderer_host.cc(204)", `Starting renderer process (pid ${pid + 17})`);
    await log("INFO", "local_server.cc(66)", `Serving built-in pages on http://127.0.0.1:${port}`);
    print(`<span style="color:${colors.green}">✔ Ready.</span> Opening window...`);
    await wait(500);

    await openBrowser(path, { port, fast });
}
