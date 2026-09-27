import { NextResponse } from 'next/server';
import { verifyCredentials, AUTH_COOKIE_KEY } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '관리자 아이디와 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (verifyCredentials(username, password)) {
      const response = NextResponse.json({
        success: true,
        message: '관리자 인증 성공'
      });

      response.cookies.set(AUTH_COOKIE_KEY, 'authenticated_admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: '관리자 아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
