/**
 * Tests for LIFF profile API
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/liff/profile/route';

// Mock the dependencies
vi.mock('@/lib/liff', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    userYearProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { verifyIdToken } from '@/lib/liff';
import { prisma } from '@/lib/prisma';

function createMockPostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/liff/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(idToken?: string): NextRequest {
  const url = idToken
    ? `http://localhost:3000/api/liff/profile?idToken=${encodeURIComponent(idToken)}`
    : 'http://localhost:3000/api/liff/profile';
  return new NextRequest(url, {
    method: 'GET',
  });
}

describe('POST /api/liff/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when idToken is missing', async () => {
    const request = createMockPostRequest({
      displayName: 'Test User',
      grade: 'JUNIOR',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('IDトークンが必要です');
  });

  it('should return 400 when displayName is missing', async () => {
    const request = createMockPostRequest({
      idToken: 'valid-token',
      grade: 'JUNIOR',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('名前を入力してください');
  });

  it('should return 400 when grade is invalid', async () => {
    const request = createMockPostRequest({
      idToken: 'valid-token',
      displayName: 'Test User',
      grade: 'INVALID',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('学年を選択してください');
  });

  it('should return 401 when token verification fails', async () => {
    vi.mocked(verifyIdToken).mockRejectedValue(new Error('Invalid token'));

    const request = createMockPostRequest({
      idToken: 'invalid-token',
      displayName: 'Test User',
      grade: 'JUNIOR',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('認証に失敗しました');
  });

  it('should return 400 when no active school year', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(null);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      displayName: 'Test User',
      grade: 'JUNIOR',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('現在アクティブな年度がありません');
  });

  it('should create new user and profile when user does not exist', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'LINE Name',
    });

    const mockSchoolYear = {
      id: 'year-1',
      name: '2025年度',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      schoolYearId: 'year-1',
      grade: 'JUNIOR' as const,
      className: 'さくら組',
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYear: mockSchoolYear,
    };
    vi.mocked(prisma.userYearProfile.upsert).mockResolvedValue(mockProfile);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      displayName: 'Test User',
      grade: 'JUNIOR',
      className: 'さくら組',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('user-1');
    expect(data.displayName).toBe('Test User');
    expect(data.profile.grade).toBe('JUNIOR');
    expect(data.profile.className).toBe('さくら組');
    expect(data.profile.schoolYear.name).toBe('2025年度');
  });

  it('should update existing user profile', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'LINE Name',
    });

    const mockSchoolYear = {
      id: 'year-1',
      name: '2025年度',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);

    const mockUser = {
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Old Name',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      displayName: 'New Name',
    });

    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      schoolYearId: 'year-1',
      grade: 'MIDDLE' as const,
      className: 'ひまわり組',
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYear: mockSchoolYear,
    };
    vi.mocked(prisma.userYearProfile.upsert).mockResolvedValue(mockProfile);

    const request = createMockPostRequest({
      idToken: 'valid-token',
      displayName: 'New Name',
      grade: 'MIDDLE',
      className: 'ひまわり組',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.displayName).toBe('New Name');
    expect(data.profile.grade).toBe('MIDDLE');
    expect(data.profile.className).toBe('ひまわり組');
  });
});

describe('GET /api/liff/profile', () => {
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
    expect(data.error).toBe('ユーザーが見つかりません');
  });

  it('should return profile null when no active school year', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });

    const mockUser = {
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(null);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('user-1');
    expect(data.profile).toBe(null);
  });

  it('should return user profile when exists', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });

    const mockUser = {
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const mockSchoolYear = {
      id: 'year-1',
      name: '2025年度',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(mockSchoolYear);

    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      schoolYearId: 'year-1',
      grade: 'JUNIOR' as const,
      className: 'さくら組',
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolYear: mockSchoolYear,
    };
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(mockProfile);

    const request = createMockGetRequest('valid-token');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('user-1');
    expect(data.displayName).toBe('Test User');
    expect(data.profile.grade).toBe('JUNIOR');
    expect(data.profile.className).toBe('さくら組');
    expect(data.profile.schoolYear.name).toBe('2025年度');
  });
});
