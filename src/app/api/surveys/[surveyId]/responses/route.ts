import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Grade } from '@prisma/client';

const VALID_GRADES: Grade[] = ['JUNIOR', 'MIDDLE', 'SENIOR'];

interface RouteParams {
  params: Promise<{ surveyId: string }>;
}

/**
 * GET /api/surveys/[surveyId]/responses
 * 指定されたアンケートの回答一覧を取得
 * クエリパラメータ:
 *   - grade: 学年でフィルタ (JUNIOR | MIDDLE | SENIOR)
 *   - className: クラス名でフィルタ
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { surveyId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const gradeFilter = searchParams.get('grade') as Grade | null;
    const classNameFilter = searchParams.get('className');

    // Validate grade filter if provided
    if (gradeFilter && !VALID_GRADES.includes(gradeFilter)) {
      return NextResponse.json(
        { error: '無効な学年が指定されました' },
        { status: 400 }
      );
    }

    // First, verify the survey exists and get its details
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        schoolYear: true,
        surveyDates: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!survey) {
      return NextResponse.json(
        { error: '指定されたアンケートが見つかりません' },
        { status: 404 }
      );
    }

    // Get all responses for this survey with user profiles
    const responses = await prisma.response.findMany({
      where: { surveyId },
      include: {
        user: {
          include: {
            userYearProfiles: {
              where: { schoolYearId: survey.schoolYearId },
            },
          },
        },
        responseDetails: {
          include: {
            surveyDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform and filter responses
    const transformedResponses = responses
      .map((response) => {
        const profile = response.user.userYearProfiles[0];
        const userName = response.user.displayName || '(名前なし)';
        const grade = profile?.grade || null;
        const className = profile?.className || null;

        // Create a map of surveyDateId to status
        const statusMap = new Map(
          response.responseDetails.map((detail) => [
            detail.surveyDateId,
            detail.status,
          ])
        );

        // Create date statuses in order of survey dates
        const dateStatuses = survey.surveyDates.map((surveyDate) => ({
          surveyDateId: surveyDate.id,
          date: surveyDate.date,
          grade: surveyDate.grade,
          status: statusMap.get(surveyDate.id) || null,
        }));

        return {
          responseId: response.id,
          userId: response.userId,
          userName,
          grade,
          className,
          createdAt: response.createdAt,
          dateStatuses,
        };
      })
      // Apply filters
      .filter((response) => {
        if (gradeFilter && response.grade !== gradeFilter) {
          return false;
        }
        if (classNameFilter && response.className !== classNameFilter) {
          return false;
        }
        return true;
      });

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        schoolYear: survey.schoolYear,
        surveyDates: survey.surveyDates,
      },
      responses: transformedResponses,
    });
  } catch (error) {
    console.error('Failed to fetch survey responses:', error);
    return NextResponse.json(
      { error: '回答の取得に失敗しました' },
      { status: 500 }
    );
  }
}
