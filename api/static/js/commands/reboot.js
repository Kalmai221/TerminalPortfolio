export default function reboot() {
  const output = document.getElementById("output");
  const lines = [
    { text: "Stopping system services...", delay: 200 },
    { text: " [ OK ] Stopped LVM2 metadata daemon.", delay: 100 },
    { text: " [ OK ] Stopped target Multi-User System.", delay: 150 },
    { text: " [ OK ] Stopped User Login Management.", delay: 100 },
    { text: " [ OK ] Stopped Network Manager.", delay: 100 },
    { text: "Unmounting file systems...", delay: 300 },
    { text: " [ OK ] Unmounted /tmp.", delay: 50 },
    { text: " [ OK ] Unmounted /home.", delay: 50 },
    { text: "Rebooting system...", delay: 500 }
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
    window.location.reload();
  }, currentDelay + 1000);

  return "Rebooting...";
}
