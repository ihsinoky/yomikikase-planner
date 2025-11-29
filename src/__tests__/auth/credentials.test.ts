/**
 * Tests for authentication credentials validation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateCredentials } from '@/lib/auth/credentials';

describe('validateCredentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true for valid credentials', () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'secret123';

    expect(validateCredentials('admin', 'secret123')).toBe(true);
  });

  it('should return false for invalid username', () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'secret123';

    expect(validateCredentials('wronguser', 'secret123')).toBe(false);
  });

  it('should return false for invalid password', () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'secret123';

    expect(validateCredentials('admin', 'wrongpassword')).toBe(false);
  });

  it('should return false when both credentials are wrong', () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'secret123';

    expect(validateCredentials('wronguser', 'wrongpassword')).toBe(false);
  });

  it('should return false when env variables are not set', () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;

    expect(validateCredentials('admin', 'secret123')).toBe(false);
  });

  it('should return false when only username is set', () => {
    process.env.ADMIN_USERNAME = 'admin';
    delete process.env.ADMIN_PASSWORD;

    expect(validateCredentials('admin', 'secret123')).toBe(false);
  });

  it('should return false when only password is set', () => {
    delete process.env.ADMIN_USERNAME;
    process.env.ADMIN_PASSWORD = 'secret123';

    expect(validateCredentials('admin', 'secret123')).toBe(false);
  });

  it('should be case-sensitive for username', () => {
    process.env.ADMIN_USERNAME = 'Admin';
    process.env.ADMIN_PASSWORD = 'secret123';

    expect(validateCredentials('admin', 'secret123')).toBe(false);
    expect(validateCredentials('Admin', 'secret123')).toBe(true);
  });

  it('should be case-sensitive for password', () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'Secret123';

    expect(validateCredentials('admin', 'secret123')).toBe(false);
    expect(validateCredentials('admin', 'Secret123')).toBe(true);
  });
});
