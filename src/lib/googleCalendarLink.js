function pad(n) {
  return String(n).padStart(2, "0");
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

// 구글 캘린더 "빠른 추가" 링크. 안드로이드에서 누르면 설치된 구글 캘린더 앱이
// 바로 열리며 일정이 미리 채워진다 (계정 연동 없이 되는 구글 공식 지원 방식).
export function buildGoogleCalendarUrl(event) {
  const [year, month, day] = event.event_date.split("-").map(Number);
  const time = parseTimeLabel(event.time_label);

  let datesParam;
  if (time) {
    const start = `${year}${pad(month)}${pad(day)}T${pad(time.hour)}${pad(time.minute)}00`;
    const endDate = new Date(year, month - 1, day, time.hour, time.minute + 60);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(
      endDate.getDate()
    )}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    datesParam = `${start}/${end}`;
  } else {
    const endDate = new Date(year, month - 1, day + 1);
    const startStr = `${year}${pad(month)}${pad(day)}`;
    const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
    datesParam = `${startStr}/${endStr}`;
  }

  const details = [event.description, event.link_url].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: datesParam,
    ctz: "Asia/Seoul",
  });
  if (details) params.set("details", details);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
