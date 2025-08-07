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


document.addEventListener("keydown", async (e) => {
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
      updateCurrentLineRef();
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
      // Wait a moment for the DOM to update before getting references
      setTimeout(() => {
        updateCurrentLineRef();
      }, 10);
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

// Initialize references when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    updateCurrentLineRef();
  }, 100);
});
