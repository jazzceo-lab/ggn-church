# church-app → easychurch-app 동기화 현황

easychurch-app은 2026-09-13 저녁, church-app 커밋 `5a1cebb`(2026-09-13,
"fix: mediaId searchParams 처리 timing 개선") 시점에서 `git clone` + 저장소 분리로
만들어졌다. 그 이후 church-app에서 추가된 커밋 중 아직 easychurch-app에 반영 안 된
것만 여기서 추적한다.

**기준점(fork point): `5a1cebb`** — 이 커밋 이전 내용은 이미 easychurch-app에 다 있음.

**포팅 주기: 매주 1회 일괄 반영.** 매번 즉시 옮기지 않고, "아직 반영 안 됨" 표에 쌓아뒀다가
주 1회 몰아서 easychurch-app에 반영하는 방식. 그래서 이 표는 항상 빠짐없이 최신 상태로
유지해야 함 — church-app 커밋이 생길 때마다 바로바로 이 문서에 기록.

**다음 정기 포팅 예정일: 2026-10-08 (목) 오후 6시** — 10/1분 반영 완료(🟢 범용 전부 + 보안). 매주 목요일 오후 6시 알람 예약됨.
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
| `51c9f8a` | `9933e1b` | 오늘의 성경 푸시 클릭 시 전체화면 카드 뷰어 (교회명 동적 전달로 수정) | 2026-09-24 |
| `792eaa1` | `9933e1b` | 자료실 게시판 글쓰기 실패 수정 (posts_category_check) | 2026-09-24 |
| `517e6a9` | `9933e1b` | 주보 '말씀'(설교자) 이름도 회원이면 채팅 링크 | 2026-09-24 |
| `60c453d`, `3dcacbd` | `9933e1b` | 찬양·영상 목록 접기 + 제목 검색 | 2026-09-24 |
| `a33ef0d` | `9933e1b` | 설치 안내 배너 제거, 폴더블 폰트 과확대 수정 | 2026-09-24 |
| `70d5a8c` | `9933e1b` | 다크 테마 기기 라이트/다크 전환 수정 (`color-scheme`) | 2026-09-24 |
| `11128de` | `9933e1b` | 회원가입 완료 화면 테스트 문구 제거 (easychurch signup에 해당 문구 없음 확인) | 2026-09-24 |
| `e002141` | `ac5ac1f` | graphify 제거, hasRole 중복 정리 (easychurch 자체 반영) | (사전 반영) |
| `db623be` | `4ceb770 (휴대폰 가입은 서버 생성·가짜 도메인 phone.easychurch.kr, 비번 초기화 같은 교회만)` | ⚪ 판단 필요 — 이메일 인증 없이 휴대폰 번호 가입/로그인(내부용 가짜이메일 `{번호}@phone.ggnch.shop`) + 승인제 실제 적용(AuthProvider가 appro | 2026-10-02 |
| `428c81f` | `4ceb770` | ⚪ 판단 필요 — 환영 쪽지를 승인 순간에 발송(트리거 2개로 분리), 🔔 안내 문구 제거. 승인제(`db623be`)와 묶어서 판단 | 2026-10-02 |
| `80cd5c5` | `4ceb770 (승인제 교회별 church_info.signup_approval_required)` | ⚪ 판단 필요 — 회원가입 관리자 승인제 준비 코드(미적용). 9/24 포팅 때 보류: `app_settings`가 교회별(church_id)이 아닌 전역 설정이고 가입 트리거가  | 2026-10-02 |
| `66b7d06` | `9200f7e` | 🟢 범용 — **버그수정** 그룹채팅(conversation_messages) push 트리거 누락 추가. **easychurch 마이그레이션에도 conversation_messages 트리거 없음 확인(9/27) | 2026-10-01 |
| `ae588c3` | `e495c38` | 🟢 범용 — 오늘의 성경 카드뷰어 가로모드 전체화면 + 그만보기 버튼 (카드뷰어는 9/24 반영됨, 교회명 동적 처리 부분만 충돌 주의) | 2026-10-01 |
| `a10969b` | `e495c38` | 🟢 범용 — 여러명 보내기/새 그룹방 첫메시지 입력창에 이모지 버튼 | 2026-10-01 |
| `94bcc61` | `e495c38` | 🟢 범용 — 메시지 입력창 화면 절반까지 자동확장 + 웹 드래그 크기조절 | 2026-10-01 |
| `6399a21` | `7776335 (같은 교회만 비활성화)` | 🟢 범용 — 공지사항 예약전송 (DB: popup_notices.scheduled_at + pg_cron + UPDATE 트리거). easychurch에선 트리거/cron을 `private.edge_headers( | 2026-10-01 |
| `ed538ae` | `7776335 (church_id+RLS)` | 🟢 범용 — GGN톡 1:1/그룹 메시지 예약전송 (DB: scheduled_messages + pg_cron). easychurch에선 `church_id` + 교회별 RLS 추가하고 edge_headers로 재 | 2026-10-01 |
| `7536de8` | `e495c38` | 🟢 범용 — 교독문·사도신경 글자 확대 (핀치/−＋ 버튼, 배율 기기에 기억) | 2026-10-01 |
| `8424943` | `4346a24 (약어만, 청년부 제외)` | 🟢 범용(일부) — bibleBooks.js에 splitBibleRefs(자유 텍스트 속 성경구절 자동 링크) + 성경 약어 66권(신·고전·요일 등, 앞에 한글 붙으면 제외해 '오전 10:30' 오인 방지). 청 | 2026-10-01 |
| `74c5b07` | `4346a24 (게시판 버그만, 청년부 제외)` | 🟡 청년부 게시판 권한(길가는교회 전용). 단 **게시판 ?category= 주소로 열면 boards 로딩 후 'help'로 되돌아가던 버그 수정(requestedCategoryRef)은 🟢 범용** — easy | 2026-10-01 |
| `e28b9bd` | `9200f7e` | 🟢 범용 — **send-push: 구역 게시판 새 글 알림이 전 교인에게 가서 다른 구역 글 제목이 노출되던 문제** → 해당 구역 회원에게만 발송. easychurch send-push도 같은 구조인지 확인(멀 | 2026-10-01 |
| `7ac07ea` | `cd0e5ac` | 🟢 범용 — **Android MainActivity: intent:// 링크(카톡 공유)를 인텐트로 열기** (Capacitor 기본 처리는 조용히 실패 → 앱에서 모든 카톡 공유 무반응). easychurch  | 2026-10-01 |
| `2a9a0a9` | `7caa45c (수정 권한=플랫폼 운영자)` | 🟢 범용 — 앱 새 버전 안내 보완(app_version 테이블 + NativeAppUpdateChecker 비교 + 관리자 입력칸). easychurch는 앱 패키지·링크 다르게 | 2026-10-01 |
| `ac839d8` | `e495c38` | 🟢 범용 — 찬송가 제목·장번호 검색 + hymnTitles.js 645장 전체 제목(easychurch 찬송가 메뉴 있으면 그대로 사용 가능. 단 상용 배포 시 찬송가 메뉴 제거 방침 참고) | 2026-10-01 |
| `27ed796` | `6d701f0` | 🟢 범용 — **보안(최우선)** member_directory/bulletins_public 뷰의 anon/authenticated 쓰기권한 회수(뷰가 소유자권한이라 비로그인도 profiles·bulletins  | 2026-10-01 |
| `06d17a4` | `7caa45c` | 🟢 범용(Android 앱 인프라 묶음) — 앱 자동업데이트, FCM 등록 리스너 순서, 네이티브 🔔 숨김+자동등록, FCM 로그, 배지 정리, 등록 타임아웃. **핵심: `NativePushTapHandler` | 2026-10-01 |

**2026-09-24 수동 포팅 메모:** 이 문서 갱신 없이 easychurch-app `9933e1b`로 일부 항목이 직접
포팅됐었음 → 2026-09-27 정기 점검 때 커밋 대조로 확인해서 위에 반영.

**⚠️ 2026-09-27 기준 저장소 상황 변화 — 이제 cherry-pick이 예전처럼 깔끔하지 않음:**
- easychurch-app이 `ba336c2` 이후 47커밋 앞서 있음: **멀티테넌시**(모든 테이블 `church_id` + 교회별 RLS),
  **주보 v2**(페이지→섹션 구조, `parse-bulletin` 전면 개편), 새가족/출석/헌금/봉사당번 등.
  → church-app의 새 테이블·트리거·RLS는 그대로 적용하면 교회 간 데이터가 섞임. `church_id`/RLS를 붙여 재작성해야 함.
- easychurch `3f239e1`(20260926000000_internal_secret.sql): 엣지함수 호출이 **publishable key가 아니라
  `private.edge_headers()`(x-internal-secret)** 로 보호됨. church-app 마이그레이션의 트리거/cron은
  "URL/키만 교체"가 아니라 **`private.edge_headers()`를 쓰도록 바꿔야** 함(안 바꾸면 403).

**2026-09-17 일괄 포팅 방법 메모:** church-app을 `git fetch <church-app 로컬 경로> main`으로
easychurch-app에 끌어와서 `git cherry-pick`으로 17개 커밋을 순서대로 적용(충돌 1건,
send-push의 교회제안 분기 제거만 수동 정리). DB 마이그레이션은 각 파일을 읽어서
URL/publishable key만 easychurch 프로젝트(tmlmauznjcfqtugytkfd) 걸로 바꿔 그대로 적용.
send-push, send-daily-verse 엣지함수 재배포. 다음에도 같은 방식(fetch + cherry-pick)이
가장 빠름 — 두 저장소가 공유 히스토리를 갖고 있어서 대부분 충돌 없이 적용됨.

## ⬜ 아직 easychurch-app에 반영 안 됨

| church-app 커밋 | 내용 | 반영일 |
|---|---|---|
| `d045a7e` | ⚪ 판단 필요 — 주보 AI 자동채우기에 기도제목 추출. **easychurch는 주보 v2(`6887198`)로 parse-bulletin을 섹션 id 기반으로 전면 개편해서 cherry-pick 불가** — v2가 이미 커버하는지 확인 후 불필요면 제외 | 2026-09-26 |
| `4080e3b` | ⚪ 판단 필요 — 주보 예배 인도자 입력칸 + AI 추출. 위와 같은 이유(주보 v2 구조와 다름)로 그대로 못 옮김 — v2에 '인도자' 섹션/필드로 새로 넣을지 결정 필요 | 2026-09-26 |
| `2dd890e` | 🚫 포팅 불필요 — 개인 화면 색(테마)은 easychurch에서 church-app으로 역포팅한 것(easychurch 원본: 20260930000000_profile_theme.sql). 같은 커밋의 채팅통계 권한 회수는 위 보안 항목 참고 | — |
| `21b774f` | 🟡 길가는교회 전용 — 청년부 전용 메뉴(청년부 화면·청년부 주보·youth_officer 역할, can_manage_youth/can_view_youth). 특정 부서명·권한 구성에 맞춘 것이라 easychurch엔 부서 기능으로 일반화하지 않는 한 불필요 | 2026-09-30 |
| `44e8c18` | 🟡 청년부 신청·설문·주보 표지·카톡공유(길가는교회 전용 권한). 신청·설문 자체는 easychurch 원본에서 가져온 것이라 역포팅 불필요. KakaoShareButton의 imageUrl 옵션만 🟢 범용 | 2026-09-30 |
| `4d07301` | 🟡 청년부 일정(calendar_events.department)·단톡방(join_youth_chat)·공지 알림(youth_notices + send-push 분기) — 길가는교회 전용. 일반화하면 '부서별 일정·단톡방·공지'로 easychurch에 쓸 수 있음 | 2026-10-01 |
| `e41bfb9`/`b2ac599` | ⚪ 판단 필요 — 이용약관/개인정보처리방침 페이지. 9/24 포팅 때 보류됨(easychurch 개인정보처리방침은 이미 자체 수정본, 이용약관은 내용 미정). easychurch용 약관 문구를 정해야 진행 가능 | 2026-09-22 |
| `5b8732d` | 🚫 포팅 불필요 — easychurch AuthProvider엔 애초에 approval_status 조회가 없어서 이 버그 자체가 없음(9/27 확인) | — |
| `040213c` | 🚫 포팅 불필요 — church-app에서 이용약관이 teams 페이지를 덮어쓴 사고 복구. easychurch엔 약관이 안 들어가서 해당 사고 없음 | — |
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
_마지막 갱신: 2026-10-01 정기 포팅 — 🟢 범용·보안 항목 easychurch 반영 완료(easychurch HEAD `7776335`). 남은 것: ⚪ 판단 필요(승인제·휴대폰 가입·주보 AI 기도제목/인도자·이용약관), 🟡 청년부 전용, Android 묶음 중 b613997·f7c11c4·9a42df0·2e97e89·8a0feae는 easychurch 자체 구현으로 대체(294edab/364dea7/f40c8d2)._
