export default function shutdown() {
  const output = document.getElementById("output");
  const lines = [
    { text: "Stopping system services...", delay: 200 },
    { text: " [ OK ] Stopped LVM2 metadata daemon.", delay: 100 },
    { text: " [ OK ] Stopped target Multi-User System.", delay: 150 },
    { text: " [ OK ] Stopped User Login Management.", delay: 100 },
    { text: " [ OK ] Stopped Network Manager.", delay: 100 },
    { text: "Unmounting file systems...", delay: 300 },
    { text: " [ OK ] Unmounted /boot/efi.", delay: 50 },
    { text: " [ OK ] Unmounted /.", delay: 100 },
    { text: "Reached target Power-Off.", delay: 500 }
  ];

  let currentDelay = 0;
  lines.forEach((line) => {
    currentDelay += line.delay;
    setTimeout(() => {
      const div = document.createElement("div");
      div.textContent = line.text;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }, currentDelay);
  });

  setTimeout(() => {
    document.body.innerHTML = '<div style="background: black; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: \'Ubuntu Mono\', monospace; padding: 20px; text-align: left;"><pre>[  OK  ] Reached target Power-Off.\nSystem halted.</pre></div>';
  }, currentDelay + 1000);

  return "Shutting down...";
}
