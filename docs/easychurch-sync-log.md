# church-app → easychurch-app 동기화 현황

easychurch-app은 2026-09-13 저녁, church-app 커밋 `5a1cebb`(2026-09-13,
"fix: mediaId searchParams 처리 timing 개선") 시점에서 `git clone` + 저장소 분리로
만들어졌다. 그 이후 church-app에서 추가된 커밋 중 아직 easychurch-app에 반영 안 된
것만 여기서 추적한다.

**기준점(fork point): `5a1cebb`** — 이 커밋 이전 내용은 이미 easychurch-app에 다 있음.

**포팅 주기: 매주 1회 일괄 반영.** 매번 즉시 옮기지 않고, "아직 반영 안 됨" 표에 쌓아뒀다가
주 1회 몰아서 easychurch-app에 반영하는 방식. 그래서 이 표는 항상 빠짐없이 최신 상태로
유지해야 함 — church-app 커밋이 생길 때마다 바로바로 이 문서에 기록.

**다음 정기 포팅 예정일: 2026-10-01 (목) 오후 6시** (9/24분은 미진행 — 이번에 함께 반영) — 매주 목요일 오후 6시 알람 예약됨.
그 사이 church-app에 쌓인 새 커밋을 그날 한꺼번에 반영.

**포팅 대상 분류 (2026-09-17 방침 확정):** ggnch.shop(church-app)은 앞으로도 길가는교회
전용 폐쇄형으로 계속 업데이트되고, 그 중 일부는 easychurch.kr(배포용/범용)에는 안 맞아서
일부러 안 옮길 수 있음. 그래서 "아직 반영 안 됨"에 새 커밋을 적을 때마다 아래처럼
**분류 + 이유**를 같이 남겨서, 다음 포팅 때 골라서 진행할 수 있게 한다.

- 🟢 **범용** — easychurch에도 그대로 필요한 일반 기능/버그수정. 기본적으로 포팅.
- 🟡 **길가는교회 전용** — 이 교회만의 사정(특정 인원 구성, 특정 관습, 이 교회 전용 데이터 등)에
  맞춘 것. easychurch에는 그대로 옮기면 안 되거나 의미 없음 — 포팅 제외 권장.
- ⚪ **판단 필요** — 애매해서 그때 사용자에게 물어봐야 함(예: 특정 교단/교리 색이 강하거나,
  범용일 수도 있지만 확신이 안 서는 것).

새 커밋을 기록할 땐 "내용" 칸에 분류 아이콘 + 왜 그렇게 분류했는지 한 줄 이유를 반드시 붙일 것
(예: "🟡 길가는교회 전용 — 이 교회 제직명단(teamRoster.js)에 강하게 결합된 기능이라
다른 교회엔 의미 없음"). 포팅 시점에 이 분류를 보고 🟢만 자동 진행, 🟡는 사용자에게
"이번엔 빼도 되죠?" 확인, ⚪는 반드시 먼저 물어볼 것.

## ✅ 이미 easychurch-app에 반영됨

| church-app 커밋 | easychurch-app 커밋 | 내용 | 반영일 |
|---|---|---|---|
| `21ba309` | `bb6c3ca` | PWA 딥링크 launch_handler 추가 | (사전 반영) |
| `4298101` | `de702cc` | /media 페이지 Suspense 빌드 실패 수정 | (사전 반영) |
| `04978b5` | `b4cd3f7` | 카톡 딥링크 로그인 후 원래 미디어로 복귀 수정 | (사전 반영) |
| `f2df937` | `2429790` + `bb6c3ca` | media_items 잘못된 트리거 제거 + 공지 알림 회원토글/관리자 푸시선택 | (사전 반영) |
| `dba6cbf` | `ddf9de8` | 회원 권한 목록에서 "교회제안 답변 권한" 제거 | 2026-09-17 |
| `22ac47c` | `e0d02c4` | 교회제안(교회건의) 게시판 완전 삭제 — UI + DB 정책/제약 + send-push 엣지함수 | 2026-09-17 |
| `6867ab3` | `be12331` | 찬양팀 탭 영상 직접업로드 카드 제거(링크만 등록), 영상에 이모지 반응(❤️🙏😊👍) 추가 | 2026-09-17 |
| `4bba462` | `06418ff` | 관리자 방문통계에 활성 회원수 · 채팅 메시지 개수 집계 추가 | 2026-09-17 |
| `17d2378` | `4f77b84` | 설교 음성 업로드 ffmpeg.wasm 자동압축 기능 제거 (원본 그대로 업로드) | 2026-09-17 |
| `0a97411` | `ea6c632` | 오래된 푸시 구독 자동 정리 (90일 미접속 기기, pg_cron) | 2026-09-17 |
| `989ca51` | `5ee9105` | 오늘의 성경 이미지카드 푸시 알림 기능 추가 (/api/daily-verse-image, send-daily-verse 엣지함수, 회원 알림토글) | 2026-09-17 |
| `107aed9` | `e350918` | 오늘의 성경 알림 전체 켜기/끄기 스위치 추가 | 2026-09-17 |
| `4d453ac` | `c667a9a` | 주보 하단 카드(표어/기도제목/섬김이/지난주보) 기본 접힘으로 변경 | 2026-09-17 |
| `c6f408a` | `5ac457e` | 표어 카드 제목 "표어" 중복 표시 수정 | 2026-09-17 |
| `bdcf73f` | `7bd8e66` | 교회력 절기가 일반 일정에 가려 안 보이던 문제 수정 (캘린더) | 2026-09-17 |
| `1645915` | `5913a3f` | 주보 헤더에 교회력 절기 배지 자동 표시 | 2026-09-17 |
| `749a4b5` | `254d707` | 교회일정: 자동 주일예배 일정 제거, 일정있는 날 클릭시 자동스크롤, 날짜칸 크기 조정 | 2026-09-17 |
| `2fccd4a` | `06626bc` | 교회일정 달력 그리드를 셀당 테두리 대신 구분선 방식으로 변경 | 2026-09-17 |
| `0fff5e1` | `5bbc703` | 채팅/게시판 입력창에 카테고리별 이모지 버튼 추가 | 2026-09-17 |
| `0d42fa2` | `3501ed7` | 채팅/게시판 입력창을 카톡 스타일(+ 첨부, 이모지 내장, 화살표 전송)로 통일 | 2026-09-17 |
| `0018101` | `80ec620` | 개별 채팅방에서 플로팅 GGN톡 버튼이 전송 버튼과 겹치던 문제 수정 | 2026-09-17 |
| (church-app 미커밋) | `ba336c2` | 포팅 코드의 ggnch.shop 하드코딩 → easychurch.kr 교체 (easychurch 전용 수정) | 2026-09-17 |

**2026-09-17 일괄 포팅 방법 메모:** church-app을 `git fetch <church-app 로컬 경로> main`으로
easychurch-app에 끌어와서 `git cherry-pick`으로 17개 커밋을 순서대로 적용(충돌 1건,
send-push의 교회제안 분기 제거만 수동 정리). DB 마이그레이션은 각 파일을 읽어서
URL/publishable key만 easychurch 프로젝트(tmlmauznjcfqtugytkfd) 걸로 바꿔 그대로 적용.
send-push, send-daily-verse 엣지함수 재배포. 다음에도 같은 방식(fetch + cherry-pick)이
가장 빠름 — 두 저장소가 공유 히스토리를 갖고 있어서 대부분 충돌 없이 적용됨.

## ⬜ 아직 easychurch-app에 반영 안 됨

| church-app 커밋 | 내용 | 반영일 |
|---|---|---|
| `51c9f8a` | 🟢 범용 — 오늘의 성경 푸시 클릭 시 전체화면 카드 뷰어 추가 | 2026-09-22 |
| `5b8732d` | 🟢 범용 — 관리자 메뉴 안 보이던 버그 수정 (approval_status 컬럼 미존재로 쿼리 실패) | 2026-09-19 |
| `792eaa1` | 🟢 범용 — 자료실 게시판 글쓰기 실패 수정 (제약조건 이름 불일치) | 2026-09-22 |
| `517e6a9` | 🟢 범용 — 주보 '말씀'(설교자) 이름도 회원이면 채팅 링크 연결 | 2026-09-22 |
| `60c453d` | 🟢 범용 — 찬양·영상 클라우드 링크 목록 접기(일반 3개/관리자 전체) | 2026-09-22 |
| `3dcacbd` | 🟢 범용 — 찬양·영상 목록 제목 검색 추가, 관리자도 접기 가능 | 2026-09-22 |
| `e41bfb9`/`b2ac599` | 🟢 범용 — 이용약관/개인정보처리방침 페이지 추가 (Play Store 제출용, easychurch도 필요) | 2026-09-22 |
| `11128de` | 🟢 범용 — 회원가입 완료 화면의 테스트용 안내 문구 제거 | 2026-09-22 |
| `040213c` | 🟢 범용 — teams(제직명단) 페이지가 이용약관으로 잘못 덮어써진 사고 복구 | 2026-09-22 |
| `a33ef0d` | 🟢 범용 — 홈화면 설치 안내 배너 제거(Play Store 배포 후 불필요), 폴더블 폰트 과확대 CSS 수정(`html{font-size:16px}`) | 2026-09-22 |
| `70d5a8c` | 🟢 범용 — 다크 테마 기기에서 라이트/다크 전환 안 되던 문제 수정 (`color-scheme` 메타 추가) | 2026-09-22 |
| `80cd5c5` | ⚪ 판단 필요 — 회원가입 관리자 승인제 준비 코드(미적용). easychurch도 승인제 원하는지 먼저 물어볼 것 | 2026-09-18 |
| `e002141` | 🟢 범용 — graphify 미사용 의존성 제거, hasRole/hasRoleScope 중복 정리 (easychurch는 이미 자체 반영함, `ac5ac1f` 참고 — 충돌 여부 확인 필요) | 2026-09-18 |
| `ae588c3` | 🟢 범용 — 오늘의 성경 카드뷰어 가로모드 전체화면 + 그만보기 버튼 | 2026-09-24 |
| `6399a21` | 🟢 범용 — 공지사항 예약전송 (DB: popup_notices.scheduled_at + pg_cron + UPDATE 트리거, 마이그레이션 URL/키 easychurch로 교체) | 2026-09-26 |
| `ed538ae` | 🟢 범용 — GGN톡 1:1/그룹 메시지 예약전송 (DB: scheduled_messages + pg_cron) | 2026-09-26 |
| `66b7d06` | 🟢 범용 — **버그수정** 그룹채팅(conversation_messages) push 트리거 누락 추가. easychurch도 같은 누락 있을 가능성 높음 — 꼭 확인 (마이그레이션 URL/키 교체) | 2026-09-26 |
| `a10969b` | 🟢 범용 — 여러명 보내기/새 그룹방 첫메시지 입력창에 이모지 버튼 | 2026-09-26 |
| `06d17a4`, `9a42df0`, `b613997`, `8a0feae`, `7727172`, `f7c11c4`, `888239c`, `2e97e89` | 🟢 범용(Android 앱 인프라 묶음) — 앱 자동업데이트, FCM 등록 리스너 순서, 네이티브 🔔 숨김+자동등록, FCM 로그, 배지 정리, 등록 타임아웃. **핵심: `NativePushTapHandler`는 반드시 `AuthProvider` 안에 둘 것**(`2e97e89` — 밖에 두면 user를 못 받아 등록이 전혀 안 됨). 아래 "Android 앱 배포 인프라" 항목과 함께 포팅 | 2026-09-23~26 |
| `7ff611b`, `cc79c26` | 🚫 포팅 불필요 — church-app 전용 versionCode 갱신 | — |
| `3a7d528`, `c46cb30` | 🚫 포팅 불필요 — 임시 진단 alert (이후 커밋에서 제거됨) | — |

**Android 앱 배포 인프라 (TWA→Capacitor 전환, 2026-09-22~23, 커밋 `dfdc8d5`~`7964dc8`):**
🟢 범용이지만 **파일을 그대로 cherry-pick하면 안 됨** — church-app 전용 식별자(패키지명
`shop.ggnch.twa`, Firebase 프로젝트 `ggnch-2847c`, Play Console 서명 키)가 코드에 박혀있어서,
easychurch용으로 포팅하려면 **같은 구조를 easychurch 전용 값으로 새로 설정**해야 함 (Capacitor
프로젝트 자체는 재사용 가능하나 `capacitor.config.ts`의 appId/서버 URL, `android/app/build.gradle`의
applicationId, `google-services.json`, 서명 키 전부 easychurch 것으로 새로 발급).
자세한 배경/이유/겪은 문제들은 memory
[project_capacitor_fcm_migration.md](C:\Users\jazzc\.claude\projects\N-----GGNCH\memory\project_capacitor_fcm_migration.md)와
[project_playstore_signing.md](C:\Users\jazzc\.claude\projects\N-----GGNCH\memory\project_playstore_signing.md)
참고 — church-app에서 겪은 시행착오(Node 버전, base64 시크릿 붙여넣기 실수, force-dark API
버전별 차이, 버전코드 누락 등)를 easychurch에서 반복 안 하도록 그대로 참고할 것.
FCM 푸시 채널(`fcm_tokens` 테이블, `supabase/functions/_shared/fcm.ts`, `send-push`/
`send-daily-verse` 병행 발송 로직)은 코드 자체는 그대로 포팅 가능하나, easychurch 전용 Firebase
프로젝트의 서비스 계정 JSON을 easychurch Supabase 프로젝트(`tmlmauznjcfqtugytkfd`) 시크릿으로
새로 등록해야 동작함.

## 🚫 의도적으로 포팅 제외됨 (길가는교회 전용)

사용자 확인 후 easychurch-app에 일부러 안 옮긴 항목들. 나중에 마음이 바뀌면 여기서 골라서
포팅하면 됨.

| church-app 커밋 | 내용 | 제외 이유 |
|---|---|---|
| (아직 없음) | | |

## 🕓 church-app에도 아직 커밋 안 된 작업중 (당연히 easychurch 미반영)

- 회원가입 관리자 승인제 — 코드는 커밋됨(`80cd5c5`, 위 표에 ⚪로 있음)이나 DB 마이그레이션은
  미적용(2026년 10월 활성화 예정, 10/1 알람 예약됨). `AuthProvider.js`의 프로필 조회 쿼리에서
  `approval_status`를 일부러 빼놓은 상태(넣으면 관리자 메뉴가 깨지는 버그가 있었음 — `5b8732d`
  참고) — 활성화 시점에 다시 넣어야 함.

**TWA(PWABuilder) 시절 커밋들(`d1f6bdc`, `3c7aadd` 등 assetlinks.json 관련)은 포팅 대상에서
제외.** Capacitor로 완전히 갈아탔기 때문에 이제 의미 없는 과거 시도임 — easychurch도 Android
배포하려면 위 "Android 앱 배포 인프라" 항목대로 Capacitor로 바로 가면 됨, TWA를 거칠 필요 없음.

---
_마지막 갱신: 2026-09-26, church-app HEAD `a10969b` 기준. easychurch-app은 여전히 `ba336c2`
(2026-09-17) 기준이라 위 "아직 반영 안 됨" 표 전체가 밀려있음 — 다음 정기 포팅 때 분류대로
진행할 것._
