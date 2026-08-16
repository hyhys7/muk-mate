// 인증코드 발송 — 서버(Route Handler/서버 함수) 전용. 클라이언트 번들에 SMTP 자격증명이
// 들어가면 안 되므로 이 파일을 클라이언트 컴포넌트에서 import하지 않는다.
// §17-6: 지금은 개인 Gmail 계정 SMTP(앱 비밀번호)로 시작 — 발송량이 늘면 전용 계정으로 교체.
import nodemailer from 'nodemailer'

import type { VerificationPurpose } from '@/lib/types'

const PURPOSE_LABEL: Record<VerificationPurpose, string> = {
  SIGNUP: '회원가입',
  FIND_ID: '아이디 찾기',
  RESET_PASSWORD: '비밀번호 재설정',
  CHANGE_LOGIN_ID: '아이디 변경',
}

function getTransporter() {
  const user = process.env.EMAIL_SMTP_USER
  const pass = process.env.EMAIL_SMTP_PASSWORD
  if (!user || !pass) {
    // 조용히 무시하지 않는다 — "가입은 성공했는데 메일이 안 온" 상황이 더 나쁘다.
    throw new Error('EMAIL_SMTP_USER/EMAIL_SMTP_PASSWORD 환경변수가 설정되지 않았습니다.')
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export async function sendVerificationEmail(to: string, code: string, purpose: VerificationPurpose): Promise<void> {
  const transporter = getTransporter()
  const label = PURPOSE_LABEL[purpose]
  await transporter.sendMail({
    from: `"먹메이트" <${process.env.EMAIL_SMTP_USER}>`,
    to,
    subject: `[먹메이트] ${label} 인증코드`,
    text: `먹메이트 ${label} 인증코드는 [${code}] 입니다.\n\n10분 이내에 입력해 주세요. 본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`,
  })
}
