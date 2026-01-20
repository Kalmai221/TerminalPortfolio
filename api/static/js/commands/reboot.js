export default function reboot() {
  setTimeout(() => {
    window.location.reload();
  }, 1000);
  return "System is rebooting now...";
}
