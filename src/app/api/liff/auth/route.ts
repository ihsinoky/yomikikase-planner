import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/liff';
import { prisma } from '@/lib/prisma';

interface AuthRequestBody {
  idToken: string;
}

/**
 * POST /api/liff/auth
 *
 * Authenticates a LINE user using their ID token.
 * Creates a new User record if the user doesn't exist.
 *
 * Returns user information and whether they need to complete profile registration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuthRequestBody;

    if (!body.idToken || typeof body.idToken !== 'string') {
      return NextResponse.json({ error: 'IDトークンが必要です' }, { status: 400 });
    }

    // Verify the ID token with LINE Platform
    let lineUserInfo;
    try {
      lineUserInfo = await verifyIdToken(body.idToken);
    } catch {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { lineUserId: lineUserInfo.lineUserId },
    });

    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          lineUserId: lineUserInfo.lineUserId,
          displayName: lineUserInfo.displayName,
        },
      });
      isNewUser = true;
    }

    // Check if the user has a profile for the current active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    });

    let profile = null;
    if (activeSchoolYear) {
      const existingProfile = await prisma.userYearProfile.findUnique({
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
      if (existingProfile) {
        profile = {
          id: existingProfile.id,
          grade: existingProfile.grade,
          className: existingProfile.className,
          schoolYear: {
            id: existingProfile.schoolYear.id,
            name: existingProfile.schoolYear.name,
          },
        };
      }
    }

    return NextResponse.json({
      userId: user.id,
      displayName: user.displayName,
      isNewUser,
      hasCurrentYearProfile: !!profile,
      activeSchoolYearId: activeSchoolYear?.id ?? null,
      profile,
    });
  } catch (error) {
    console.error('LIFF authentication error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: '認証処理中にエラーが発生しました' }, { status: 500 });
  }
}
