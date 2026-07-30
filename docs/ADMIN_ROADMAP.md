# 관리자 기능 개발 로드맵

`docs/ADMIN_FEATURES.md`에서 확정한 4개 기능(권한 검증 / 신고 처리 / 회원 제재 / 모집글 직권 삭제)을 3개 스프린트로 나눠 개발한다. 각 스프린트가 끝나면 **커밋·푸시 → AI 자체 검증(빌드/타입체크/curl 재현) → 사람 확인** 순서로 진행하고, 다음 스프린트로 넘어가기 전에 확인을 받는다.

## Sprint 1 — 기반: 권한 모델 · 관리자 라우트 가드 · 제재 전체 적용

**목표**: `/admin` 접근 자체가 관리자만 되도록 만들고, 회원 정지가 채팅뿐 아니라 로그인·참여·작성 전체에 실제로 먹히게 한다. 이 스프린트가 끝나도 신고 목록 같은 실제 관리 기능은 아직 없다 — 다음 스프린트의 지반 공사.

- [ ] `lib/db/schema.ts`: `user_role` enum(`USER`/`ADMIN`) 추가, `users.role` 컬럼(기본 `USER`) 추가
- [ ] `drizzle-kit generate` → `db:push`로 Neon에 반영
- [ ] `auth.ts`: 로그인 성공 조건에 `accountStatus === 'ACTIVE'` 검사 추가(정지/비활성 계정은 로그인 자체를 막음), JWT/세션에 `role` 포함
- [ ] `app/api/pots/route.ts`(POST), `app/api/pots/[id]/join/route.ts`(POST): `accountStatus !== 'ACTIVE'`면 403 반환
- [ ] `lib/admin/auth.ts`: `getAdminOrNull()` — 세션 + `role === 'ADMIN'` 검사, 관리자 라우트/레이아웃 공용
- [ ] `app/admin/layout.tsx`: 비로그인 → `/login`, 비관리자 → `/pots` 리다이렉트. 하단 네비 없는 별도 셸
- [ ] `app/admin/page.tsx`: 임시 랜딩(다음 스프린트에서 신고함/모집글 관리 링크로 채움)
- [ ] 검증: 비로그인 상태 `/admin` 접근 시 `/login`으로, 일반 계정 로그인 후 `/admin` 접근 시 `/pots`로 리다이렉트되는지 curl/직접 확인. DB에서 role을 `ADMIN`으로 바꾼 테스트 계정으로는 `/admin` 진입 성공 확인. 정지 계정 로그인 차단 확인.

## Sprint 2 — 신고 처리 (신고함)

**목표**: 관리자가 신고를 실제로 보고 처리할 수 있다.

- [ ] `GET /api/admin/reports?status=` — 목록(기본 `PENDING` 우선 정렬)
- [ ] `PATCH /api/admin/reports/:id` — `status`, `adminNote` 변경, `reviewedAt` 기록
- [ ] `PATCH /api/admin/users/:id` — `accountStatus` 변경(신고 상세 화면에서 호출)
- [ ] `app/admin/reports/page.tsx` — 목록 + 상태 필터 + 상세(신고 사유/메시지 스냅샷) + 상태 변경 폼 + "이 유저 정지" 버튼
- [ ] 검증: 실제 신고 1건을 만들고(기존 CHAT-08 플로우로) 관리자 화면에서 `RESOLVED`로 바꾸고 신고자 계정을 정지 → 그 계정이 로그인·참여·작성 모두 막히는지 Sprint 1에서 넓힌 검사로 재확인.

## Sprint 3 — 모집글 직권 삭제

**목표**: 신고 없이도 운영자가 부적절한 모집글을 즉시 내릴 수 있다.

- [ ] `GET /api/admin/pots?q=` — zone 무관 전체 목록/검색
- [ ] `DELETE /api/admin/pots/:id` — 참여자·방장 조건 무시하고 즉시 삭제(cascade로 참여/채팅방/알림도 함께 정리됨, 스키마상 이미 `onDelete: cascade`)
- [ ] `app/admin/pots/page.tsx` — 목록 + 검색 + 삭제 확인 다이얼로그
- [ ] `app/admin/page.tsx` 최종 정리 — 신고함/모집글 관리로 가는 실제 랜딩
- [ ] 검증: 참여자가 있는 글도 관리자 계정으로는 삭제되는지(일반 삭제 API는 여전히 막혀야 함 — 회귀 확인), 삭제 후 연결된 채팅방·알림이 실제로 정리되는지 DB로 확인.

## 최종 확인 (전체 스프린트 완료 후)

- [ ] 일반 계정으로 `/admin`, `/api/admin/*` 접근 시 전부 차단되는지 재확인
- [ ] 신고 접수 → 관리자 처리 → 회원 정지 → 정지 계정의 로그인/참여/작성/채팅 전부 차단, 전체 플로우를 실제 계정 2개(신고자/피신고자)로 처음부터 끝까지 재현
- [ ] 모집글 직권 삭제가 참여자 유무와 무관하게 동작하는지, 일반 삭제는 여전히 참여자 0명 조건을 지키는지 회귀 확인
- [ ] `docs/PRD.md` §17-4 "구현 상태"를 "설계 확정"에서 "구현됨"으로 갱신
- [ ] 프로덕션 배포 후 Vercel 런타임 로그에서 관리자 라우트 관련 에러 없는지 확인

## 명시적으로 다음 로드맵에서 다루지 않는 것

`docs/ADMIN_FEATURES.md`의 "제외 범위" 그대로 유지 — 마스터데이터(zone) CRUD, 공지사항, 신고와 무관한 별도 감사 로그. 필요해지면 이 로드맵에 새 스프린트로 추가한다.
