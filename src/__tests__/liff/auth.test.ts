/**
 * Tests for LIFF authentication API
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/liff/auth/route';

// Mock the dependencies
vi.mock('@/lib/liff', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    userYearProfile: {
      findUnique: vi.fn(),
    },
  },
}));

import { verifyIdToken } from '@/lib/liff';
import { prisma } from '@/lib/prisma';

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/liff/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/liff/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when idToken is missing', async () => {
    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('IDトークンが必要です');
  });

  it('should return 401 when token verification fails', async () => {
    vi.mocked(verifyIdToken).mockRejectedValue(new Error('Invalid token'));

    const request = createMockRequest({ idToken: 'invalid-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('認証に失敗しました');
  });

  it('should create new user when user does not exist', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
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
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(null);

    const request = createMockRequest({ idToken: 'valid-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('user-1');
    expect(data.displayName).toBe('Test User');
    expect(data.isNewUser).toBe(true);
    expect(data.hasCurrentYearProfile).toBe(false);
    expect(data.activeSchoolYearId).toBe('year-1');
  });

  it('should return existing user when user already exists', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });

    const mockUser = {
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Existing User',
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
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(null);

    const request = createMockRequest({ idToken: 'valid-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('user-1');
    expect(data.displayName).toBe('Existing User');
    expect(data.isNewUser).toBe(false);
    expect(data.hasCurrentYearProfile).toBe(false);
  });

  it('should return hasCurrentYearProfile true when profile exists', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });

    const mockUser = {
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Existing User',
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
    };
    vi.mocked(prisma.userYearProfile.findUnique).mockResolvedValue(mockProfile);

    const request = createMockRequest({ idToken: 'valid-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasCurrentYearProfile).toBe(true);
  });

  it('should return null activeSchoolYearId when no active school year', async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      lineUserId: 'U123456',
      displayName: 'Test User',
    });

    const mockUser = {
      id: 'user-1',
      lineUserId: 'U123456',
      displayName: 'Existing User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.schoolYear.findFirst).mockResolvedValue(null);

    const request = createMockRequest({ idToken: 'valid-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasCurrentYearProfile).toBe(false);
    expect(data.activeSchoolYearId).toBe(null);
  });
});
