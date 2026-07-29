// Auth.js(NextAuth) 설정 — Credentials(아이디/비밀번호) 전용.
// Clerk/Descope/Auth0 등 외부 ID 제공자는 이 프로젝트의 명시적 비목표.
// 자세한 규칙: .claude/skills/mukmate-auth/SKILL.md
import { eq } from 'drizzle-orm'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import bcrypt from 'bcryptjs'

import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        loginId: { label: '아이디', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      authorize: async (credentials) => {
        const loginId = typeof credentials?.loginId === 'string' ? credentials.loginId : undefined
        const password = typeof credentials?.password === 'string' ? credentials.password : undefined
        if (!loginId || !password) return null

        const [user] = await getDb().select().from(users).where(eq(users.loginId, loginId)).limit(1)
        if (!user) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          loginId: user.loginId,
          nickname: user.nickname,
          zoneCode: user.zoneCode,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.loginId = user.loginId
        token.nickname = user.nickname
        token.zoneCode = user.zoneCode
      }
      return token
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string
      session.user.loginId = token.loginId as string
      session.user.nickname = token.nickname as string
      session.user.zoneCode = token.zoneCode as string | null
      return session
    },
  },
})
