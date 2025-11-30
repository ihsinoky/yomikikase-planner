import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Grade } from '@prisma/client';

const VALID_GRADES: Grade[] = ['JUNIOR', 'MIDDLE', 'SENIOR'];

interface SurveyDateInput {
  date: string; // ISO 8601 format
  grade: Grade;
}

interface CreateSurveyRequest {
  schoolYearId: string;
  title: string;
  description?: string;
  surveyDates: SurveyDateInput[];
}

/**
 * GET /api/surveys
 * アンケート一覧を取得
 */
export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({
      include: {
        schoolYear: true,
        surveyDates: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    return NextResponse.json({ error: 'アンケートの取得に失敗しました' }, { status: 500 });
  }
}

/**
 * POST /api/surveys
 * 新規アンケートを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSurveyRequest;

    const { schoolYearId, title, description, surveyDates } = body;

    // Validation
    if (!schoolYearId || schoolYearId.trim().length === 0) {
      return NextResponse.json({ error: '年度を選択してください' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'タイトルを入力してください' }, { status: 400 });
    }

    if (!surveyDates || surveyDates.length === 0) {
      return NextResponse.json({ error: '開催候補日を1つ以上追加してください' }, { status: 400 });
    }

    // Validate each survey date
    for (const surveyDate of surveyDates) {
      if (!surveyDate.date) {
        return NextResponse.json({ error: '候補日の日付を入力してください' }, { status: 400 });
      }
      const parsedDate = new Date(surveyDate.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: '候補日の日付形式が不正です' }, { status: 400 });
      }
      if (!surveyDate.grade || !VALID_GRADES.includes(surveyDate.grade)) {
        return NextResponse.json({ error: '候補日の対象学年を選択してください' }, { status: 400 });
      }
    }

    // Verify school year exists
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: schoolYearId },
    });

    if (!schoolYear) {
      return NextResponse.json({ error: '指定された年度が見つかりません' }, { status: 400 });
    }

    // Create survey with survey dates using nested create (Prisma handles this atomically)
    const survey = await prisma.survey.create({
      data: {
        schoolYearId,
        title: title.trim(),
        description: description?.trim() || null,
        surveyDates: {
          create: surveyDates.map((sd) => ({
            date: new Date(sd.date),
            grade: sd.grade,
          })),
        },
      },
      include: {
        schoolYear: true,
        surveyDates: {
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Failed to create survey:', error);
    return NextResponse.json({ error: 'アンケートの作成に失敗しました' }, { status: 500 });
  }
}
