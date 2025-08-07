export default function whoami() {
  const now = new Date();

  // Intl formatter to get the short timezone name (BST/GMT)
  const timeZoneNameFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "short",
  });

  // Get the timezone name (e.g., "BST" or "GMT")
  const parts = timeZoneNameFormatter.formatToParts(now);
  const timeZonePart = parts.find(part => part.type === "timeZoneName");
  const simplifiedTZ = timeZonePart ? timeZonePart.value : "GMT";

  // Get the exact offset in minutes from UTC in Europe/London timezone
  // Trick: Get offset by comparing UTC and local London time
  // This workaround accounts for DST automatically
  function getLondonOffsetMinutes(date) {
    // convert date to ISO string, force UTC
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    // convert date to London time
    const londonDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/London" }));
    // difference in milliseconds
    return (londonDate.getTime() - utcDate.getTime()) / (60 * 1000);
  }

  const offsetMinutes = getLondonOffsetMinutes(now);
  const offsetHours = offsetMinutes / 60;
  const sign = offsetHours >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetHours);

  // Format exact offset as UTC±H or UTC±H:MM
  const exactOffset = `UTC${sign}${absOffset % 1 === 0 ? absOffset : absOffset.toFixed(2)}`;

  return [
    "👤 User Profile:",
    "-------------------------",
    "Name: Kal",
    "Role: IT College Student & Developer",
    `Location: United Kingdom (${simplifiedTZ} / ${exactOffset})`,
    "Skills: Python, JavaScript, Lua, HTML/CSS",
    "Interests: Roblox development, web development, learning new tech",
    "Status: 🟢 Open for Work",
    "-------------------------",
  ].join("\n");
}
