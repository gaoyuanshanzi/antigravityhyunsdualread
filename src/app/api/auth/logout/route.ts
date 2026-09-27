import { NextResponse } from 'next/server';
import { AUTH_COOKIE_KEY } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: '로그아웃 되었습니다.'
  });

  response.cookies.delete(AUTH_COOKIE_KEY);
  return response;
}
