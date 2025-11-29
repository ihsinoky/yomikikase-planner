/**
 * Tests for surveys API route
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/surveys/route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    survey: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    schoolYear: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// Helper to create a mock NextRequest with JSON body
function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/surveys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('GET /api/surveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return surveys list', async () => {
    const mockSurveys = [
      {
        id: '1',
        title: 'Test Survey',
        description: 'Test Description',
        schoolYearId: 'year-1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        schoolYear: { id: 'year-1', name: '2025年度' },
        surveyDates: [],
      },
    ];

    vi.mocked(prisma.survey.findMany).mockResolvedValue(mockSurveys);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('1');
    expect(data[0].title).toBe('Test Survey');
    expect(prisma.survey.findMany).toHaveBeenCalledWith({
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
  });

  it('should return 500 when database error occurs', async () => {
    vi.mocked(prisma.survey.findMany).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('アンケートの取得に失敗しました');
  });
});

describe('POST /api/surveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when schoolYearId is missing', async () => {
    const request = createMockRequest({
      title: 'Test Survey',
      surveyDates: [{ date: '2025-06-01', grade: 'JUNIOR' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('年度を選択してください');
  });

  it('should return 400 when title is missing', async () => {
    const request = createMockRequest({
      schoolYearId: 'year-1',
      surveyDates: [{ date: '2025-06-01', grade: 'JUNIOR' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('タイトルを入力してください');
  });

  it('should return 400 when surveyDates is empty', async () => {
    const request = createMockRequest({
      schoolYearId: 'year-1',
      title: 'Test Survey',
      surveyDates: [],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('開催候補日を1つ以上追加してください');
  });

  it('should return 400 when surveyDate has no date', async () => {
    const request = createMockRequest({
      schoolYearId: 'year-1',
      title: 'Test Survey',
      surveyDates: [{ date: '', grade: 'JUNIOR' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('候補日の日付を入力してください');
  });

  it('should return 400 when surveyDate has invalid grade', async () => {
    const request = createMockRequest({
      schoolYearId: 'year-1',
      title: 'Test Survey',
      surveyDates: [{ date: '2025-06-01', grade: 'INVALID' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('候補日の対象学年を選択してください');
  });

  it('should return 400 when schoolYear does not exist', async () => {
    vi.mocked(prisma.schoolYear.findUnique).mockResolvedValue(null);

    const request = createMockRequest({
      schoolYearId: 'invalid-year',
      title: 'Test Survey',
      surveyDates: [{ date: '2025-06-01', grade: 'JUNIOR' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('指定された年度が見つかりません');
  });

  it('should create survey successfully', async () => {
    const mockSchoolYear = {
      id: 'year-1',
      name: '2025年度',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCreatedSurvey = {
      id: 'survey-1',
      schoolYearId: 'year-1',
      title: 'Test Survey',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYear: mockSchoolYear,
      surveyDates: [
        {
          id: 'date-1',
          surveyId: 'survey-1',
          date: new Date('2025-06-01'),
          grade: 'JUNIOR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    vi.mocked(prisma.schoolYear.findUnique).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.survey.create).mockResolvedValue(mockCreatedSurvey);

    const request = createMockRequest({
      schoolYearId: 'year-1',
      title: 'Test Survey',
      description: 'Test Description',
      surveyDates: [{ date: '2025-06-01', grade: 'JUNIOR' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('survey-1');
    expect(data.title).toBe('Test Survey');
  });

  it('should return 500 when database error occurs during creation', async () => {
    const mockSchoolYear = {
      id: 'year-1',
      name: '2025年度',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.schoolYear.findUnique).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.survey.create).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      schoolYearId: 'year-1',
      title: 'Test Survey',
      surveyDates: [{ date: '2025-06-01', grade: 'JUNIOR' }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('アンケートの作成に失敗しました');
  });
});
