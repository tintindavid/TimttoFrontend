export const DEMO_BLOCKED_TEXT = 'No disponible en cuentas de demostración';

/** Backend message of a demo restriction (DEMO_* error codes), otherwise `fallback`. */
export function getDemoErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; error?: { code?: string } } } })?.response?.data;
  return data?.error?.code?.startsWith('DEMO_') && data.message ? data.message : fallback;
}
