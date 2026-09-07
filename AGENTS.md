<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 프로젝트 작업 규칙 (여러 Claude Code 세션이 이 저장소를 동시에 건드릴 수 있음)

이 저장소는 폰 원격 세션, PC의 여러 채팅창 등 **여러 Claude 세션에서 번갈아/동시에 작업**될 수 있다.
2026-09-08에 이것 때문에 실제 장애가 났다: 한 세션이 `posts.category` → `board_id` 전환 작업을
하면서 "DB 마이그레이션 SQL은 별도 제공함"이라고만 커밋하고 실제 적용 여부를 확인하지 않았고,
그 위에 `userChurchId`(AuthProvider에는 없는 값)에 의존하는 코드를 계속 쌓아서 게시판 글쓰기/조회가
전부 멈췄다. 원인 파악과 복구에 상당한 시간이 들었다.

**모든 세션은 아래를 지킬 것:**

1. **작업 시작 전 실제 상태부터 확인**: 이전 세션(사람이 준 요약이든, 커밋 메시지든, 이 파일의 설명이든)의
   "이미 되어 있다"는 말을 그대로 믿지 말 것. 특히:
   - `git log --oneline -10` 로 최근 커밋을 직접 확인.
   - DB 스키마에 의존하는 작업이면, 코드를 쓰기 전에 반드시 `information_schema.columns` 등으로
     실제 테이블/컬럼 존재 여부를 확인. "SQL은 별도로 제공했다/실행 필수"라고만 적힌 과거 커밋은
     **실제로 적용됐다는 증거가 아니다** — 반드시 라이브 DB에서 직접 재확인할 것.
2. **스키마 변경이 필요하면 반드시 `supabase/migrations/`에 마이그레이션 파일로 남길 것.** SQL을
   "별도로" 전달하고 코드만 커밋하는 방식 금지 — 마이그레이션 파일이 없으면 다른 세션(사람)이
   실제 적용 여부를 추적할 방법이 없다.
3. **멀티테넌시(교회별 분리, `church_id`, `churches` 테이블) 관련 작업은 사용자가 명시적으로
   "이제 두 번째 교회가 생겼다"고 하기 전까지 진행하지 말 것.** 이 앱은 현재 단일 교회(길가는교회)
   전용이며, `church_id`/`churches`/`userChurchId` 같은 멀티테넌시 스캐폴딩을 부분적으로만
   추가하면 실제로는 안 되면서 되는 것처럼 보이는 상태가 되어 위험하다(다른 교회 데이터 유출
   위험 또는 이번처럼 기능 장애). 관리자 대시보드 통합처럼 "여러 설정을 한 곳에 모으고 싶다"는
   요청이 오면, church_id 없이 단일 테넌트로 구현할 것 (이번 `boards` 테이블이 그 예시).
4. **기존 코드를 대폭 바꾸기 전에 `git diff <최근안정커밋> HEAD -- <파일>` 로 최근 변경 이력을
   먼저 검토**해서, 다른 세션이 이미 진행 중이던 작업과 충돌하지 않는지 확인할 것.
5. 작업이 끝나면 커밋 + 푸시까지 마치고, 다음 세션(사람이든 AI든)이 `git log`만 보고도 현재
   상태를 알 수 있게 커밋 메시지를 명확히 쓸 것.
