// 채팅/게시판 이모지 버튼에 쓰는 큐레이션 목록. 라이브러리 없이 유니코드 문자만 나열.
export const EMOJI_CATEGORIES = [
  {
    key: "faces",
    label: "얼굴",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "😘", "😋", "😛", "🤗", "🤔",
      "😐", "🙄", "😏", "😣", "😥", "😮", "😪", "😴", "😌", "😔",
      "😢", "😭", "😤", "😠", "😡", "🥺", "😨", "😰", "🤯", "😳",
      "🥵", "🥶", "😷", "🤒", "🥳", "😎", "🤓", "🥲",
    ],
  },
  {
    key: "hands",
    label: "손동작",
    emojis: [
      "👍", "👎", "👌", "🤞", "✌️", "🤟", "🤘", "👋", "🖐️", "✋",
      "🙌", "🤲", "🙏", "✍️", "💪", "👊", "👉", "👈", "👆", "👇",
      "☝️", "👏",
    ],
  },
  {
    key: "hearts",
    label: "하트·기타",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💗",
      "💖", "💯", "✨", "🎉", "🎊", "🎁", "🌸", "🌟", "⭐️", "🌈",
      "☀️", "⛪️", "✝️", "📖", "🕊️",
    ],
  },
];

export const DEFAULT_FREQUENT = ["👍", "❤️", "🙏", "😊", "😂", "🎉", "👏", "😢"];

const RECENT_KEY = "recentEmojis";
const RECENT_MAX = 12;

export function getRecentEmojis() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.length ? list : DEFAULT_FREQUENT;
  } catch {
    return DEFAULT_FREQUENT;
  }
}

export function pushRecentEmoji(emoji) {
  try {
    const list = getRecentEmojis().filter((e) => e !== emoji);
    list.unshift(emoji);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    // 저장 실패해도(프라이빗 모드 등) 이모지 삽입 자체는 계속 동작해야 하므로 무시.
  }
}
