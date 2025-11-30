import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/liff';
import { prisma } from '@/lib/prisma';
import { Grade } from '@prisma/client';

interface ProfileRequestBody {
  idToken: string;
  displayName: string;
  grade: string;
  className?: string;
}

const VALID_GRADES: Grade[] = ['JUNIOR', 'MIDDLE', 'SENIOR'];

/**
 * POST /api/liff/profile
 *
 * Registers or updates the user's profile for the current school year.
 * Creates User if not exists, then creates UserYearProfile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProfileRequestBody;

    // Validate required fields
    if (!body.idToken || typeof body.idToken !== 'string') {
      return NextResponse.json({ error: 'IDトークンが必要です' }, { status: 400 });
    }

    if (!body.displayName || typeof body.displayName !== 'string' || !body.displayName.trim()) {
      return NextResponse.json({ error: '名前を入力してください' }, { status: 400 });
    }

    if (!body.grade || !VALID_GRADES.includes(body.grade as Grade)) {
      return NextResponse.json({ error: '学年を選択してください' }, { status: 400 });
    }

    // Verify the ID token
    let lineUserInfo;
    try {
      lineUserInfo = await verifyIdToken(body.idToken);
    } catch {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // Get the active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    });

    if (!activeSchoolYear) {
      return NextResponse.json({ error: '現在アクティブな年度がありません' }, { status: 400 });
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { lineUserId: lineUserInfo.lineUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineUserId: lineUserInfo.lineUserId,
          displayName: body.displayName.trim(),
        },
      });
    } else {
      // Update display name if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: { displayName: body.displayName.trim() },
      });
    }

    // Create or update the user year profile
    // Using upsert to handle the unique constraint
    const profile = await prisma.userYearProfile.upsert({
      where: {
        userId_schoolYearId: {
          userId: user.id,
          schoolYearId: activeSchoolYear.id,
        },
      },
      update: {
        grade: body.grade as Grade,
        className: body.className?.trim() || null,
      },
      create: {
        userId: user.id,
        schoolYearId: activeSchoolYear.id,
        grade: body.grade as Grade,
        className: body.className?.trim() || null,
      },
      include: {
        schoolYear: true,
      },
    });

    return NextResponse.json({
      userId: user.id,
      displayName: user.displayName,
      profile: {
        id: profile.id,
        grade: profile.grade,
        className: profile.className,
        schoolYear: {
          id: profile.schoolYear.id,
          name: profile.schoolYear.name,
        },
      },
    });
  } catch (error) {
    console.error('Profile registration error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'プロフィール登録中にエラーが発生しました' }, { status: 500 });
  }
}

/**
 * GET /api/liff/profile
 *
 * Gets the current user's profile for the active school year.
 * Requires idToken as a query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    const idToken = request.nextUrl.searchParams.get('idToken');

    if (!idToken) {
      return NextResponse.json({ error: 'IDトークンが必要です' }, { status: 400 });
    }

    // Verify the ID token
    let lineUserInfo;
    try {
      lineUserInfo = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { lineUserId: lineUserInfo.lineUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // Get the active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    });

    if (!activeSchoolYear) {
      return NextResponse.json({
        userId: user.id,
        displayName: user.displayName,
        profile: null,
      });
    }

    // Get the user's profile for the current year
    const profile = await prisma.userYearProfile.findUnique({
      where: {
        userId_schoolYearId: {
          userId: user.id,
          schoolYearId: activeSchoolYear.id,
        },
      },
      include: {
        schoolYear: true,
      },
    });

    return NextResponse.json({
      userId: user.id,
      displayName: user.displayName,
      profile: profile
        ? {
            id: profile.id,
            grade: profile.grade,
            className: profile.className,
            schoolYear: {
              id: profile.schoolYear.id,
              name: profile.schoolYear.name,
            },
          }
        : null,
    });
  } catch (error) {
    console.error('Get profile error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'プロフィール取得中にエラーが発生しました' }, { status: 500 });
  }
}
