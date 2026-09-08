---
name: cp
description: Safely commit and push all pending changes in the church-app repository before ending a session or switching to a different device/session (phone, another chat window, etc.). Use this whenever the user says things like "커밋하고 푸시해줘", "지금까지 변경사항 커밋하고 푸시해줘", "세션 정리해줘", "다른 데서 이어서 할게" (I'll continue elsewhere), "여기서 끝낼게" (wrapping up here), or otherwise signals they're about to switch away from this session and want the working tree left clean. Also trigger proactively near the end of a work session on this repo, even if the user doesn't explicitly name "git" or "commit" — the goal is a clean handoff so the next session (on any device) starts from accurate, pushed state.
---

# Wrap up a church-app session

This repo (church-app, 길가는교회) is worked on from multiple Claude Code sessions across
devices (phone remote, PC, multiple chat windows). A past incident happened because one
session left work uncommitted when the user switched devices, and the next session built
on stale assumptions about what already existed — causing a real production outage (see
`AGENTS.md` in this repo for the full story). This skill exists to make "leaving the
repo clean before switching sessions" a fast, reliable, one-request habit.

## Steps

1. **Check state first.** Run `git status` in the project directory
   (`C:\Users\jazzc\projects\church-app`). If it reports a clean working tree
   (`nothing to commit, working tree clean`) **and** the branch is up to date with
   `origin/main` (no "ahead" commits), just tell the user there's nothing to do —
   it's already safe to switch sessions. Stop here in that case.

2. **Review what changed.** If there are staged/unstaged/untracked changes, look at
   `git diff` and `git status` to understand what actually changed before writing a
   commit message — don't guess from memory of the conversation alone, since this
   skill may run standalone or after a long gap.

   Be careful about what gets staged: review the file list for anything that looks
   like a secret, credential, or personal scratch file before adding it (this repo's
   normal safety rules still apply here — see the top-level git safety guidance).
   Stage specific files rather than blindly running `git add -A` if anything looks
   off.

3. **Verify it builds.** Run `npm run build` in the project directory before
   committing. This repo can't be visually tested for most login-gated features, so a
   successful build is the standard correctness gate used throughout this project —
   don't skip it just because the skill is trying to be fast. If the build fails,
   **stop and tell the user** what broke instead of committing or pushing broken code.
   A broken-but-uncommitted state is recoverable; a broken state pushed to `main` is
   what the next session will build on.

4. **Commit.** Write a concise commit message in the same style already used in this
   repo's history (Korean, short present/descriptive title, e.g. "게시판 관리 기능
   재구현", occasionally a one or two line body explaining *why* for anything
   non-obvious). Look at `git log --oneline -10` if you need a style refresher. Don't
   invent a generic message like "update files" — say what actually changed, in
   plain terms a non-technical church admin would recognize.

5. **Push.** Push to the remote. If the push is rejected (e.g., remote has commits
   this session doesn't know about — a sign another session pushed in the meantime),
   don't force-push. Stop and tell the user directly: this is exactly the
   multi-session collision this skill exists to catch, and it needs a human decision
   (pull and reconcile, or ask which version should win), not a silent overwrite.

6. **Confirm.** Tell the user in one or two sentences what got committed/pushed (or
   that there was nothing to do), so they know it's safe to close this session and
   pick up elsewhere.

## What this skill is not

This isn't a substitute for good judgment mid-task — if the user asks for this while
something is clearly half-finished (e.g., they just said "half of this isn't done
yet"), ask before committing rather than blindly wrapping up an incomplete change as
if it were done.
