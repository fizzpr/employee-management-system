import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.notification.updateMany({
      where: {
        userId: session.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
