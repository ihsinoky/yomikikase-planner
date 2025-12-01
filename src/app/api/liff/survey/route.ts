import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/liff';
import { prisma } from '@/lib/prisma';
import { ResponseStatus } from '@prisma/client';

interface ResponseDetailInput {
  surveyDateId: string;
  status: ResponseStatus;
}

interface SubmitResponseRequest {
  idToken: string;
  surveyId: string;
  responseDetails: ResponseDetailInput[];
}

/**
 * GET /api/liff/survey
 *
 * Gets the most recently created survey (by createdAt descending) for the active school year.
 * Returns the survey with its survey dates so users can respond.
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
    } catch (error) {
      console.error('ID token verification failed:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { lineUserId: lineUserInfo.lineUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。プロフィールを登録してください。' }, { status: 404 });
    }

    // Get the active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    });

    if (!activeSchoolYear) {
      return NextResponse.json({ survey: null, existingResponse: null });
    }

    // Check if user has a profile for the current year
    const profile = await prisma.userYearProfile.findUnique({
      where: {
        userId_schoolYearId: {
          userId: user.id,
          schoolYearId: activeSchoolYear.id,
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'プロフィールを登録してください' }, { status: 400 });
    }

    // Get the latest survey for the active school year
    const survey = await prisma.survey.findFirst({
      where: { schoolYearId: activeSchoolYear.id },
      orderBy: { createdAt: 'desc' },
      include: {
        surveyDates: {
          orderBy: { date: 'asc' },
        },
        schoolYear: true,
      },
    });

    if (!survey) {
      return NextResponse.json({ survey: null, existingResponse: null });
    }

    // Check if user already has a response for this survey
    const existingResponse = await prisma.response.findUnique({
      where: {
        surveyId_userId: {
          surveyId: survey.id,
          userId: user.id,
        },
      },
      include: {
        responseDetails: true,
      },
    });

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        schoolYear: {
          id: survey.schoolYear.id,
          name: survey.schoolYear.name,
        },
        surveyDates: survey.surveyDates.map((sd) => ({
          id: sd.id,
          date: sd.date.toISOString().split('T')[0],
          grade: sd.grade,
        })),
      },
      existingResponse: existingResponse
        ? {
            id: existingResponse.id,
            responseDetails: existingResponse.responseDetails.map((rd) => ({
              surveyDateId: rd.surveyDateId,
              status: rd.status,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Get survey error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'アンケートの取得中にエラーが発生しました' }, { status: 500 });
  }
}

/**
 * POST /api/liff/survey
 *
 * Submits or updates a survey response.
 * Creates Response and ResponseDetail records.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitResponseRequest;

    // Validate required fields
    if (!body.idToken || typeof body.idToken !== 'string') {
      return NextResponse.json({ error: 'IDトークンが必要です' }, { status: 400 });
    }

    if (!body.surveyId || typeof body.surveyId !== 'string') {
      return NextResponse.json({ error: 'アンケートIDが必要です' }, { status: 400 });
    }

    if (!body.responseDetails || !Array.isArray(body.responseDetails) || body.responseDetails.length === 0) {
      return NextResponse.json({ error: '回答を入力してください' }, { status: 400 });
    }

    // Validate each response detail
    const validStatuses: ResponseStatus[] = ['AVAILABLE', 'UNAVAILABLE'];
    for (const detail of body.responseDetails) {
      if (!detail.surveyDateId || typeof detail.surveyDateId !== 'string') {
        return NextResponse.json({ error: '候補日IDが不正です' }, { status: 400 });
      }
      if (!detail.status || !validStatuses.includes(detail.status)) {
        return NextResponse.json({ error: '回答ステータスが不正です' }, { status: 400 });
      }
    }

    // Verify the ID token
    let lineUserInfo;
    try {
      lineUserInfo = await verifyIdToken(body.idToken);
    } catch (error) {
      console.error('ID token verification failed:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { lineUserId: lineUserInfo.lineUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // Get the survey and verify it exists
    const survey = await prisma.survey.findUnique({
      where: { id: body.surveyId },
      include: {
        surveyDates: true,
        schoolYear: true,
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'アンケートが見つかりません' }, { status: 404 });
    }

    // Check if school year is active
    if (!survey.schoolYear.isActive) {
      return NextResponse.json({ error: 'このアンケートの年度は終了しています' }, { status: 400 });
    }

    // Validate that all provided survey date IDs belong to this survey
    const surveyDateIds = new Set(survey.surveyDates.map((sd) => sd.id));
    for (const detail of body.responseDetails) {
      if (!surveyDateIds.has(detail.surveyDateId)) {
        return NextResponse.json({ error: '無効な候補日IDが含まれています' }, { status: 400 });
      }
    }

    // Validate that all survey dates have a response
    if (body.responseDetails.length !== survey.surveyDates.length) {
      return NextResponse.json({ error: 'すべての候補日について回答してください' }, { status: 400 });
    }
    // Validate that all survey date IDs in the survey have been answered
    const respondedDateIds = new Set(body.responseDetails.map(d => d.surveyDateId));
    for (const surveyDate of survey.surveyDates) {
      if (!respondedDateIds.has(surveyDate.id)) {
        return NextResponse.json({ error: 'すべての候補日について回答してください' }, { status: 400 });
      }
    }
    // Use upsert to create or update the response
    const response = await prisma.response.upsert({
    // Use a transaction to ensure atomicity of response and responseDetails updates
    const updatedResponse = await prisma.$transaction(async (tx) => {
      // Upsert the response
      const response = await tx.response.upsert({
        where: {
          surveyId_userId: {
            surveyId: body.surveyId,
            userId: user.id,
          },
        },
        update: {},
        create: {
          surveyId: body.surveyId,
          userId: user.id,
        },
      });

      // Delete existing response details
      await tx.responseDetail.deleteMany({
        where: { responseId: response.id },
      });

      // Create new response details
      await tx.responseDetail.createMany({
        data: body.responseDetails.map((detail) => ({
          responseId: response.id,
          surveyDateId: detail.surveyDateId,
          status: detail.status,
        })),
      });

      // Fetch the updated response with details
      return await tx.response.findUnique({
        where: { id: response.id },
        include: {
          responseDetails: {
            include: {
              surveyDate: true,
            },
          },
        },
      });
    });

    if (!updatedResponse) {
      return NextResponse.json({ error: '回答の保存中にエラーが発生しました' }, { status: 500 });
    }

    return NextResponse.json({
      message: '回答を送信しました',
      response: {
        id: updatedResponse.id,
        responseDetails: updatedResponse.responseDetails.map((rd) => ({
          surveyDateId: rd.surveyDateId,
          date: rd.surveyDate.date,
          grade: rd.surveyDate.grade,
          status: rd.status,
        })),
      },
    });
  } catch (error) {
    console.error('Submit survey response error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: '回答の送信中にエラーが発生しました' }, { status: 500 });
  }
}
