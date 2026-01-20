export default async function openBrowserWithInstall(path = "/") {
  const output = document.getElementById("output");

  // ---- INSTALL SIMULATION ----
  const packages = ["xorg", "lightdm", "firefox", "web-server"];
  const installedPackages = ["xorg"]; // simulate already installed
  const container = document.createElement("div");
  container.className = "command-output";
  output.appendChild(container);

  const depMsgs = ["Checking dependencies...", "Retrieving package metadata...", "Analyzing system state..."];
  for (let msg of depMsgs) {
    const line = document.createElement("div");
    line.textContent = msg;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    await new Promise(res => setTimeout(res, 500 + Math.random() * 500));
  }

  for (let pkg of packages) {
    const line = document.createElement("div");
    container.appendChild(line);

    if (installedPackages.includes(pkg)) {
      line.textContent = `Package ${pkg} is already installed. [OK]`;
      container.scrollTop = container.scrollHeight;
      await new Promise(res => setTimeout(res, 400 + Math.random() * 400));
      continue;
    }

    const steps = [
      `Preparing to unpack ${pkg}...`,
      `Unpacking ${pkg}...`,
      `Configuring ${pkg}...`,
      `Setting up ${pkg}...`
    ];

    for (let step of steps) {
      line.textContent = step;
      container.scrollTop = container.scrollHeight;
      await new Promise(res => setTimeout(res, 400 + Math.random() * 400));
    }

    for (let i = 0; i <= 20; i++) {
      const progress = Math.floor((i / 20) * 100);
      line.textContent = `Installing ${pkg}... [${progress}%]`;
      container.scrollTop = container.scrollHeight;
      await new Promise(res => setTimeout(res, 80 + Math.random() * 80));
    }

    line.textContent = `Installing ${pkg}... [OK]`;
    installedPackages.push(pkg);
  }

  const serverLine = document.createElement("div");
  serverLine.textContent = "Starting web server at http://127.0.0.1:8080";
  container.appendChild(serverLine);
  container.scrollTop = container.scrollHeight;
  await new Promise(res => setTimeout(res, 600));

  const launchLine = document.createElement("div");
  launchLine.textContent = "Launching browser...";
  container.appendChild(launchLine);
  container.scrollTop = container.scrollHeight;
  await new Promise(res => setTimeout(res, 600));

  // ---- BROWSER UI ----
  let browser = document.querySelector(".fake-browser");
  if (!browser) {
    browser = document.createElement("div");
    browser.className = "fake-browser fullscreen";
    document.body.appendChild(browser);
  }

  // Hide terminal while browser is active
  const terminal = document.getElementById("terminal");
  if (terminal) terminal.style.display = "none";
  
  // Disable terminal keyboard events by adding a flag or checking visibility
  // terminal.js already checks visibility, but we ensure it's hidden.

  browser.innerHTML = `
    <div class="browser-header">
      <div class="browser-controls">
        <button id="minimize-browser">_</button>
        <button id="maximize-browser">□</button>
        <button id="reload-browser">⟳</button>
        <button id="close-browser">×</button>
      </div>
      <div class="url-bar">Loading...</div>
      <div class="browser-tabs"></div>
    </div>
    <div class="browser-content">Loading...</div>
  `;

  const contentDiv = browser.querySelector(".browser-content");
  const urlBar = browser.querySelector(".url-bar");
  const tabsDiv = browser.querySelector(".browser-tabs");

  // ---- BROWSER CONTROLS ----
  browser.querySelector("#close-browser")?.addEventListener("click", () => {
    browser.remove();
    if (terminal) terminal.style.display = "flex";
  });
  // Minimize button
  const minimizeBtn = browser.querySelector("#minimize-browser");
  minimizeBtn.addEventListener("click", () => {
    browser.classList.toggle("minimized");
    browser.style.position = browser.classList.contains("minimized") ? "absolute" : "";
    browser.style.width = browser.classList.contains("minimized") ? "300px" : "100vw";
    browser.style.height = browser.classList.contains("minimized") ? "200px" : "100vh";
    browser.style.top = browser.classList.contains("minimized") ? "50px" : "";
    browser.style.left = browser.classList.contains("minimized") ? "50px" : "";
  });

  // Drag handler
  const header = browser.querySelector(".browser-header");
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    if (!browser.classList.contains("minimized")) return; // only drag when minimized
    isDragging = true;
    offsetX = e.clientX - browser.offsetLeft;
    offsetY = e.clientY - browser.offsetTop;
    browser.style.transition = "none"; // disable transitions while dragging
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    browser.style.left = `${e.clientX - offsetX}px`;
    browser.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    browser.style.transition = ""; // restore transitions
  });


  // ---- Smooth Reload ----
  browser.querySelector("#reload-browser")?.addEventListener("click", async () => {
    contentDiv.style.transition = "opacity 0.3s ease";
    contentDiv.style.opacity = 0;        // fade out
    contentDiv.innerHTML = "";            // clear previous content
    contentDiv.style.background = "#fff"; // white screen

    const spinner = document.createElement("div");
    spinner.textContent = "⏳ Reloading...";
    spinner.style.textAlign = "center";
    spinner.style.padding = "50px 0";
    contentDiv.appendChild(spinner);

    await new Promise(res => setTimeout(res, 400)); // brief delay for UX

    // Reload page content
    await loadBrowserContent(path, browser);

    // fade in
    contentDiv.style.opacity = 1;
    contentDiv.style.background = "transparent";
  });

  // ---- LOAD WEBSITE ----
  await loadBrowserContent(path, browser);

  return null;
}

// ---- Helper function to load page content ----
async function loadBrowserContent(path, browser) {
  const contentDiv = browser.querySelector(".browser-content");
  const urlBar = browser.querySelector(".url-bar");
  const tabsDiv = browser.querySelector(".browser-tabs");

  const parts = path.split("/").filter(p => p);
  const folder = parts[0] || "index";
  const page = parts[1] || "index";
  urlBar.textContent = `http://127.0.0.1:8080/${folder}/${page}`;

  try {
    const manifestRes = await fetch(`/static/browsersites/${folder}/manifest.json`);
    let pages = ["index"];
    if (manifestRes.ok) pages = await manifestRes.json();

    tabsDiv.innerHTML = "";
    pages.forEach(p => {
      const tab = document.createElement("div");
      tab.className = `tab${p === page ? " active" : ""}`;
      tab.textContent = p;
      tab.addEventListener("click", () => {
        if (p !== page) {
          loadBrowserContent(`/${folder}/${p}`, browser);
        }
      });
      tabsDiv.appendChild(tab);
    });

    const htmlRes = await fetch(`/static/browsersites/${folder}/${page}.html`);
    if (!htmlRes.ok) throw new Error("Page not found");
    const html = await htmlRes.text();
    contentDiv.innerHTML = `<div class="site-container">${html}</div>`;

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `/static/browsersites/${folder}/style.css`;
    document.head.appendChild(cssLink);

    const jsScript = document.createElement("script");
    jsScript.src = `/static/browsersites/${folder}/script.js`;
    document.body.appendChild(jsScript);
  } catch (err) {
    contentDiv.textContent = "Error loading page: " + err.message;
  }
}
