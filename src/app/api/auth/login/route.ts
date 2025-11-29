import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createSession } from '@/lib/auth';

interface LoginRequestBody {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequestBody;

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 });
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 });
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'ログイン処理中にエラーが発生しました' }, { status: 500 });
  }
}
