# 먹메이트 개발 계획 (Sprint Plan)

기준 문서: `docs/PRD.md` (v2.0), `CLAUDE.md`. 요구사항 ID(`AUTH-xx`, `ORDER-xx`, `CHAT-xx`, `MY-xx`)와 완료 기준(§13)은 전부 PRD 원문 기준이다.

## 이 문서 사용법

- 작업을 끝내면 `- [ ]` → `- [x]`로 바꾸고, 필요하면 항목 끝에 짧은 메모(막힌 이유, 임시 처리 내용 등)를 덧붙인다.
- 각 Phase는 **순서대로** 진행한다 — 상위 Phase의 완료 기준을 통과하기 전에 다음 Phase로 넘어가면 하위 계층(DB→API→화면) 없이 화면만 쌓이게 된다.
- 이미 구현된 화면이라도 **"mock" 표기가 있으면 실제 데이터 연동 전까지 완료가 아니다.** 체크박스는 실제 동작 기준이지 UI 존재 여부가 아니다.
- 이 문서는 캘린더 요일이 아니라 **의존성 순서**로 재배열했다. PRD §15의 Day는 참고용으로만 괄호 표기한다. 일정이 밀리면 PRD §15 축소 순서(커뮤니티 화면 → 거리표시 → 분담금액 순으로 자르기)를 따른다 — 자세한 내용은 `mukmate-mvp-scope-guard` 스킬 참고.
- 각 Phase 완료 시 "완료 기준" 항목까지 통과해야 다음으로 넘어간다.

## 진행 현황 요약

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 인프라 기반 (DB/배포/인증 골격) | ☐ 시작 전 |
| 1 | 계정 (AUTH) | ☐ 시작 전 (UI만 존재, mock) |
| 2 | 공동주문 핵심 (ORDER) | ☐ 시작 전 (목록/상세/작성 UI 존재, mock) |
| 3 | 네이버 장소 검색 (ORDER-09) | ☐ 시작 전 |
| 4 | 채팅 (CHAT) | ☐ 시작 전 (화면 stub만 존재) |
| 5 | 마이페이지 (MY) | ☐ 시작 전 (화면 stub만 존재) |
| 6 | P1 선택 기능 | ☐ 시작 전 |
| 7 | 프로덕션 검증 & 완료 기준 | ☐ 시작 전 |

*(마지막 업데이트: 이 표는 Phase가 바뀔 때마다 함께 갱신한다.)*

---

## Phase 0 — 인프라 기반 (PRD Day 1 해당분)

목표: 이후 모든 Phase가 올라설 바닥. `mukmate-db-schema` 스킬 참고.

- [ ] Neon 프로젝트 생성, **pooled connection string** 확보 (직접 연결 문자열 금지 — 배포 후 커넥션 고갈 500 에러 원인)
- [ ] `drizzle-orm` + `@neondatabase/serverless` (또는 선택한 드라이버) 설치
- [ ] `lib/db/schema.ts` 작성 — `mukmate-db-schema` 스킬의 DDL을 Drizzle 스키마로 변환 (zones/users/pots/participations/chat_rooms/messages, ENUM 5종)
- [ ] 마이그레이션 생성 및 Neon에 적용, `zones` 4개 행 시드 (구정문/신정문/기숙사/사대부고 — `lib/constants.ts`의 기존 코드와 정확히 일치시킬 것)
- [ ] `chat_rooms`에 커뮤니티 고정방 2개 시드 (§17-2: "오늘 뭐 먹지 · 맛집 추천", "같이 먹어요 · 음식 여행")
- [ ] Vercel 프로젝트 연결 + 첫 배포 (기능 없어도 배포 파이프라인부터 뚫기 — PRD §15 경고: "마지막 날 첫 배포 시도하면 하루 날아간다")
- [ ] Vercel 환경변수 등록: `DATABASE_URL`(pooled), `AUTH_SECRET`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` (실제 키는 Phase 3에서 발급)
- [ ] `.env.local`에 로컬 개발용 값 세팅 (`.gitignore`에 포함되어 있는지 확인)
- [ ] Auth.js(NextAuth) 설치, Credentials Provider 골격 작성 (bcrypt는 Phase 1에서 실제 사용) — `mukmate-auth` 스킬 참고, Clerk/Descope/Auth0 등 외부 제공자 사용하지 않음

**완료 기준**: 빈 페이지라도 Vercel 프로덕션 URL에서 로드되고, 로컬에서 Neon DB에 쿼리 1건이 왕복 확인된다.

---

## Phase 1 — 계정 (AUTH-01~07, 화면 #1~2)

목표: 로그인/회원가입 mock을 실제 동작으로 교체. `mukmate-auth`, `mukmate-api-contract` 스킬 참고.

- [ ] `app/api/auth/signup` Route Handler — bcrypt 해시, `login_id` 중복 시 명확한 에러 (AUTH-01, AUTH-02)
- [ ] `app/api/auth/check-id` Route Handler — 회원가입 폼의 "중복확인" 버튼이 현재는 `idChecked=true`만 세팅하는 로컬 상태 — 실제 API 호출로 교체
- [ ] NextAuth Credentials 로그인/로그아웃 연결 (AUTH-03, AUTH-05)
- [ ] `app/(auth)/signup/page.tsx` 제출 로직을 실제 `/api/auth/signup` 호출로 교체 (현재는 `router.push('/onboarding')`만 함)
- [ ] `app/(auth)/login/page.tsx` 제출 로직을 실제 로그인 호출로 교체 (현재는 검증 없이 `router.push('/pots')`)
- [ ] 온보딩(닉네임+활동지역) 단계를 회원가입 API의 일부로 통합할지, signup 이후 별도 스텝으로 유지할지 결정하고 반영
- [ ] 서버 세션 가드: 비로그인 사용자가 글 작성·참여 신청·채팅을 못 하도록 미들웨어 또는 각 API 핸들러에서 검사 (AUTH-04) — 클라이언트 라우트 가드만으로는 불충분
- [ ] 로그인 유지 확인 — 새로고침 후에도 세션 유지 (AUTH-05 전제)

**완료 기준**: 서로 다른 두 계정으로 회원가입·로그인 가능, 중복 아이디 거부, 새로고침 후 세션 유지. (§13-1 관련 항목)

---

## Phase 2 — 공동주문 핵심 (ORDER-01~09, 11, 화면 #3~5, #7)

목표: 목록/상세/작성 화면을 실제 DB에 연결하고, 신청자 관리 화면(현재 없음)을 신규 제작. `mukmate-pot-lifecycle`, `mukmate-api-contract` 스킬 참고.

- [ ] `lib/db` 클라이언트 헬퍼 작성 (Drizzle + Neon 연결)
- [ ] `app/api/pots` — GET(목록, zone/status 필터), POST(생성) 구현
- [ ] `app/api/pots/:id` — GET(상세), PATCH(수정/상태변경, **host만**) 구현 (ORDER-08)
- [ ] `app/api/pots/:id/applications` — POST(참여 신청, 메시지 포함) 구현 (ORDER-03)
- [ ] `app/api/applications/:id` — PATCH(승인/거절, **host만**) 구현 (ORDER-04)
- [ ] `lib/api.ts`의 각 함수 본문을 mock에서 위 API 호출로 교체 (함수 시그니처는 이미 확정되어 있으므로 본문만 교체 — 각 함수 위 TODO 주석이 대상 엔드포인트를 명시함)
- [ ] `pot-create-form.tsx` → 실제 저장 확인 (현재 `createPot`은 클라이언트 메모리 배열만 수정해 새로고침하면 사라짐)
- [ ] 마감 시각 자동 판정 쿼리 적용: `CASE WHEN status='OPEN' AND deadline_at<now() THEN 'CLOSED' ELSE status END` (크론 없이, ORDER-11)
- [ ] 중복 신청 방지 확인 (`UNIQUE(pot_id, user_id)` 제약 위반 시 사용자에게 명확한 에러)
- [ ] 호스트 자신도 `participations`에 APPROVED로 자동 등록 (인원수 계산/채팅 권한 로직 단순화용)
- [ ] **신규 화면 #7 — 참여 신청자 관리** (`app/(main)/pots/[id]/applications/page.tsx`) 제작 — 현재 상세 화면의 "신청자 관리" 링크가 가리키는 대상이 없는 dead link 상태
- [ ] 상세 화면의 "참여 신청하기"를 실제 API 호출로 교체 (현재는 로컬 state만 토글)
- [ ] 모집글 **수정** 플로우 추가 (현재 작성만 있고 수정 없음, ORDER-08)

**완료 기준**: A가 모집글을 만들고, B가 신청하고, A가 승인/거절하면 그 결과가 새로고침 후에도 유지된다. (§13-1 관련 항목 다수)

---

## Phase 3 — 네이버 장소 검색 (ORDER-09, 화면 #6)

목표: 자유 텍스트 입력을 실제 장소 검색으로 교체. `mukmate-naver-places` 스킬 참고.

- [ ] 네이버 개발자센터에서 애플리케이션 등록, Client ID/Secret 발급 (사람이 직접 처리 — API 키 발급은 대행 불가)
- [ ] `app/api/places/search` Route Handler — 서버에서만 네이버 API 호출, 필요한 필드(이름/주소/위경도)만 반환
- [ ] **신규 화면 #6 — 장소·주소 검색** 모달/페이지 제작 (모달 권장, PRD §6-2)
- [ ] `pot-create-form.tsx`의 가게명/수령장소 자유 텍스트 입력을 위 검색 모달 연동으로 교체 (현재는 프리셋 칩 + 자유 입력만 있음)
- [ ] 검색 결과 선택 시 `store_lat/lng`, `pickup_lat/lng` 등 좌표까지 함께 저장되는지 확인
- [ ] 수령 장소는 검색 결과 + 직접 설명(`pickup_note`) 동시 입력 가능하도록 유지

**완료 기준**: 브라우저 devtools Network 탭에 네이버 Client Secret이 노출되지 않고, 검색 결과로 가게/수령 장소를 선택해 모집글에 등록할 수 있다.

---

## Phase 4 — 채팅 (CHAT-01~07, 화면 #8~11)

목표: 현재 `TabPlaceholder`로 남아있는 채팅 탭을 실제 폴링 채팅으로 구현. `mukmate-chat-polling` 스킬 참고.

- [ ] `app/api/rooms` — GET(내 채팅방 목록 + 커뮤니티 고정방) 구현
- [ ] `app/api/rooms/:id/messages` — GET(`after` 커서 기반 증분 조회), POST(메시지 전송) 구현
- [ ] 모든 메시지 API에서 **서버측 참여자 검사** (ORDER 방은 host+APPROVED만, COMMUNITY 방은 로그인만) — CHAT-01, URL 직접 접근 시도까지 막아야 함
- [ ] `app/(main)/chat/page.tsx` 실제 구현 — 내 채팅 / 커뮤니티 탭 분리, `TabPlaceholder` 제거
- [ ] **신규 화면 #9 — 주문 채팅방** (`app/(main)/chat/[id]/page.tsx`) 제작 — 상단에 가게명·수령장소·수령시각 고정 표시 (CHAT-07)
- [ ] 폴링 로직 구현 (2~3초 간격, `messages.id` 커서 기반 증분 조회) — 화면 이탈 시 폴링 중단
- [ ] **신규 화면 #10/#11 — 커뮤니티 목록/채팅방** 제작 (일정 빠듯하면 PRD §15에 따라 가장 먼저 잘라낼 후보)
- [ ] 메시지에 닉네임+작성시각 표시, `login_id` 노출되지 않는지 확인 (CHAT-03)
- [ ] SYSTEM 타입 메시지(예: "모집이 마감되었습니다") 표시 지원

**완료 기준**: 승인된 사용자만 주문 채팅방에 들어갈 수 있고, 거절/미신청 계정은 URL을 직접 입력해도 403. 다른 사용자가 보낸 메시지가 새로고침 없이(폴링으로) 화면에 나타난다. (§13-1, §13-3 관련 항목)

---

## Phase 5 — 마이페이지 & 계정 관리 (MY-01~03, 화면 #12~13)

목표: 현재 stub인 마이페이지를 실제 데이터로 채우고, 정보 수정 화면을 신규 제작.

- [ ] `app/(main)/my/page.tsx` 실제 구현 — `TabPlaceholder` 제거, 내가 만든/참여한 공동주문 목록 + 상태 표시 (MY-02, MY-03) — `getMyHostedPots()`/`getMyApplications()`는 이미 mock 레벨에서 존재하니 실제 API 연동만 하면 됨
- [ ] **신규 화면 #13 — 기본정보·비밀번호 수정** 페이지 제작
- [ ] `app/api/me` — PATCH(닉네임/활동지역 수정) 구현 (MY-01)
- [ ] `app/api/me/password` — PATCH(현재 비밀번호 확인 후 변경) 구현 (AUTH-06)

**완료 기준**: 두 계정 모두 마이페이지에서 자신이 만들거나 참여한 주문의 상태를 확인할 수 있고, 닉네임/활동지역/비밀번호를 수정할 수 있다.

---

## Phase 6 — P1 선택 기능 (일정 여유 있을 때만)

우선순위 낮음 — Phase 0~5가 전부 끝나고 시간이 남을 때만 진행. `mukmate-pot-lifecycle` 스킬의 계산식 참고.

- [ ] ORDER-10 — 위치 권한 허용 시 수령 장소까지 거리 표시, 가까운 순 정렬 (Geolocation은 일회성 계산만, 저장 금지)
- [ ] ORDER-12 — 참여자별 예상 분담 금액 표시 (배달비만 인원수 분할, 10원 단위 절상, 음식값은 1/N 하지 않음 — §5-4 계산식)

---

## Phase 7 — 프로덕션 검증 (PRD §13, §13-3)

- [ ] 서로 다른 기기·브라우저 2대에서 동시 접속 테스트
- [ ] **로컬이 아닌 Vercel 프로덕션 URL**에서 §13-1 필수 시나리오 전체 재확인 (체크리스트 13개 항목 — `mukmate-mvp-scope-guard` 스킬에 요약본 있음, 원문은 PRD §13-1)
- [ ] §13-2 품질 기준 전체 확인 (환경변수 정상 연결, 네이버 시크릿 미노출, 모바일 Safari/Chrome 레이아웃, 하단 내비 일관성, 권한 없는 접근 차단 등)
- [ ] 한 사용자가 메시지를 보내면 다른 사용자 화면에 새로고침 없이 나타나는지 최종 확인

**완료 기준**: PRD §13 전체 체크 완료 = MVP 완료.
