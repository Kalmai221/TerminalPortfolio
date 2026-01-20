export default async function openBrowserWithInstall(path = "/") {
  const output = document.getElementById("output");
  const parts = path.split("/").filter(p => p);
  const folder = parts[0] || "index";
  const page = parts[1] || "index";

  // ---- INSTALL SIMULATION ----
  const packages = ["xorg", "lightdm", "kalbrowser", "web-server"];
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
  serverLine.innerHTML = `<span style="color: #8ae234">[  OK  ]</span> Starting web server at http://127.0.0.1:8080`;
  container.appendChild(serverLine);
  container.scrollTop = container.scrollHeight;
  await new Promise(res => setTimeout(res, 600));

  // Realistic website logs
  const logMsgs = [
    `[${new Date().toLocaleTimeString()}] INFO: Loading assets...`,
    `[${new Date().toLocaleTimeString()}] DEBUG: Connecting to database...`,
    `[${new Date().toLocaleTimeString()}] INFO: Server listening on port 8080`,
    `[${new Date().toLocaleTimeString()}] GET /static/browsersites/${folder}/${page}.html 200 OK`,
    `[${new Date().toLocaleTimeString()}] GET /static/browsersites/${folder}/style.css 200 OK`,
    `[${new Date().toLocaleTimeString()}] GET /static/browsersites/${folder}/script.js 200 OK`
  ];

  for (let msg of logMsgs) {
    const line = document.createElement("div");
    line.style.color = "#ccc";
    line.style.fontSize = "0.9em";
    line.textContent = msg;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    await new Promise(res => setTimeout(res, 100 + Math.random() * 200));
  }

  const launchLine = document.createElement("div");
  launchLine.textContent = "Launching KalBrowser...";
  container.appendChild(launchLine);
  container.scrollTop = container.scrollHeight;
  await new Promise(res => setTimeout(res, 800));

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

  browser.innerHTML = `
    <div class="browser-header">
      <div class="browser-tabs">
        <div class="tab-list">
           <div class="tab active" title="${folder}/${page}">
             <span class="tab-icon">✨</span>
             <span class="tab-label">${page}</span>
             <span class="tab-close">×</span>
           </div>
           <div class="new-tab-btn">+</div>
        </div>
      </div>
      <div class="browser-toolbar">
        <div class="browser-nav">
          <button id="back-browser" class="toolbar-btn">←</button>
          <button id="forward-browser">→</button>
          <button id="reload-browser" class="toolbar-btn">⟳</button>
        </div>
        <div class="url-bar-container">
          <input type="text" id="url-input" class="url-input" value="http://localhost:8080/${folder}/${page}">
          <div class="url-actions">
            <span class="url-star">☆</span>
          </div>
        </div>
        <div class="browser-menu">
          <button id="inspect-browser" class="toolbar-btn" title="Inspect Element">🛠</button>
          <button id="close-browser-btn" class="toolbar-btn close">×</button>
        </div>
      </div>
    </div>
    <div class="browser-content">Loading...</div>
  `;

  const contentDiv = browser.querySelector(".browser-content");
  const urlInput = browser.querySelector("#url-input");

  // ---- BROWSER CONTROLS ----
  browser.querySelector("#close-browser-btn")?.addEventListener("click", () => {
    browser.remove();
    const terminalElem = document.getElementById("terminal");
    if (terminalElem) terminalElem.style.display = "flex";
  });

  // Reload button logic
  browser.querySelector("#reload-browser")?.addEventListener("click", () => {
    loadBrowserContent(`${folder}/${page}`, browser);
  });

  // URL Bar Interaction
  urlInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const url = urlInput.value.trim();
      if (url.includes("localhost:8080") || url.includes("127.0.0.1:8080")) {
        // Parse folder/page from URL
        const pathMatch = url.split("8080/")[1];
        if (pathMatch) {
          await loadBrowserContent(pathMatch, browser);
        } else {
          await loadBrowserContent("index", browser);
        }
      } else {
        // External URL simulation
        contentDiv.innerHTML = `
          <div class="error-page">
            <div class="error-icon">🌐⚠️</div>
            <h1>Server Not Found</h1>
            <p>KalBrowser can’t find the server at <strong>${url}</strong>.</p>
            <ul>
              <li>Check the address for typing errors such as <strong>ww</strong>.example.com instead of <strong>www</strong>.example.com</li>
              <li>If you are unable to load any pages, check your computer’s network connection.</li>
              <li>If your computer or network is protected by a firewall or proxy, make sure that KalBrowser is permitted to access the Web.</li>
            </ul>
            <button id="retry-btn-error" class="retry-btn">Try Again</button>
          </div>
        `;
        document.getElementById("retry-btn-error")?.addEventListener("click", () => {
           loadBrowserContent(`${folder}/${page}`, browser);
        });
      }
    }
  });

  // Inspect Element with Eruda
  browser.querySelector("#inspect-browser")?.addEventListener("click", () => {
    if (window.eruda) {
       if (window.eruda._isInit) {
         window.eruda.show();
       } else {
         window.eruda.init();
         window.eruda.show();
       }
    } else {
      const script = document.createElement('script');
      script.src = "//cdn.jsdelivr.net/npm/eruda";
      script.onload = () => {
        eruda.init();
        eruda.show();
      };
      document.head.appendChild(script);
    }
  });

  // ---- LOAD WEBSITE ----
  await loadBrowserContent(`${folder}/${page}`, browser);

  return null;
}

// ---- Helper function to load page content ----
async function loadBrowserContent(path, browser) {
  const contentDiv = browser.querySelector(".browser-content");
  const urlInput = browser.querySelector("#url-input");

  const parts = path.split("/").filter(p => p);
  const folder = parts[0] || "index";
  const page = parts[1] || "index";
  
  if (urlInput) {
    urlInput.value = `http://localhost:8080/${folder}/${page}`;
  }

  try {
    const htmlRes = await fetch(`/static/browsersites/${folder}/${page}.html`);
    if (!htmlRes.ok) throw new Error("Page not found");
    const html = await htmlRes.text();
    contentDiv.innerHTML = `<div class="site-container">${html}</div>`;

    // Re-inject assets
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `/static/browsersites/${folder}/style.css`;
    document.head.appendChild(cssLink);

    const jsScript = document.createElement("script");
    jsScript.src = `/static/browsersites/${folder}/script.js`;
    document.body.appendChild(jsScript);
  } catch (err) {
    contentDiv.innerHTML = \`<div style="padding: 20px; color: red;">Error loading page: \${err.message}</div>\`;
  }
}
