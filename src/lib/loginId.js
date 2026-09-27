// 이메일 없이 휴대폰 번호로 가입한 회원은 Supabase Auth가 이메일을 꼭 요구해서
// "01012345678@phone.ggnch.shop" 같은 내부용 가짜 이메일로 계정을 만든다.
// (가입 인증 메일은 꺼둬서 이 주소로 메일이 나가지 않음)
export const PHONE_EMAIL_DOMAIN = "phone.ggnch.shop";

export function phoneDigits(s) {
  return (s ?? "").replace(/\D/g, "");
}

// "010-1234-5678", "01012345678", 뒤 8자리 "12345678" 모두 같은 계정으로 맞춘다.
export function phoneToEmail(phone) {
  const d = phoneDigits(phone);
  return `${d.length === 8 ? "010" + d : d}@${PHONE_EMAIL_DOMAIN}`;
}

export function isPhoneEmail(email) {
  return (email ?? "").endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

// 로그인 칸에 이메일이든 휴대폰 번호든 넣을 수 있게: "@" 있으면 이메일, 없으면 번호.
export function loginIdToEmail(id) {
  const t = (id ?? "").trim();
  return t.includes("@") ? t : phoneToEmail(t);
}

// 관리자 화면 등에서 가짜 이메일 대신 "휴대폰 가입" 표시.
export function displayEmail(email) {
  return isPhoneEmail(email) ? "(휴대폰 번호로 가입)" : email;
}
