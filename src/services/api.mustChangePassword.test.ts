import { describe, it, expect } from 'vitest';
import { shouldRedirectToChangePassword, CHANGE_PASSWORD_PATH } from '@/services/api';

const mustChange = { response: { status: 428, data: { error: { code: 'MUST_CHANGE_PASSWORD' } } } } as never;

describe('shouldRedirectToChangePassword', () => {
  it('redirects a 428 MUST_CHANGE_PASSWORD from any other page', () => {
    expect(shouldRedirectToChangePassword(mustChange, '/')).toBe(true);
    expect(shouldRedirectToChangePassword(mustChange, '/terceros')).toBe(true);
  });

  it('never redirects when the user is already on the change-password page (reload loop guard)', () => {
    expect(shouldRedirectToChangePassword(mustChange, CHANGE_PASSWORD_PATH)).toBe(false);
  });

  it('ignores other status codes and other 428 codes', () => {
    expect(shouldRedirectToChangePassword({ response: { status: 401, data: { error: { code: 'INVALID_TOKEN' } } } } as never, '/')).toBe(false);
    expect(shouldRedirectToChangePassword({ response: { status: 428, data: { error: { code: 'OTHER' } } } } as never, '/')).toBe(false);
    expect(shouldRedirectToChangePassword({} as never, '/')).toBe(false);
  });
});
