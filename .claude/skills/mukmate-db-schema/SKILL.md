---
name: mukmate-db-schema
description: Use when creating/modifying the Neon Postgres schema, Drizzle ORM models or migrations, or DB connection setup for MukMate (먹메이트). Triggers on schema files, migration files, drizzle.config.*, connection-string setup, or any new column touching money/time/coordinates.
---

Reference schema and DB rules for MukMate. Source of truth: `docs/PRD.md` §11-2, §10-3②.

## Connection — mandatory, not optional (§10-3②)

Serverless functions spin up an instance per request, so a direct Postgres connection string exhausts connections fast. Always use:
- Neon's **pooled connection string** (PgBouncer), or
- `@neondatabase/serverless` HTTP driver

A direct (non-pooled) connection string works fine locally and then causes **500 errors from connection exhaustion after deploying to Vercel** — this is a named, previously-seen failure mode, not a hypothetical.

## Full schema (§11-2)

```sql
CREATE TYPE pot_status   AS ENUM ('OPEN','CLOSED','ORDERED','CANCELED');
CREATE TYPE approval     AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE room_type    AS ENUM ('ORDER','COMMUNITY');
CREATE TYPE message_type AS ENUM ('TEXT','SYSTEM');
CREATE TYPE target_type  AS ENUM ('HEADCOUNT','AMOUNT');

CREATE TABLE zones (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id      text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nickname      text NOT NULL,
  zone_code     text REFERENCES zones(code),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id        uuid NOT NULL REFERENCES users(id),
  zone_code      text NOT NULL REFERENCES zones(code),
  store_name     text NOT NULL,
  store_address  text,
  store_lat      numeric(10,7),
  store_lng      numeric(10,7),
  order_summary  text NOT NULL,
  target_type    target_type NOT NULL,
  target_value   integer NOT NULL,
  delivery_fee   integer,
  deadline_at    timestamptz NOT NULL,
  pickup_at      timestamptz,
  pickup_name    text NOT NULL,
  pickup_address text,
  pickup_lat     numeric(10,7),
  pickup_lng     numeric(10,7),
  pickup_note    text,
  extra_note     text,
  status         pot_status NOT NULL DEFAULT 'OPEN',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pots_zone_status ON pots (zone_code, status, deadline_at);

CREATE TABLE participations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pot_id          uuid NOT NULL REFERENCES pots(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id),
  apply_message   text,
  menu_amount     integer,
  approval_status approval NOT NULL DEFAULT 'PENDING',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pot_id, user_id)
);
CREATE INDEX idx_participations_user ON participations (user_id, created_at DESC);

CREATE TABLE chat_rooms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       room_type NOT NULL,
  pot_id     uuid UNIQUE REFERENCES pots(id) ON DELETE CASCADE,
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id         bigserial PRIMARY KEY,
  room_id    uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id  uuid REFERENCES users(id),
  type       message_type NOT NULL DEFAULT 'TEXT',
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_room ON messages (room_id, id);
```

## Conventions to enforce

- **Money is always `integer` (KRW)** — never `float`/`numeric` for amounts, or split-cost math (§5-4) accumulates rounding error.
- **All timestamps are `timestamptz`**, displayed in KST consistently (§9-3) — don't store naive local time.
- `messages.id` is `bigserial` specifically so chat polling can do `WHERE room_id = $1 AND id > $2` as an incremental cursor — don't switch it to `uuid`.
- `participations` has `UNIQUE (pot_id, user_id)` — rely on this constraint for dedup, don't re-implement the check only in application code.
- The host should also get an `APPROVED` row in `participations` for their own pot (design memo, §11-2) — keeps headcount and chat-permission logic uniform.
- No account/bank-info columns anywhere — financial info is never persisted (§9-2, §12); settlement guidance goes in chat text only.
- `zones` is a table, not an enum, because the region list is still undecided (§17-1) — changing the region list should be a data change, not a migration.
