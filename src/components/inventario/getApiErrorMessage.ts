interface ApiErrorLike {
  response?: { data?: { message?: string } };
  message?: string;
}

/** Spanish-friendly message from an axios error: backend message first, then the fallback. */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiErrorLike | undefined;
  return err?.response?.data?.message || fallback;
};
