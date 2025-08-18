import openBrowser from "../browser.js";

export default async function mywork() {
  const container = document.createElement("div");
  container.className = "command-output";
  document.getElementById("output").appendChild(container);

  const steps = [
    "Starting web server at http://127.0.0.1:8080",
    "Launching Firefox..."
  ];

  for (const s of steps) {
    const line = document.createElement("div");
    line.textContent = s;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    await new Promise(r => setTimeout(r, 600));
  }

  // Open the browser at /mywork
  openBrowser("/mywork");
  return null;
}
