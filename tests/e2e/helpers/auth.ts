import { APIRequestContext, request as pwRequest, BrowserContext } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000/api/v1';
const EMAIL = process.env.PLAYWRIGHT_EMAIL || '';
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || '';
const TENANT_ID = process.env.PLAYWRIGHT_TENANT_ID || '';

export interface AuthSession {
  token: string;
  tenantId: string;
  userId?: string;
  api: APIRequestContext;
}

export async function login(): Promise<AuthSession> {
  if (!EMAIL || !PASSWORD || !TENANT_ID) {
    throw new Error(
      'Missing env vars. Set PLAYWRIGHT_EMAIL, PLAYWRIGHT_PASSWORD, PLAYWRIGHT_TENANT_ID before running.'
    );
  }
  const ctx = await pwRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { 'x-tenant-id': TENANT_ID },
  });
  const res = await ctx.post('/auth/login', {
    data: { email: EMAIL, password: PASSWORD, tenantId: TENANT_ID },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status()}): ${body}`);
  }
  const json = await res.json();
  const token = json?.data?.token || json?.token;
  if (!token) throw new Error(`Login response missing token. Body: ${JSON.stringify(json)}`);
  await ctx.dispose();

  const api = await pwRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': TENANT_ID,
    },
  });

  return { token, tenantId: TENANT_ID, userId: json?.data?.user?._id, api };
}

/**
 * Inject token + tenantId into localStorage on every page load so the React app
 * resumes an authenticated session without going through the login form.
 */
export async function attachAuthToBrowser(context: BrowserContext, session: AuthSession) {
  await context.addInitScript(
    ({ token, tenantId }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('tenantId', tenantId);
    },
    { token: session.token, tenantId: session.tenantId }
  );
}
