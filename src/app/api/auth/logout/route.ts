import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'ログアウト処理中にエラーが発生しました' }, { status: 500 });
  }
}
