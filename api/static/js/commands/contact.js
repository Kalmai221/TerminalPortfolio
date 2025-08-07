export default function contact() {
  const now = new Date();

  const timeZoneNameFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "short",
  });

  const parts = timeZoneNameFormatter.formatToParts(now);
  const timeZonePart = parts.find(part => part.type === "timeZoneName");
  const simplifiedTZ = timeZonePart ? timeZonePart.value : "GMT";

  function getLondonOffsetMinutes(date) {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const londonDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/London" }));
    return (londonDate.getTime() - utcDate.getTime()) / (60 * 1000);
  }

  const offsetMinutes = getLondonOffsetMinutes(now);
  const offsetHours = offsetMinutes / 60;
  const sign = offsetHours >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetHours);
  const exactOffset = `UTC${sign}${absOffset % 1 === 0 ? absOffset : absOffset.toFixed(2)}`;

  return [
    "📧 Contact Information:",
    "======================",
    "",
    "📬 Email: Kal@roschol.uk",
    "🔗 GitHub: github.com/Kalmai221",
    "🎮 Roblox: @Kalmai221P",
    "📬 Discord: itsjustkal",
    "",
    `📍 Location: United Kingdom (${simplifiedTZ} / ${exactOffset})`,
    `⏰ Available: Weekdays 8AM-9PM ${simplifiedTZ}`,
    "",
    "💬 Feel free to reach out for:",
    "• Freelance opportunities",
    "• Collaboration projects",
    "• Technical discussions",
    "• Roblox game development"
  ].join("\n");
}
