export const districts = [
  ["1구역", "최현희", "양유라 배예지 정하영 이다혜 손정은 임다은"],
  ["2구역", "최진아", "장다희 김혜정 배은영 정하은 이혜진 최지연"],
  ["3구역", "김안나", "권영나 원지혜 최지우 양유희 김희애"],
  ["4구역", "조희애", "김희선 양유진 이아소 곽신애 유효림 이단비"],
  ["5구역", "황혜경", "양혜림 오현주 김윤주 윤진영 정은선"],
  ["6구역", "변수진", "김정혜 나혜라 최지원 윤혜미 황희경"],
  ["7구역", "변수연", "임선미 봉길선 김민형 신유정 이윤희"],
  ["8구역", "이종남", "여정숙 송은옥 조미경 조윤이 조미숙"],
  ["9구역", "허정숙", "여정희 김인자 김인애 김광숙 이정희 이기순"],
  ["10구역", "신경희", "이명순 김호숙 강지연 황연옥 이동균 곽영숙"],
  ["11구역", "신경례", "정계욱 문화임 공미석 이리옥 유정순"],
  ["12구역", "정순복", "김정숙A 문애순 김호신 조광순 이순임 김정숙B"],
  ["특별구역", "여정희", "최금수 이황녀 송인순 노윤분"],
  ["남자구역1", "임상주", "김훈겸 김지현 이규빈 신유진 김민준 박선우 최준휘"],
  ["남자구역2", "윤슬기", "박윤선 김홍일 김경준 배병수 원호연 박준홍 김현진"],
  ["남자구역3", "유헌", "최현 이수영 김용민 서동화 정현범 정태영 장성훈"],
  ["남자구역4", "장성철", "김상진 진주현 정상원 변성수 서홍욱"],
  ["남자구역5", "조태형", "양갑수 양경석 구자춘 조재원 백구현 김진명 오창섭 이형진 배준형"],
];

// 쪽지 대상 분류, 회원가입 시 소속 구역 선택에 쓰는 구역 이름 목록
export const DISTRICT_NAMES = districts.map(([name]) => name);

// 구역 외에 회원가입 시 선택할 수 있는 부서 구분
export const DEPARTMENT_GROUPS = ["청소년부", "청년부"];

// 회원가입/쪽지 대상 선택 화면에서 실제로 보여줄 전체 구분 목록
export const SIGNUP_GROUP_OPTIONS = ["목회자", ...DISTRICT_NAMES, ...DEPARTMENT_GROUPS];

export const CHOIR = [
  ["지휘", "나혜라"],
  ["반주", "최진아"],
  ["소프라노", "김윤주 송은옥 오현주 윤진영 이아소 황혜경 황희경"],
  ["알토", "공미석 김인애 김호숙 김희선 조미경 조윤이 최지원"],
  ["테너", "김상진 김지현 노희일 유헌 서홍욱 이형진 장성철"],
  ["베이스", "김용민 김윤태 오창섭 임상주 조태형 주현진 최학수"],
];

export const DEPARTMENTS = [
  {
    name: "영유아부",
    leads: [
      ["부장", "여정숙"],
      ["부감", "임선미"],
      ["지도권사", "김정숙"],
    ],
    teachers: "김경준 김안나 박지선 배윤경 양유라 양유진 원지혜 조희애",
  },
  {
    name: "아동부",
    leads: [
      ["부장", "변수연"],
      ["부감", "신유정"],
      ["지도권사", "이명순"],
    ],
    teachers: "박준홍 배예지 손정은 윤혜미 이다혜 이은혜 최인서 최현희",
  },
  {
    name: "청소년부",
    leads: [
      ["부장", "최현"],
      ["부감", "윤슬기"],
      ["지도권사", "허정숙"],
    ],
    teachers: "김홍일 임다은 배은영 정하은 정하영 이성빈",
  },
  {
    name: "청년부",
    leads: [
      ["부장", "유헌"],
      ["부감", "조윤이"],
      ["지도권사", "이종남"],
    ],
  },
  {
    name: "장년부",
    leads: [
      ["부장", "신경희"],
      ["부감", "봉길선"],
    ],
  },
  {
    name: "백향숲",
    leads: [
      ["부장", "김택영"],
      ["부감", "김호숙"],
    ],
  },
  {
    name: "새가족부",
    leads: [
      ["부장", "임상주"],
      ["부감", "황희경"],
    ],
  },
];

function collectRosterNames() {
  const names = new Set();
  for (const [, leader, members] of districts) {
    if (leader) names.add(leader);
    for (const n of (members ?? "").split(/\s+/).filter(Boolean)) names.add(n);
  }
  for (const [, members] of CHOIR) {
    for (const n of members.split(/\s+/).filter(Boolean)) names.add(n);
  }
  for (const dept of DEPARTMENTS) {
    for (const [, name] of dept.leads ?? []) names.add(name);
    for (const n of (dept.teachers ?? "").split(/\s+/).filter(Boolean)) names.add(n);
  }
  return names;
}

// 제직명단·구역 편성표(teams 페이지) 전체에 등장하는 이름의 총 인원수(중복 제거).
export const TOTAL_ROSTER_COUNT = collectRosterNames().size;
