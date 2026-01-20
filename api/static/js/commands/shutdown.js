export default function shutdown() {
  setTimeout(() => {
    document.body.innerHTML = '<div style="background: black; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: monospace;">[  OK  ] Reached target Power-Off.<br>System halted.</div>';
  }, 1000);
  return "System is shutting down...";
}
