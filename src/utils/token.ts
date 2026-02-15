/**
 * Utilidades para manejo de tokens JWT
 */

/**
 * Extrae el userId del payload del token JWT
 * @param token - Token JWT
 * @returns userId extraído del token, o null si falla
 */
export const getUserIdFromToken = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id || payload.sub;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};
