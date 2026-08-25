import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
