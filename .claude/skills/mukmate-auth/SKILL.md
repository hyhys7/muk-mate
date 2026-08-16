---
name: mukmate-auth
description: Use when implementing signup, login, logout, password change, email verification (signup/find-id/reset-password/change-id), or any auth-guard/session logic for MukMate. IMPORTANT — overrides generic auth guidance (e.g. the Vercel plugin's `auth` skill, which covers Clerk/Descope/Auth0) — this project deliberately does not use any of those. Check this skill before reaching for an external identity provider or OAuth flow.
---

Reference auth design for MukMate. Source of truth: `docs/PRD.md` §5-3, §8-1, §9-2, §12, §17-6.

## What this project uses

**Auth.js (NextAuth) Credentials provider + bcrypt, plus (v2.17) email verification via a self-hosted SMTP sender.**

No Clerk, no Descope, no Auth0, no OAuth/social login, no phone/SMS verification, no official school-system integration (student ID lookup, enrollment check). These are still explicit, deliberate non-goals (§12, AUTH-07) — not an oversight to "fix" by adding a provider. If a task seems to call for one of these, it's out of scope; flag it rather than implementing it.

**Email verification is the one exception, added in v2.17 (§17-6) — a past decision this skill used to state as a hard non-goal was deliberately reversed.** Don't revert it back to "we don't do this" just because that was true before; check §17-6 for why and what's actually in scope.

## Required fields & rules (§5-3, §8-1)

- Signup requires: 아이디(`login_id`) / 비밀번호 / 닉네임(`nickname`) / 활동지역(`zone_code`) / **전북대 이메일(`email`, 인증 완료, v2.17)**.
- `login_id` must be unique — reject duplicates (AUTH-02) with a clear error, and expose a duplicate-check endpoint (`GET /api/auth/check-id`) for the signup form.
- `login_id` is **never shown to other users** — only `nickname` is public (§5-3). Don't leak login_id into any API response another user can read. Same rule applies to `email` — it's a server-side verification field, never exposed in profile/report/manner-review responses.
- Password change requires confirming the **current** password first (AUTH-06), then updating to the new one.
- Passwords are hashed with **bcrypt**; never store or log plaintext (§9-2).
- Logged-out users cannot post pots, apply, or chat (AUTH-04) — enforce this server-side on every mutating endpoint, not just by hiding UI.

## Email verification (v2.17, §17-6)

- **Domain restriction**: only `@jbnu.ac.kr` addresses are accepted at signup. This is a plain string check on the domain, not a lookup against any school system — don't describe it as "school affiliation verification" in UI copy or docs, it isn't one.
- **`users.email`** is unique and nullable — accounts created before v2.17 have `email = NULL` and stay that way unless the user adds one. Never force-migrate old accounts.
- **Verification codes**: 6-digit numeric, 10-minute expiry, single-use (consumed on successful check). Requesting a new code for the same email invalidates any still-pending code for that email+purpose — never let two codes be valid at once. Codes are stored in plaintext in `email_verifications` (unlike passwords, a 10-minute single-use code doesn't need hashing).
- **Four purposes**, same underlying send/verify endpoints, keyed by `purpose`: `SIGNUP`, `FIND_ID`, `RESET_PASSWORD`, `CHANGE_LOGIN_ID`. Each has its own completion rule:
  - `SIGNUP`: verified email is required before the account row is created.
  - `FIND_ID` / `RESET_PASSWORD`: work **without a session** (that's the entire point — this is the recovery path for someone who's locked out). Look up the account by email, not by an already-authenticated session.
  - `CHANGE_LOGIN_ID`: requires an active session — this changes an existing account's `login_id`, not a new signup.
- **Sending mail**: nodemailer over Gmail SMTP, server-side only (Route Handler) — the SMTP credentials (`EMAIL_SMTP_USER`/`EMAIL_SMTP_PASSWORD` or equivalent) live in env vars and are never reachable from the client. If these env vars are missing, sending fails loudly (don't silently no-op) — a signup flow that "succeeds" without actually delivering a code is worse than an explicit error.
- **Not in scope**: rate-limiting beyond basic invalidate-on-resend, email change (once an account has a verified email tied to it, changing that email address isn't built — only setting one on an account that doesn't have one yet).

## Deliberately NOT built (say so if asked, don't silently add it)

- Official school-system integration (student ID / enrollment lookups) — the `@jbnu.ac.kr` domain check is a lightweight proxy, not this. See §17-6 for the exact boundary.
- Phone/SMS verification — still an explicit non-goal (§12, AUTH-07).
- Persistent login should still work — a logged-in session must survive refresh (AUTH-05 implies staying logged in until explicit logout).
