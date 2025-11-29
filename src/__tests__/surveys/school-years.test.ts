/**
 * Tests for school-years API route
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/school-years/route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    schoolYear: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('GET /api/school-years', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return school years list', async () => {
    const mockSchoolYears = [
      {
        id: 'year-1',
        name: '2025年度',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ];

    vi.mocked(prisma.schoolYear.findMany).mockResolvedValue(mockSchoolYears);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('year-1');
    expect(data[0].name).toBe('2025年度');
    expect(prisma.schoolYear.findMany).toHaveBeenCalledWith({
      orderBy: {
        startDate: 'desc',
      },
    });
  });

  it('should return 500 when database error occurs', async () => {
    vi.mocked(prisma.schoolYear.findMany).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('年度の取得に失敗しました');
  });
});
