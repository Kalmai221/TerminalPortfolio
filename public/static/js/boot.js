// boot.js - simulated Linux boot: GRUB -> kernel ring buffer -> systemd -> autologin + MOTD

const KERNEL = "5.15.0-76-generic";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Kernel messages. `t` is the (rough) time in seconds; lines in the same burst share nearby timestamps.
const kernelLines = [
    `Linux version ${KERNEL} (buildd@lcy02-amd64-046) (gcc (Ubuntu 11.3.0-1ubuntu1~22.04) 11.3.0, GNU ld (GNU Binutils for Ubuntu) 2.38) #83-Ubuntu SMP`,
    `Command line: BOOT_IMAGE=/boot/vmlinuz-${KERNEL} root=UUID=8f3c1b52-6a0e-4c2d-9b7e-2d51a4c9e0aa ro quiet splash`,
    "KERNEL supported cpus:",
    "  Intel GenuineIntel",
    "  AMD AuthenticAMD",
    "x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'",
    "x86/fpu: Enabled xstate features 0x7, context size is 832 bytes, using 'standard' format.",
    "BIOS-provided physical RAM map:",
    "BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable",
    "BIOS-e820: [mem 0x0000000000100000-0x00000000bffdffff] usable",
    "NX (Execute Disable) protection: active",
    "SMBIOS 2.8 present.",
    "DMI: KLH Systems Virtual Machine, BIOS 1.0 01/01/2024",
    "tsc: Detected 1800.000 MHz processor",
    "ACPI: Early table checksum verification disabled",
    "Zone ranges:",
    "  DMA      [mem 0x0000000000001000-0x0000000000ffffff]",
    "  Normal   [mem 0x0000000100000000-0x000000043fffffff]",
    "Memory: 16362540K/16777216K available (14339K kernel code, 3429K rwdata, 8956K rodata)",
    "rcu: Hierarchical RCU implementation.",
    "Console: colour VGA+ 80x25",
    "Calibrating delay loop (skipped) preset value.. 3600.00 BogoMIPS (lpj=7200000)",
    "smpboot: CPU0: Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz (family: 0x6, model: 0x8e, stepping: 0xa)",
    "smp: Bringing up secondary CPUs ...",
    "smp: Brought up 1 node, 4 CPUs",
    "devtmpfs: initialized",
    "clocksource: jiffies: mask: 0xffffffff max_cycles: 0xffffffff",
    "NET: Registered PF_NETLINK/PF_ROUTE protocol family",
    "PCI: Using configuration type 1 for base access",
    "ACPI: Added _OSI(Linux-Dell-Video)",
    "SCSI subsystem initialized",
    "usbcore: registered new interface driver usbfs",
    "usbcore: registered new interface driver hub",
    "NetLabel: Initializing",
    "TCP: Hash tables configured (established 131072 bind 65536)",
    "NET: Registered PF_INET6 protocol family",
    "ata1.00: ATA-10: KLH-VDISK-256G, 1.0, max UDMA/133",
    "sd 0:0:0:0: [sda] 500118192 512-byte logical blocks: (256 GB/238 GiB)",
    "sd 0:0:0:0: [sda] Write cache: enabled, read cache: enabled",
    " sda: sda1 sda2",
    "EXT4-fs (sda2): mounted filesystem with ordered data mode. Opts: (null)",
    "systemd[1]: systemd 249.11-0ubuntu3.9 running in system mode",
    "systemd[1]: Detected architecture x86-64.",
    "systemd[1]: Hostname set to <klh-os>.",
];

const services = [
    ["Created slice", "Slice /system/modprobe."],
    ["Mounted", "Huge Pages File System."],
    ["Mounted", "POSIX Message Queue File System."],
    ["Mounted", "Kernel Debug File System."],
    ["Finished", "Load Kernel Modules."],
    ["Finished", "Remount Root and Kernel File Systems."],
    ["Started", "Journal Service."],
    ["Finished", "Flush Journal to Persistent Storage."],
    ["Started", "Rule-based Manager for Device Events and Files."],
    ["Finished", "Coldplug All udev Devices."],
    ["Reached target", "Local File Systems."],
    ["Finished", "Set console font and keymap."],
    ["Started", "Network Time Synchronization."],
    ["Started", "Network Manager."],
    ["Reached target", "Network."],
    ["Started", "Uncomplicated firewall."],
    ["Started", "OpenBSD Secure Shell server."],
    ["Started", "Regular background program processing daemon."],
    ["Started", "D-Bus System Message Bus."],
    ["Started", "Login Service."],
    ["Started", "Browser Render Engine."],
    ["Started", "User Manager for UID 1000."],
    ["Reached target", "Multi-User System."],
    ["Reached target", "Graphical Interface."],
];

const OK = `<span style="color:#50fa7b">[  OK  ]</span>`;

/**
 * Runs the whole boot animation inside `bootOutput`.
 * `skipSignal()` returns true once the user asked to skip; delays then collapse to zero.
 */
export async function runBoot({ bootOutput, scrollToBottom, skipSignal }) {
    const wait = (ms) => (skipSignal() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
    const add = (html) => {
        const line = document.createElement("div");
        line.innerHTML = html;
        bootOutput.appendChild(line);
        scrollToBottom();
        return line;
    };

    // ---- Phase 0: firmware + GRUB ----
    add(`<span style="color:#fff">KLH BIOS 1.0   Memory test: 16384K OK</span>`);
    await wait(500);
    add("Booting from Hard Disk...");
    await wait(500);
    add(`<br>  GNU GRUB  version 2.06<br><br> *Ubuntu<br>  Advanced options for Ubuntu<br>  UEFI Firmware Settings<br><br>  The highlighted entry will be executed automatically in 0s.`);
    await wait(700);
    bootOutput.innerHTML = "";

    // ---- Phase 1: kernel ring buffer ----
    let time = 0;
    const kernelLine = (msg) => {
        time += Math.random() * 0.06;
        const stamp = `[${time.toFixed(6).padStart(12, " ")}]`;
        add(`<span class="boot-line"><span class="boot-time" style="margin-right:8px;min-width:0">${stamp}</span><span class="boot-message">${esc(msg)}</span></span>`);
    };

    let i = 0;
    while (i < kernelLines.length) {
        const burst = Math.floor(Math.random() * 8) + 3;
        for (let j = 0; j < burst && i < kernelLines.length; j++, i++) {
            kernelLine(kernelLines[i]);
            await wait(8);
        }
        time += Math.random() * 0.25; // gaps while hardware is probed
        await wait(Math.random() * 120 + 20);
    }

    // ---- Phase 2: systemd ----
    await wait(300);
    for (const [verb, name] of services) {
        const running = add(`<span style="color:#bd93f9">[ *** ]</span> A start job is running for ${name.replace(/\.$/, "")}`);
        await wait(Math.random() * 120 + 40);
        const text = `${verb} ${name}`;
        running.innerHTML = `${OK} ${text}`;
    }

    // ---- Phase 3: autologin ----
    await wait(500);
    add("");
    add(`Ubuntu 22.04 LTS klh-os tty1`);
    add("");
    const login = add(`klh-os login: `);
    await wait(500);
    login.innerHTML = `klh-os login: guest (automatic login)`;
    await wait(500);

    const now = new Date();
    const last = new Date(now.getTime() - 3 * 3600 * 1000).toString().split(" GMT")[0];
    add("");
    add(`Welcome to KLH OS 22.04 LTS (GNU/Linux ${KERNEL} x86_64)`);
    add("");
    add(` * Portfolio:  https://klhportfolio.vercel.app`);
    add(` * Owner:      Kurtis-Lee Hopewell, Coventry, UK`);
    add("");
    add(`Last login: ${last} on tty1`);
    await wait(900);
}
