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

    let progress = 0;
    const total = 20;
    for (let i = 0; i <= total; i++) {
      progress = Math.floor((i / total) * 100);
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
  const existing = document.querySelector(".fake-browser");
  if (existing) existing.remove();

  const browser = document.createElement("div");
  browser.className = "fake-browser fullscreen";
  document.body.appendChild(browser);

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

  // ---- BROWSER CONTROLS ----
  const closeBtn = browser.querySelector("#close-browser");
  if (closeBtn) closeBtn.addEventListener("click", () => browser.remove());

  const reloadBtn = browser.querySelector("#reload-browser");
  if (reloadBtn) reloadBtn.addEventListener("click", () => openBrowserWithInstall(path));

  // Optional: maximize/minimize
  const maximizeBtn = browser.querySelector("#maximize-browser");
  if (maximizeBtn) maximizeBtn.addEventListener("click", () => browser.classList.toggle("fullscreen"));

  const contentDiv = browser.querySelector(".browser-content");
  const urlBar = browser.querySelector(".url-bar");
  const tabsDiv = browser.querySelector(".browser-tabs");

  // ---- LOAD WEBSITE ----
  const parts = path.split("/").filter(p => p);
  const folder = parts[0] || "index";
  const page = parts[1] || "index";
  urlBar.textContent = `http://127.0.0.1:8080/${folder}/${page}`;

  try {
    // Fetch manifest for tabs
    const manifestRes = await fetch(`/static/browsersites/${folder}/manifest.json`);
    let pages = ["index"];
    if (manifestRes.ok) pages = await manifestRes.json();

    tabsDiv.innerHTML = "";
    pages.forEach(p => {
      const tab = document.createElement("div");
      tab.className = `tab${p === page ? " active" : ""}`;
      tab.textContent = p;
      tab.addEventListener("click", () => openBrowserWithInstall(`/${folder}/${p}`));
      tabsDiv.appendChild(tab);
    });

    // Load HTML content inside container to avoid CSS bleed
    const htmlRes = await fetch(`/static/browsersites/${folder}/${page}.html`);
    if (!htmlRes.ok) throw new Error("Page not found");
    const html = await htmlRes.text();
    contentDiv.innerHTML = `<div class="site-container">${html}</div>`;

    // Load website CSS scoped inside container
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `/static/browsersites/${folder}/style.css`;
    document.head.appendChild(cssLink);

    // Load website JS
    const jsScript = document.createElement("script");
    jsScript.src = `/static/browsersites/${folder}/script.js`;
    document.body.appendChild(jsScript);

  } catch (err) {
    contentDiv.textContent = "Error loading page: " + err.message;
  }

  return null;
}
