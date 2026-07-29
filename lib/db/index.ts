// DB 클라이언트 — PRD §10-3② 요구사항에 맞춰 @neondatabase/serverless HTTP 드라이버 사용.
// (pooled connection string 방식 대신 HTTP 드라이버를 쓰면 서버리스 환경에서 커넥션 고갈 문제 자체가 없다.)
//
// DATABASE_URL 검사를 지연(lazy)시켜야 한다: 아직 DB를 붙이지 않은 상태에서도
// `next build`/`next dev`는 정상 동작해야 하고, 실제로 쿼리를 실행하는 요청이 들어올 때만
// 에러가 나야 한다. 모듈 로드 시점에 즉시 검사하면 이 파일을 import하는 라우트가 하나라도
// 있으면 DB 연결 여부와 무관하게 빌드 자체가 깨진다.
import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'

import * as schema from './schema'

let cached: NeonHttpDatabase<typeof schema> | undefined

function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL이 설정되지 않았습니다. .env.example을 참고해 .env.local에 Neon connection string을 넣어주세요.',
    )
  }
  const sql = neon(process.env.DATABASE_URL)
  cached = drizzle(sql, { schema })
  return cached
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
