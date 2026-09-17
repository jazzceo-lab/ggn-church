# church-app → easychurch-app 동기화 현황

easychurch-app은 2026-09-13 저녁, church-app 커밋 `5a1cebb`(2026-09-13,
"fix: mediaId searchParams 처리 timing 개선") 시점에서 `git clone` + 저장소 분리로
만들어졌다. 그 이후 church-app에서 추가된 커밋 중 아직 easychurch-app에 반영 안 된
것만 여기서 추적한다.

**기준점(fork point): `5a1cebb`** — 이 커밋 이전 내용은 이미 easychurch-app에 다 있음.

**포팅 주기: 매주 1회 일괄 반영.** 매번 즉시 옮기지 않고, "아직 반영 안 됨" 표에 쌓아뒀다가
주 1회 몰아서 easychurch-app에 반영하는 방식. 그래서 이 표는 항상 빠짐없이 최신 상태로
유지해야 함 — church-app 커밋이 생길 때마다 바로바로 이 문서에 기록.

## ✅ 이미 easychurch-app에 반영됨 (다른 세션에서 직접 포팅)

| church-app 커밋 | easychurch-app 커밋 | 내용 |
|---|---|---|
| `21ba309` | `bb6c3ca` | PWA 딥링크 launch_handler 추가 |
| `4298101` | `de702cc` | /media 페이지 Suspense 빌드 실패 수정 |
| `04978b5` | `b4cd3f7` | 카톡 딥링크 로그인 후 원래 미디어로 복귀 수정 |
| `f2df937` | `2429790` + `bb6c3ca` | media_items 잘못된 트리거 제거 + 공지 알림 회원토글/관리자 푸시선택 |

## ⬜ 아직 easychurch-app에 반영 안 됨

| church-app 커밋 | 내용 |
|---|---|
| `dba6cbf` | 회원 권한 목록에서 "교회제안 답변 권한" 제거 |
| `22ac47c` | 교회제안(교회건의) 게시판 완전 삭제 — UI + DB 정책/제약 + send-push 엣지함수 |
| `6867ab3` | 찬양팀 탭 영상 직접업로드 카드 제거(링크만 등록), 영상에 이모지 반응(❤️🙏😊👍) 추가 |
| `4bba462` | 관리자 방문통계에 활성 회원수 · 채팅 메시지 개수 집계 추가 |
| `17d2378` | 설교 음성 업로드 ffmpeg.wasm 자동압축 기능 제거 (원본 그대로 업로드) |
| `0a97411` | 오래된 푸시 구독 자동 정리 (90일 미접속 기기, pg_cron) |
| `cc70c64` | (문서만) easychurch-app 동기화 현황 문서 추가 — 포팅 대상 아님 |
| `989ca51` | 오늘의 성경 이미지카드 푸시 알림 기능 추가 (/api/daily-verse-image, send-daily-verse 엣지함수, 회원 알림토글) |
| `107aed9` | 오늘의 성경 알림 전체 켜기/끄기 스위치 추가 |
| `4d453ac` | 주보 하단 카드(표어/기도제목/섬김이/지난주보) 기본 접힘으로 변경 |
| `c6f408a` | 표어 카드 제목 "표어" 중복 표시 수정 |
| `bdcf73f` | 교회력 절기가 일반 일정에 가려 안 보이던 문제 수정 (캘린더) |
| `1645915` | 주보 헤더에 교회력 절기 배지 자동 표시 |
| `749a4b5` | 교회일정: 자동 주일예배 일정 제거, 일정있는 날 클릭시 자동스크롤, 날짜칸 크기 조정 |
| `2fccd4a` | 교회일정 달력 그리드를 셀당 테두리 대신 구분선 방식으로 변경 (제목 표시폭 확대) |
| `0fff5e1` | 채팅/게시판 입력창에 카테고리별 이모지 버튼 추가 |
| `0d42fa2` | 채팅/게시판 입력창을 카톡 스타일(+ 첨부, 이모지 내장, 화살표 전송)로 통일 |

## 🕓 church-app에도 아직 커밋 안 된 작업중 (당연히 easychurch 미반영)

- 회원가입 관리자 승인제 — 코드만 준비됨, 미적용/미커밋 (2026년 10월 활성화 예정, 10/1 알람 예약됨)
  - `supabase/migrations/20261001000000_signup_approval.sql`
  - `src/components/AuthProvider.js` (승인대기 화면)
  - `src/app/admin/members/page.js` (on/off 스위치, 승인 버튼, 제직명단 일치 배지)
  - `supabase/functions/send-push/index.ts` (승인요청 알림 문구)

---
_마지막 갱신: 2026-09-17, church-app HEAD `0d42fa2` 기준. church-app에 새 커밋이 쌓이면
이 표의 "아직 반영 안 됨" 목록에 이어서 추가할 것._
