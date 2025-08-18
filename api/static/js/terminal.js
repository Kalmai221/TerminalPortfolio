const output = document.getElementById("output");
let currentLine = null;
let cursor = null;
const prompt = "user@ubuntu:~$";

let availableCommands = [];
let history = [];
let historyIndex = -1;
let currentInput = "";

async function loadCommands() {
  try {
    const res = await fetch('/commands_list');
    availableCommands = await res.json();
  } catch (e) {
    console.error("Failed to load commands list:", e);
  }
}

async function runCommand(cmd) {
  cmd = cmd.toLowerCase();

  if (cmd === "clear") {
    output.innerText = "";
    return null;
  }

  if (cmd === "help") {
    return `Available commands:\n- ${availableCommands.join("\n- ")}`;
  }

  if (cmd === "reload") {
    await loadCommands();
    return "Commands list reloaded.";
  }

  if (!availableCommands.includes(cmd)) {
    return `bash: ${cmd}: command not found\nType 'help' for available commands.`;
  }

  try {
    const module = await import(`./commands/${cmd}.js?cacheBust=${Date.now()}`);
    return module.default();
  } catch (err) {
    return `Error loading command ${cmd}: ${err.message}`;
  }
}

document.addEventListener("keydown", async (e) => {
  if (e.target === mobileInput) return; // ignore mobile input events here
  if (document.getElementById("terminal").style.display === "none") return;

  if (e.key === "Enter") {
    const cmd = currentInput.trim();

    // Remove current input line and cursor (to avoid duplicates)
    if (currentLine) currentLine.remove();
    if (cursor) cursor.remove();

    // Show the entered command as a static line
    const executedLine = document.createElement("div");
    executedLine.innerHTML = `<span class="prompt">${prompt}</span> ${cmd}`;
    const existingPrompt = document.getElementById("prompt");
    if (existingPrompt) existingPrompt.remove();
    output.appendChild(executedLine);

    // Handle empty input
    if (!cmd) {
      // Add new prompt line and cursor for next input
      const newPrompt = document.createElement("div");
      newPrompt.innerHTML = `<span class="prompt" id="prompt">${prompt}</span> <span id="current-line"></span><span id="cursor">█</span>`;
      output.appendChild(newPrompt);
      currentInput = "";
      output.scrollTop = output.scrollHeight;
      return;
    }

    history.push(cmd);
    historyIndex = history.length;

    // Run command and show output before prompt
    const response = await runCommand(cmd);
    if (response !== null) {
      const responseLine = document.createElement("div");
      responseLine.textContent = response;
      output.appendChild(responseLine);
    }

    // Add new prompt line and cursor for next input
    const newPrompt = document.createElement("div");
    newPrompt.innerHTML = `<span class="prompt" id="prompt">${prompt}</span> <span id="current-line"></span><span id="cursor">█</span>`;
    output.appendChild(newPrompt);

    currentInput = "";
    updateCurrentLineRef();

    output.scrollTop = output.scrollHeight;
  }


  // Arrow Up (previous command)
  if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      currentInput = history[historyIndex];
    }
    updateCurrentLineRef();
    if (currentLine) currentLine.textContent = currentInput;
    e.preventDefault();
    return;
  }

  // Arrow Down (next command)
  if (e.key === "ArrowDown") {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      currentInput = history[historyIndex];
    } else {
      historyIndex = history.length;
      currentInput = "";
    }
    updateCurrentLineRef();
    if (currentLine) currentLine.textContent = currentInput;
    e.preventDefault();
    return;
  }

  // Backspace
  if (e.key === "Backspace") {
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
      updateCurrentLineRef();
      if (currentLine) currentLine.textContent = currentInput;
    }
    e.preventDefault();
    return;
  }

  // Printable characters
  if (e.key.length === 1) {
    currentInput += e.key;
    updateCurrentLineRef();
    if (currentLine) currentLine.textContent = currentInput;
    e.preventDefault();
    return;
  }
});


function updateCurrentLineRef() {
  currentLine = document.getElementById("current-line");
  cursor = document.getElementById("cursor");

  // Debug logging to help identify issues
  if (!currentLine) {
    console.error("current-line element not found");
  }
  if (!cursor) {
    console.error("cursor element not found");
  }
}

function getRandomWarnings(stage) {
  const allWarnings = {
    post: [
      "[WARNING] RTC battery low, please replace soon.",
      "[WARNING] Fan speed sensor failed.",
      "[WARNING] Thermal sensor calibration required.",
      "[WARNING] Optional module 'xyz' failed to initialize."
    ],
    kernel: [
      "[WARNING] ACPI firmware update recommended.",
      "[WARNING] USB device driver not responding.",
      "[WARNING] NVMe module latency high.",
      "[WARNING] Network driver initialization delayed."
    ],
    services: [
      "[WARNING] Terminal emulator loaded with minor errors.",
      "[WARNING] Command processor modules missing optional dependency.",
      "[WARNING] Portfolio modules failed checksum.",
      "[WARNING] Contact system cannot verify SSL certificate."
    ]
  };

  const list = allWarnings[stage] || [];
  // ~30% chance to show a warning
  return Math.random() < 0.15 ? list[Math.floor(Math.random() * list.length)] : null;
}

// Define base boot lines
const baseBootLines = [
  { text: "KalOS Boot Loader v2.1.4", delay: 150, class: "boot-info" },
  { text: "Press [ESC] to enter setup", delay: 800, class: "boot-info" },
  { text: "", delay: 300 },
  { text: "Performing POST (Power-On Self-Test)...", delay: 500, class: "boot-loading" },
  { text: "[ OK ] CPU: Intel Core i7-12700K", delay: 300, class: "boot-ok", stage: "post" },
  { text: "[ OK ] Memory: 32GB DDR4 @ 3200MHz", delay: 300, class: "boot-ok", stage: "post" },
  { text: "[ OK ] Storage: 1TB NVMe SSD", delay: 300, class: "boot-ok", stage: "post" },
  { text: "[ OK ] Network Controller: Ethernet Connected", delay: 300, class: "boot-ok", stage: "post" },
  { text: "", delay: 400 },
  { text: "Loading kernel modules:", delay: 500, class: "boot-loading", stage: "kernel" },
  { text: " - usb-storage [ OK ]", delay: 200, class: "boot-ok", stage: "kernel" },
  { text: " - nvme [ OK ]", delay: 200, class: "boot-ok", stage: "kernel" },
  { text: " - e1000e (Ethernet driver) [ OK ]", delay: 200, class: "boot-ok", stage: "kernel" },
  { text: " - snd_hda_intel (Audio driver) [ OK ]", delay: 200, class: "boot-ok", stage: "kernel" },
  { text: "", delay: 300 },
  { text: "Starting system services...", delay: 600, class: "boot-loading", stage: "services" },
  { text: " - Terminal emulator [ OK ]", delay: 200, class: "boot-ok", stage: "services" },
  { text: " - Command processor [ OK ]", delay: 200, class: "boot-ok", stage: "services" },
  { text: " - Portfolio modules [ OK ]", delay: 200, class: "boot-ok", stage: "services" },
  { text: " - Contact system [ OK ]", delay: 200, class: "boot-ok", stage: "services" },
  { text: "", delay: 400 },
  { text: "System ready.", delay: 500, class: "boot-ok" },
  { text: "", delay: 300 }
];

// Build boot sequence with random warnings
const bootSequence = [];
baseBootLines.forEach(line => {
  bootSequence.push(line);
  const warning = getRandomWarnings(line.stage);
  if (warning) bootSequence.push({ text: warning, delay: 400 + Math.random()*200, class: "boot-warning" });
});


// For a nicer effect, we can add a little function to add some dynamic loading dots:
function animateLoadingDots(element, maxDots = 3, interval = 400, duration = 3000) {
  let dots = 0;
  const start = Date.now();

  const intervalId = setInterval(() => {
    dots = (dots + 1) % (maxDots + 1);
    element.textContent = element.textContent.replace(/\.*$/, '.'.repeat(dots));

    if (Date.now() - start > duration) {
      clearInterval(intervalId);
    }
  }, interval);
}

let bootIndex = 0;
const bootOutput = document.getElementById("boot-output");
const bootContainer = document.getElementById("boot-sequence");
const terminal = document.getElementById("terminal");

// Only create one hidden input for mobile
const mobileInput = document.createElement("input");
mobileInput.type = "text";
mobileInput.style.position = "absolute";
mobileInput.style.opacity = 0;
mobileInput.style.height = 0;
mobileInput.style.width = 0;
mobileInput.autocapitalize = "off";
mobileInput.autocomplete = "off";
mobileInput.autocorrect = "off";
mobileInput.spellcheck = false;
document.body.appendChild(mobileInput);

// Focus hidden input on tap
terminal.addEventListener("click", () => mobileInput.focus());
terminal.addEventListener("touchstart", () => mobileInput.focus());

mobileInput.addEventListener("input", (e) => {
    const lastChar = e.data; // the most recent typed character
    if (lastChar) {
        currentInput += lastChar;  // append at end
    } else {
        // handle deletion/backspace
        currentInput = mobileInput.value;
    }
    if (currentLine) currentLine.innerText = currentInput;
});


// Handle Enter only; let Backspace and typing be handled naturally by input
mobileInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const cmd = currentInput.trim();

    // Remove current input line
    if (currentLine) currentLine.remove();
    if (cursor) cursor.remove();

    const executedLine = document.createElement("div");
    executedLine.innerHTML = `<span class="prompt">${prompt}</span> ${cmd}`;
    const existingPrompt = document.getElementById("prompt");
    if (existingPrompt) existingPrompt.remove();
    output.appendChild(executedLine);

    if (cmd) {
      history.push(cmd);
      historyIndex = history.length;
    }

    runCommand(cmd).then(response => {
      if (response) {
        const responseLine = document.createElement("div");
        responseLine.textContent = response;
        output.appendChild(responseLine);
      }

      // Add new prompt
      const newPrompt = document.createElement("div");
      newPrompt.innerHTML = `<span class="prompt" id="prompt">${prompt}</span> <span id="current-line"></span><span id="cursor">█</span>`;
      output.appendChild(newPrompt);

      currentInput = "";
      mobileInput.value = "";
      updateCurrentLineRef();
      output.scrollTop = output.scrollHeight;
    });
  }
});

function displayBootLine() {
  if (bootIndex < bootSequence.length) {
    const line = bootSequence[bootIndex];
    const span = document.createElement('span');
    if (line.class) {
      span.className = line.class;
    }
    span.textContent = line.text;
    bootOutput.appendChild(span);
    bootOutput.appendChild(document.createTextNode('\n'));
    bootOutput.scrollTop = bootOutput.scrollHeight;

    // If line has "boot-loading" class, animate dots
    if (line.class === "boot-loading") {
      animateLoadingDots(span);
    }

    bootIndex++;

    // Randomize delay +/- 100ms for realism
    const randomizedDelay = line.delay + (Math.random() * 200 - 100);
    setTimeout(displayBootLine, Math.max(50, randomizedDelay));
  } else {
    // Boot sequence complete, show appropriate message and wait for interaction
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);

    const continueText = isMobile ? "Tap the screen to continue..." : "Press any key to continue...";
    const span = document.createElement('span');
    span.className = 'boot-text';
    span.textContent = continueText;
    bootOutput.appendChild(span);
    bootOutput.appendChild(document.createTextNode('\n'));
    bootOutput.scrollTop = bootOutput.scrollHeight;

    function bootComplete() {
      bootContainer.style.transition = "opacity 0.5s ease";
      bootContainer.style.opacity = "0";
      setTimeout(() => {
        bootContainer.style.display = 'none';
        terminal.style.display = 'flex';
        // Wait a moment for the DOM to update before getting references
        setTimeout(() => {
          updateCurrentLineRef();
        }, 10);
      }, 500);

      document.removeEventListener('keydown', bootComplete);
      document.removeEventListener('touchstart', bootComplete);
      document.removeEventListener('click', bootComplete);
    }

    document.addEventListener('keydown', bootComplete, { once: true });
    document.addEventListener('touchstart', bootComplete, { once: true });
    document.addEventListener('click', bootComplete, { once: true });
  }
}

// Start boot sequence
displayBootLine();


// Load commands list on startup
loadCommands();

// Initialize references when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    updateCurrentLineRef();
  }, 100);
});
