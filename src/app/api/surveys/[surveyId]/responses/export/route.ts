import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Grade, ResponseStatus } from '@prisma/client';

const VALID_GRADES: Grade[] = ['JUNIOR', 'MIDDLE', 'SENIOR'];

const GRADE_LABELS: Record<Grade, string> = {
  JUNIOR: '年少',
  MIDDLE: '年中',
  SENIOR: '年長',
};

const STATUS_LABELS: Record<ResponseStatus, string> = {
  AVAILABLE: '○',
  UNAVAILABLE: '×',
};

interface RouteParams {
  params: Promise<{ surveyId: string }>;
}

/**
 * Format date to YYYY-MM-DD (ISO format)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * GET /api/surveys/[surveyId]/responses/export
 * 指定されたアンケートの回答をCSVでエクスポート
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
    const filteredResponses = responses
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

        return {
          userName,
          grade,
          className,
          statusMap,
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

    // Build CSV content
    const csvLines: string[] = [];

    // Header row: user_name, grade, class_name, date1_status, date2_status, ...
    const headerColumns = [
      escapeCSV('user_name'),
      escapeCSV('grade'),
      escapeCSV('class_name'),
    ];
    for (const surveyDate of survey.surveyDates) {
      const dateStr = formatDate(surveyDate.date);
      const gradeLabel = GRADE_LABELS[surveyDate.grade];
      headerColumns.push(escapeCSV(`${dateStr}_${gradeLabel}`));
    }
    csvLines.push(headerColumns.join(','));

    // Data rows
    for (const response of filteredResponses) {
      const rowValues: string[] = [
        escapeCSV(response.userName),
        escapeCSV(response.grade ? GRADE_LABELS[response.grade] : ''),
        escapeCSV(response.className),
      ];

      for (const surveyDate of survey.surveyDates) {
        const status = response.statusMap.get(surveyDate.id);
        rowValues.push(escapeCSV(status ? STATUS_LABELS[status] : ''));
      }

      csvLines.push(rowValues.join(','));
    }

    const csvContent = csvLines.join('\n');

    // Generate filename with school year and survey title
    // Sanitize filename by removing potentially problematic characters
    const sanitizeFilename = (str: string): string => {
      return str
        .replace(/[\s]+/g, '_')
        .replace(/[/\\:*?"<>|]/g, '');
    };
    const schoolYearName = sanitizeFilename(survey.schoolYear.name);
    const surveyTitle = sanitizeFilename(survey.title);
    const filename = `${schoolYearName}_${surveyTitle}_responses.csv`;

    // Return CSV file with BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export survey responses:', error);
    return NextResponse.json(
      { error: 'CSVエクスポートに失敗しました' },
      { status: 500 }
    );
  }
}
