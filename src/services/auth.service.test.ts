/**
 * Unit tests for authService.refreshToken — E0 saas-security-baseline
 *
 * Verifies that the service correctly persists a new token returned by
 * POST /auth/refresh-token even after the backend fix that includes
 * tenantId in the JWT payload. The service must remain payload-agnostic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted ensures these refs exist before vi.mock factories run (module hoisting).
const { mockClientPost, mockAxiosInstance } = vi.hoisted(() => {
  const mockClientPost = vi.fn();
  const mockAxiosInstance = {
    post: mockClientPost,
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return { mockClientPost, mockAxiosInstance };
});

// Mock axios so that every axios.create() call returns the controlled mockAxiosInstance.
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    post: vi.fn(),
    get: vi.fn(),
  },
  // AxiosError must be constructible for the interceptor code in auth.service.ts
  AxiosError: class AxiosError extends Error {
    response?: unknown;
    config?: unknown;
    code?: string;
  },
}));

import { authService } from './auth.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal, structurally valid JWT string with the given payload.
 * The signature is a static placeholder — no real signing happens.
 * This is sufficient for testing the service's opaque token handling.
 */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: object): string =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url(payload);
  return `${header}.${body}.mocksignature`;
}

function mockRefreshResponse(token: string): void {
  mockClientPost.mockResolvedValueOnce({
    data: {
      success: true,
      message: 'Token refrescado correctamente',
      data: { token },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authService.refreshToken — E0 tenantId-in-payload compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists the new token to localStorage when the JWT payload contains tenantId', async () => {
    const tokenWithTenantId = makeJwt({ userId: 'user-1', role: 'admin', tenantId: 'acme' });
    mockRefreshResponse(tokenWithTenantId);

    const result = await authService.refreshToken('old-refresh-token');

    expect(result).toBe(tokenWithTenantId);
    expect(localStorage.getItem('token')).toBe(tokenWithTenantId);
  });

  it('does not decode or assert anything about the JWT payload — treats token as an opaque string', async () => {
    // A token whose payload differs from the previous (pre-fix) shape: now has tenantId
    const tokenWithTenantId = makeJwt({
      userId: 'user-2',
      role: 'technician',
      tenantId: 'tenant-xyz',
    });
    mockRefreshResponse(tokenWithTenantId);

    const result = await authService.refreshToken('another-refresh-token');

    // Service returns the raw token string — it must not parse or transform it
    expect(typeof result).toBe('string');
    expect(result).toBe(tokenWithTenantId);
  });

  it('calls POST /auth/refresh-token with the provided refresh token in the request body', async () => {
    const token = makeJwt({ userId: 'user-3', role: 'admin', tenantId: 'my-tenant' });
    mockRefreshResponse(token);
    const refreshTokenValue = 'my-stored-refresh-token';

    await authService.refreshToken(refreshTokenValue);

    expect(mockClientPost).toHaveBeenCalledOnce();
    expect(mockClientPost).toHaveBeenCalledWith('/auth/refresh-token', {
      token: refreshTokenValue,
    });
  });

  it('AuthContext consumer can read the persisted token from localStorage after a successful refresh', async () => {
    // This test simulates what AuthContext.init() does:
    // after authService.refreshToken resolves, it reads localStorage to get the new token.
    const tokenWithTenantId = makeJwt({
      userId: 'user-4',
      role: 'admin',
      tenantId: 'my-tenant',
    });
    mockRefreshResponse(tokenWithTenantId);

    await authService.refreshToken('refresh-token-abc');

    // AuthContext reads from localStorage after the service call
    const storedToken = localStorage.getItem('token');
    expect(storedToken).not.toBeNull();
    expect(storedToken).toBe(tokenWithTenantId);
  });

  it('overwrites any previously stored token in localStorage with the refreshed token', async () => {
    const oldToken = makeJwt({ userId: 'user-5', role: 'admin' }); // pre-fix: no tenantId
    localStorage.setItem('token', oldToken);

    const newToken = makeJwt({ userId: 'user-5', role: 'admin', tenantId: 'acme' }); // post-fix
    mockRefreshResponse(newToken);

    await authService.refreshToken('refresh-token-xyz');

    expect(localStorage.getItem('token')).toBe(newToken);
    expect(localStorage.getItem('token')).not.toBe(oldToken);
  });
});
