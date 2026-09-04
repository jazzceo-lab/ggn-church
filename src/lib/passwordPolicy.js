// 연세 있으신 교인분들도 계정을 만드니, 특수문자를 강제하는 식으로 엄격하게
// 막지는 않는다. 최소 길이만 조금 늘리고, 강도는 눈으로 보여주는 정도로만 안내한다.
export const MIN_PASSWORD_LENGTH = 8;

export function passwordStrength(password) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "약함", color: "bg-red-500", text: "text-red-600" };
  if (score <= 2) return { score, label: "보통", color: "bg-amber-500", text: "text-amber-600" };
  return { score, label: "강함", color: "bg-green-500", text: "text-green-600" };
}
