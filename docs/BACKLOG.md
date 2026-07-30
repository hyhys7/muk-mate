# 먹메이트 BACKLOG

앞으로 고치고 추가할 기능 요구사항을 대화하면서 쌓아가는 문서. `docs/PRD.md`(단일 소스)와 `docs/SPRINT_PLAN.md`(단계별 완료 이력)를 대체하지 않고, 그 사이에서 "다음에 뭘 할지" 실무 메모로 쓴다.

---

## ✅ 완료 / 검증됨

### 2026-07-30 — `/pots` 런타임 크래시 (ChevronDown 미정의)
- `components/pots/pots-view.tsx`에서 `ChevronDown`, `Check`, `Search`, `Plus`, `ShoppingBag`(lucide-react)를 import 없이 사용 → `/pots` 서버 렌더링 시 `ReferenceError`로 크래시.
- import 추가로 수정, `tsc --noEmit` / `next build` 통과 확인 후 배포.
- 프로젝트 전체 `tsc --noEmit` 스캔으로 다른 화면엔 동일 문제 없음을 확인.
- 부수 조치: 버그가 박제되어 있던 옛날 배포 고유 URL(`muk-mate-rboaam9oi-...vercel.app`)을 `vercel remove`로 정리. Vercel은 배포마다 영구 고유 URL을 부여하므로, 이후 코드를 고쳐도 이미 발급된 옛날 URL은 절대 최신화되지 않는다 — 항상 `muk-mate.vercel.app`(별칭 도메인)만 공유/사용할 것.

### 참여 신청 → 방장 알림 플로우
- 이미 구현되어 있고, 실제 프로덕션에서 curl로 회원가입 → 로그인 → 모집글 조회 → 참여 신청 → 취소까지 전체 플로우를 직접 실행해 정상 동작 확인함(2026-07-30).
- 신청 성공 시 알림이 2건 생성됨: 신청자 본인(`APPLICATION_SUBMITTED`), 방장(`APPLICATION_RECEIVED`) — `app/api/pots/[id]/join/route.ts:119-139`.
- 알림 배지는 실시간 push가 아니라 3초 간격 폴링(탭이 visible일 때만) — `components/notification-bell.tsx`.
- 참여하기 버튼(`components/pots/join-button.tsx`)은 `viewerState`(`GUEST`/`JOINABLE`/`PENDING`/`MEMBER`/`HOST`/`FULL`/`CLOSED`/`REJECTED`)에 따라 라벨·활성화 여부가 결정됨 — 본인이 방장인 글에선 "모집 마감하기"로 보이는 게 의도된 동작(참여하기가 아님).

### 참여하기 버튼이 실제로는 안 보였던 진짜 원인 (2026-07-30 후속 수정)
- 위 curl 검증은 서버가 내려주는 HTML에 버튼 마크업이 존재하는지만 확인한 거라, **실제 화면에서 다른 요소에 가려지는 문제**와 **비로그인 접근 자체가 막혀있는 문제**는 놓쳤음.
- 실제 원인 2가지를 찾아 수정함(커밋 `d3f79f2`, `275f6e4`):
  1. `(main)` 레이아웃이 비로그인 사용자를 무조건 `/login`으로 리다이렉트해서, 게스트는 모집글 상세를 아예 볼 수 없었음 → `app/(main)/pots/page.tsx`, `app/(main)/pots/[id]/page.tsx`를 `getSessionUserOrNull()` 기반으로 바꿔 게스트도 목록/상세를 보고 "로그인하고 참여하기" CTA를 보게 함.
  2. 하단 네비게이션 바(`components/bottom-nav.tsx`)가 상세 페이지 하단 고정 참여하기 버튼과 겹쳐서 시각적으로 가리고 있었음 → 경로가 정확히 `/pots`·`/chat`·`/my`일 때만 네비를 표시하도록 변경.
- **확인 필요**: 2번 수정으로 `/notifications`, `/my/edit`, `/pots/new`, `/chat/[id]` 등 세부 페이지에서도 하단 네비가 사라지는 부수효과가 생김 — 의도된 것인지 점검 필요.
- **문서 갱신 필요**: `CLAUDE.md`의 "`(main)` 전체는 로그인 세션이 없으면 `/login`으로 리다이렉트된다"는 서술이 이제 `/pots`·`/pots/[id]`엔 더 이상 사실이 아님 — CLAUDE.md/PRD 동기화 필요.

---

## 🔜 예정 작업

### 1. 모집글 삭제 (방장, 참여자 0명일 때만)
- **요구사항**: 모집글 작성자가 본인 글을 삭제할 수 있어야 함. 단, 참여자가 한 명이라도 있으면(승인 대기중 포함인지 확정 필요) 삭제 불가.
- **현재 상태**: `app/api/pots/[id]/route.ts`에 `GET`/`PATCH`만 있고 `DELETE`가 없음 — 신규 구현 필요.
- **확인 필요**: "참여자 0명"의 기준이 `APPROVED`만인지, `PENDING` 신청까지 포함해서 막을지 결정 필요 (PRD §5-1 상태전이 및 §18 우선순위와 상충 없는지 `mukmate-pot-lifecycle` 스킬 기준으로 점검).
- **관련 화면**: 모집글 상세(`components/pots/pot-detail-view.tsx`) 방장 뷰에 삭제 버튼/확인 다이얼로그 추가.

### 2. 모집글 상세 — 공유하기 버튼 연동
- **요구사항**: 상세 화면 우측 상단 공유 버튼을 누르면 링크를 다른 사람에게 공유할 수 있고, 링크를 받은 사람이 그 링크로 들어와 참여 신청까지 할 수 있어야 함.
- **현재 상태**: 버튼 UI(`Share2` 아이콘)는 있지만 `onClick`이 비어 있어 아무 동작 안 함 — `components/pots/pot-detail-view.tsx:115-121`.
- **구현 방향(안)**: Web Share API(`navigator.share`) 우선 시도, 미지원 환경은 클립보드 복사(`navigator.clipboard.writeText`)로 폴백. 공유 URL은 기존 상세 페이지 경로(`/pots/[id]`) 그대로 사용 — `(main)` 레이아웃이 비로그인 접근 시 이미 `/login?next=/pots/[id]`로 보내고 로그인 후 원래 페이지로 복귀하는 흐름이 있는지 확인 후, 없으면 로그인 리다이렉트에 `next` 파라미터 보존 로직 점검.

---

## 🧹 잡음 (사소한 정리 대상, 우선순위 낮음)
- `components/notification-bell.tsx:4` — `import useRouter from 'next/navigation'`가 어디서도 안 쓰이는 죽은 import. 당장 에러는 아니지만 정리 대상.
