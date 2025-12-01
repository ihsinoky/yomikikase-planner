/**
 * Tests for LIFF survey API
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/liff/survey/route';

// Mock the dependencies
vi.mock('@/lib/liff', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    userYearProfile: {
      findUnique: vi.fn(),
    },
    survey: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    response: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    responseDetail: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { verifyIdToken } from '@/lib/liff';
import { prisma } from '@/lib/prisma';

function createMockGetRequest(idToken?: string): NextRequest {
  const url = idToken
    ? `http://localhost:3000/api/liff/survey?idToken=${encodeURIComponent(idToken)}`
    : 'http://localhost:3000/api/liff/survey';
  return new NextRequest(url, {
    method: 'GET',
  });
}

function createMockPostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/liff/survey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
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

const mockUser = {
  id: 'user-1',
  lineUserId: 'U123456',
  displayName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProfile = {
  id: 'profile-1',
  userId: 'user-1',
  schoolYearId: 'year-1',
  grade: 'JUNIOR' as const,
  className: 'さくら組',
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

describe('GET /api/liff/survey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when idToken is missing', async () => {
    const request = createMockGetRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('IDトークンが必要です');
  });

  it('should return 401 when token verification fails', async () => {
    vi.mocked(verifyIdToken).mockRejectedValue(new Error('Invalid token'));

    const request = createMockGetRequest('invalid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('認証に失敗しました');
  });

  it('should return 404 when user not found', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('ユーザーが見つかりません。プロフィールを登録してください。');
  });

  it('should return 400 when no active school year', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(null);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('現在アクティブな年度がありません');
  });

  it('should return 400 when user has no profile', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(null);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('プロフィールを登録してください');
  });

  it('should return null survey when no survey exists', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(prisma.survey.findFirst).mockResolvedValue(null);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.survey).toBe(null);
    expect(data.existingResponse).toBe(null);
  });

  it('should return survey with no existing response', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(prisma.survey.findFirst).mockResolvedValue(mockSurvey);
    vi.mocked(prisma.response.findUnique).mockResolvedValue(null);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.survey.id).toBe('survey-1');
    expect(data.survey.title).toBe('Test Survey');
    expect(data.survey.surveyDates.length).toBe(2);
    expect(data.existingResponse).toBe(null);
  });

  it('should return survey with existing response', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(prisma.survey.findFirst).mockResolvedValue(mockSurvey);

    const mockExistingResponse = {
      id: 'response-1',
      surveyId: 'survey-1',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      responseDetails: [
        {
          id: 'detail-1',
          responseId: 'response-1',
          surveyDateId: 'date-1',
          status: 'AVAILABLE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockExistingResponse);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.existingResponse).not.toBe(null);
    expect(data.existingResponse.id).toBe('response-1');
    expect(data.existingResponse.responseDetails[0].status).toBe('AVAILABLE');
  });
});

describe('POST /api/liff/survey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when idToken is missing', async () => {
    const request = createMockPostRequest({
      surveyId: 'survey-1',
      responseDetails: [],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('IDトークンが必要です');
  });

  it('should return 400 when surveyId is missing', async () => {
    const request = createMockPostRequest({
      idToken: 'valid-token',
      responseDetails: [],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('アンケートIDが必要です');
  });

  it('should return 400 when responseDetails is empty', async () => {
    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('回答を入力してください');
  });

  it('should return 400 when invalid status is provided', async () => {
    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'date-1', status: 'INVALID' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('回答ステータスが不正です');
  });

  it('should return 401 when token verification fails', async () => {
    vi.mocked(verifyIdToken).mockRejectedValue(new Error('Invalid token'));

    const request = createMockPostRequest({
      idToken: 'invalid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'date-1', status: 'AVAILABLE' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('認証に失敗しました');
  });

  it('should return 404 when user not found', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'date-1', status: 'AVAILABLE' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('ユーザーが見つかりません');
  });

  it('should return 404 when survey not found', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(null);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'date-1', status: 'AVAILABLE' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('アンケートが見つかりません');
  });

  it('should return 400 when school year is not active', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.survey.findUnique).mockResolvedValue({
      ...mockSurvey,
      schoolYear: { ...mockSchoolYear, isActive: false },
    });

    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'date-1', status: 'AVAILABLE' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('このアンケートの年度は終了しています');
  });

  it('should return 400 when invalid surveyDateId is provided', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'invalid-date-id', status: 'AVAILABLE' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('無効な候補日IDが含まれています');
  });

  it('should successfully submit survey response', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey);

    const mockResponse = {
      id: 'response-1',
      surveyId: 'survey-1',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.response.upsert).mockResolvedValue(mockResponse);
    vi.mocked(prisma.responseDetail.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.responseDetail.createMany).mockResolvedValue({ count: 2 });

    const mockUpdatedResponse = {
      ...mockResponse,
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
    };
    vi.mocked(prisma.response.findUnique).mockResolvedValue(mockUpdatedResponse);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      surveyId: 'survey-1',
      responseDetails: [
        { surveyDateId: 'date-1', status: 'AVAILABLE' },
        { surveyDateId: 'date-2', status: 'UNAVAILABLE' },
      ],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('回答を送信しました');
    expect(data.response.responseDetails.length).toBe(2);
    expect(data.response.responseDetails[0].status).toBe('AVAILABLE');
    expect(data.response.responseDetails[1].status).toBe('UNAVAILABLE');
  });
});
