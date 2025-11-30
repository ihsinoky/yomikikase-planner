/**
 * Tests for survey responses CSV export API route
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/surveys/[surveyId]/responses/export/route';

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
  const url = new URL('http://localhost:3000/api/surveys/survey-1/responses/export');
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
];

describe('GET /api/surveys/[surveyId]/responses/export', () => {
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

  it('should return CSV with correct headers and content', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('filename=');

    // Check header row (skip BOM)
    const csvContent = text.replace('\uFEFF', '');
    const lines = csvContent.split('\n');
    expect(lines[0]).toContain('user_name');
    expect(lines[0]).toContain('grade');
    expect(lines[0]).toContain('class_name');
    expect(lines[0]).toContain('2025-06-01');
    expect(lines[0]).toContain('2025-06-15');

    // Check data row
    expect(lines[1]).toContain('Test User 1');
    expect(lines[1]).toContain('年少');
    expect(lines[1]).toContain('うさぎ組');
    expect(lines[1]).toContain('○');
    expect(lines[1]).toContain('×');
  });

  it('should return CSV with BOM for Excel compatibility', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(mockResponses);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    
    // Get raw bytes to check BOM
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // UTF-8 BOM is 0xEF 0xBB 0xBF
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
  });

  it('should return empty CSV (header only) when no responses exist', async () => {
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue([]);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const text = await response.text();

    expect(response.status).toBe(200);
    const csvContent = text.replace('\uFEFF', '');
    const lines = csvContent.split('\n');
    expect(lines.length).toBe(1); // Header only
  });

  it('should filter responses by grade in CSV', async () => {
    const multipleResponses = [
      ...mockResponses,
      {
        ...mockResponses[0],
        id: 'response-2',
        userId: 'user-2',
        user: {
          ...mockResponses[0].user,
          id: 'user-2',
          displayName: 'Test User 2',
          userYearProfiles: [
            {
              ...mockResponses[0].user.userYearProfiles[0],
              id: 'profile-2',
              userId: 'user-2',
              grade: 'MIDDLE' as const,
            },
          ],
        },
      },
    ];

    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue(multipleResponses);

    const request = createMockRequest({ grade: 'JUNIOR' });
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const text = await response.text();

    const csvContent = text.replace('\uFEFF', '');
    const lines = csvContent.split('\n');
    expect(lines.length).toBe(2); // Header + 1 data row
    expect(lines[1]).toContain('Test User 1');
    expect(lines[1]).not.toContain('Test User 2');
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
    expect(data.error).toBe('CSVエクスポートに失敗しました');
  });

  it('should escape CSV values with commas', async () => {
    const responseWithComma = {
      ...mockResponses[0],
      user: {
        ...mockResponses[0].user,
        displayName: 'User, With Comma',
      },
    };

    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findMany).mockResolvedValue([responseWithComma]);

    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ surveyId: 'survey-1' }) });
    const text = await response.text();

    const csvContent = text.replace('\uFEFF', '');
    // CSV value with comma should be wrapped in quotes
    expect(csvContent).toContain('"User, With Comma"');
  });
});
