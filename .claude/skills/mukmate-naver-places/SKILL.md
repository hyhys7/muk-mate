---
name: mukmate-naver-places
description: Use when implementing or touching the 네이버 지역 검색 API / NAVER Maps API integration — the /api/places/search proxy, store/pickup place picker, or any store_lat/store_lng/pickup_lat/pickup_lng field. Triggers on Naver API calls, place-search UI, or place-picker modal work.
---

Reference for MukMate's Naver Local Search / Maps integration. Source of truth: `docs/PRD.md` §10-2, §10-3, §14-5, §11-2/§11-3.

## Non-negotiable

- **Never call the Naver API from the browser.** Client ID/Secret are read only inside a Route Handler. If a `"use client"` file or a browser-side `fetch` targets `openapi.naver.com` directly, that's a bug to fix, not a valid shortcut.
- `GET /api/places/search?q=` requires a logged-in session — reject unauthenticated calls server-side.
- The proxy returns only what the UI needs (name/address/lat/lng) — don't forward the full raw Naver payload.
- Client ID/Secret live in Vercel environment variables only, never hardcoded.

## Data persisted (exact columns, §11-2)

- Store: `store_name`, `store_address`, `store_lat numeric(10,7)`, `store_lng numeric(10,7)`
- Pickup: `pickup_name`, `pickup_address`, `pickup_lat numeric(10,7)`, `pickup_lng numeric(10,7)`, plus free-text `pickup_note`

Pickup location supports both a Naver search pick **and** a manual note added on top (§5-1: "검색 결과 선택 + 직접 설명 추가") — the picker UI needs both, not either/or.

## Completion check (§13-2)

Before calling this done: open browser devtools Network tab and confirm the Naver Client Secret never appears in any request the browser makes — the only network call the browser sees should be to `/api/places/search` on your own origin.

## Out of scope

No live/background location tracking or storage (§9-3, §12). Browser Geolocation is used only for a one-time distance calculation (ORDER-10, P1) — never persisted to the DB.
