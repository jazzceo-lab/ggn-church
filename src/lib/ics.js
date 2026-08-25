function pad(n) {
  return String(n).padStart(2, "0");
}

function escapeIcsText(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function parseTimeLabel(label) {
  if (!label) return null;
  const colonMatch = label.match(/(오전|오후|저녁|새벽)?\s*(\d{1,2}):(\d{2})/);
  const koreanMatch = label.match(/(오전|오후|저녁|새벽)?\s*(\d{1,2})시\s*(?:(\d{1,2})분)?/);
  const match = colonMatch ?? koreanMatch;
  if (!match) return null;

  const [, period, hourStr, minuteStr] = match;
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr ? parseInt(minuteStr, 10) : 0;
  if ((period === "오후" || period === "저녁") && hour < 12) hour += 12;
  if ((period === "오전" || period === "새벽") && hour === 12) hour = 0;
  return { hour, minute };
}

export function buildIcsContent(event) {
  const [year, month, day] = event.event_date.split("-").map(Number);
  const time = parseTimeLabel(event.time_label);
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let dtStartLine;
  let dtEndLine;

  if (time) {
    const dt = `${year}${pad(month)}${pad(day)}T${pad(time.hour)}${pad(time.minute)}00`;
    dtStartLine = `DTSTART:${dt}`;
    dtEndLine = "DURATION:PT1H";
  } else {
    const dateStr = `${year}${pad(month)}${pad(day)}`;
    const endDate = new Date(year, month - 1, day + 1);
    const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
    dtStartLine = `DTSTART;VALUE=DATE:${dateStr}`;
    dtEndLine = `DTEND;VALUE=DATE:${endStr}`;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//길가는교회//교회일정//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@ggnch.shop`,
    `DTSTAMP:${dtstamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.link_url ? `DESCRIPTION:${escapeIcsText(event.link_url)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadIcs(event) {
  const content = buildIcsContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
