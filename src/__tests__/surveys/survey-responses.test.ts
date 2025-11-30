/**
 * Tests for survey responses API routes
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/surveys/[surveyId]/responses/route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    survey: {
      findUnique: vi.fn(),
    },
    response: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// Helper to create a mock NextRequest
function createMockRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/surveys/survey-1/responses');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url);
}

const mockSchoolYear = {
  id: 'year-1',
  name: '2025年度',
  startDate: new Date('2025-04-01'),
  endDate: new Date('2026-03-31'),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSurvey = {
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
      grade: 'JUNIOR' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'date-2',
      surveyId: 'survey-1',
      date: new Date('2025-06-15'),
      grade: 'MIDDLE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

const mockResponses = [
  {
    id: 'response-1',
    surveyId: 'survey-1',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      lineUserId: 'line-user-1',
      displayName: 'Test User 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      userYearProfiles: [
        {
          id: 'profile-1',
          userId: 'user-1',
          schoolYearId: 'year-1',
          grade: 'JUNIOR' as const,
          className: 'うさぎ組',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    responseDetails: [
      {
        id: 'detail-1',
        responseId: 'response-1',
        surveyDateId: 'date-1',
        status: 'AVAILABLE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        surveyDate: mockSurvey.surveyDates[0],
      },
      {
        id: 'detail-2',
        responseId: 'response-1',
        surveyDateId: 'date-2',
        status: 'UNAVAILABLE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        surveyDate: mockSurvey.surveyDates[1],
      },
    ],
  },
  {
    id: 'response-2',
    surveyId: 'survey-1',
    userId: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-2',
      lineUserId: 'line-user-2',
      displayName: 'Test User 2',
      createdAt: new Date(),
      updatedAt: new Date(),
      userYearProfiles: [
        {
          id: 'profile-2',
          userId: 'user-2',
          schoolYearId: 'year-1',
          grade: 'MIDDLE' as const,
          className: 'きりん組',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    responseDetails: [
      {
        id: 'detail-3',
        responseId: 'response-2',
        surveyDateId: 'date-1',
        status: 'AVAILABLE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        surveyDate: mockSurvey.surveyDates[0],
      },
    ],
  },
];

describe('GET /api/surveys/[surveyId]/responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when survey does not exist', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'non-existent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('指定されたアンケートが見つかりません');
  });

  it('should return survey with empty responses when no responses exist', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.survey.id).toBe('survey-1');
    expect(data.responses).toEqual([]);
  });

  it('should return survey responses successfully', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.survey.id).toBe('survey-1');
    expect(data.survey.title).toBe('Test Survey');
    expect(data.responses.length).toBe(2);
    expect(data.responses[0].userName).toBe('Test User 1');
    expect(data.responses[0].grade).toBe('JUNIOR');
    expect(data.responses[0].className).toBe('うさぎ組');
    expect(data.responses[0].dateStatuses.length).toBe(2);
  });

  it('should filter responses by grade', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses);

    const request = createMockRequest({ grade: 'JUNIOR' });
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.responses.length).toBe(1);
    expect(data.responses[0].grade).toBe('JUNIOR');
  });

  it('should filter responses by className', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses);

    const request = createMockRequest({ className: 'きりん組' });
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.responses.length).toBe(1);
    expect(data.responses[0].className).toBe('きりん組');
  });

  it('should filter responses by both grade and className', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses);

    const request = createMockRequest({ grade: 'MIDDLE', className: 'きりん組' });
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.responses.length).toBe(1);
    expect(data.responses[0].grade).toBe('MIDDLE');
    expect(data.responses[0].className).toBe('きりん組');
  });

  it('should return 400 when invalid grade is provided', async () => {
    const request = createMockRequest({ grade: 'INVALID' });
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('無効な学年が指定されました');
  });

  it('should return 500 when database error occurs', async () => {
    vi.mocked(prisma.survey.findUnique).mockRejectedValue(new Error('Database error'));

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('回答の取得に失敗しました');
  });
});
