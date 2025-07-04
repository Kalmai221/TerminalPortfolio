const input = document.getElementById("commandInput");
const output = document.getElementById("output");
const prompt = "user@ubuntu:~$";

let availableCommands = [];
let history = [];
let historyIndex = -1;

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

  if (!availableCommands.includes(cmd)) {
    return `bash: ${cmd}: command not found\nType 'help' for available commands.`;
  }

  try {
    const module = await import(`./commands/${cmd}.js`);
    return module.default();
  } catch (err) {
    return `Error loading command ${cmd}: ${err.message}`;
  }
}


input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = input.value.trim();
    if (!cmd) return;

    history.push(cmd);
    historyIndex = history.length;

    input.value = "";
    
    const response = await runCommand(cmd);

    if (response !== null) {
      output.innerText += `\n${prompt} ${cmd}\n${response}`;
    }

    output.scrollTo({ top: output.scrollHeight, behavior: "smooth" });
  } else if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
    }
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
    } else {
      historyIndex = history.length;
      input.value = "";
    }
    e.preventDefault();
  }
});

// Boot sequence
const bootSequence = [
  { text: "KalOS Boot Loader v2.1.4", delay: 100 },
  { text: "", delay: 200 },
  { text: "Initializing system...", delay: 300, class: "boot-loading" },
  { text: "Loading kernel modules...", delay: 400, class: "boot-loading" },
  { text: "✓ CPU: Intel Core i7-12700K", delay: 200, class: "boot-ok" },
  { text: "✓ Memory: 32GB DDR4", delay: 150, class: "boot-ok" },
  { text: "✓ Storage: 1TB NVMe SSD", delay: 150, class: "boot-ok" },
  { text: "✓ Network: Ethernet Connected", delay: 200, class: "boot-ok" },
  { text: "", delay: 300 },
  { text: "Starting portfolio services...", delay: 200, class: "boot-loading" },
  { text: "✓ Terminal emulator", delay: 150, class: "boot-ok" },
  { text: "✓ Command processor", delay: 150, class: "boot-ok" },
  { text: "✓ Portfolio modules", delay: 150, class: "boot-ok" },
  { text: "✓ Contact system", delay: 150, class: "boot-ok" },
  { text: "", delay: 300 },
  { text: "System ready.", delay: 200, class: "boot-ok" },
  { text: "", delay: 300 }
];

let bootIndex = 0;
const bootOutput = document.getElementById("boot-output");
const bootContainer = document.getElementById("boot-sequence");
const terminal = document.getElementById("terminal");

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
    
    bootIndex++;
    setTimeout(displayBootLine, line.delay);
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
      bootContainer.style.display = 'none';
      terminal.style.display = 'flex';
      input.focus();
      document.removeEventListener('keydown', bootComplete);
      document.removeEventListener('touchstart', bootComplete);
      document.removeEventListener('click', bootComplete);
    }
    
    // Listen for both keyboard and touch/click events
    document.addEventListener('keydown', bootComplete, { once: true });
    document.addEventListener('touchstart', bootComplete, { once: true });
    document.addEventListener('click', bootComplete, { once: true });
  }
}

// Start boot sequence
displayBootLine();

// Load commands list on startup
loadCommands();
