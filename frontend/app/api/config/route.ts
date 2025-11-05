import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.API_URL || 'http://localhost:8080',
  });
}

// 캐싱 설정 - 항상 최신 값 제공
export const dynamic = 'force-dynamic';
export const revalidate = 0;

