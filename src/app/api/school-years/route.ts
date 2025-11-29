import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/school-years
 * 年度一覧を取得
 */
export async function GET() {
  try {
    const schoolYears = await prisma.schoolYear.findMany({
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(schoolYears);
  } catch (error) {
    console.error('Failed to fetch school years:', error);
    return NextResponse.json({ error: '年度の取得に失敗しました' }, { status: 500 });
  }
}
