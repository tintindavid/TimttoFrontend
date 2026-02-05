/**
 * Utilidad de logging condicional
 * Solo imprime logs en modo desarrollo
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general - solo en desarrollo
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Error log - siempre se muestra pero se puede trackear en producción
   */
  error: (...args: any[]) => {
    console.error(...args);
    // TODO: Integrar con servicio de error tracking (e.g., Sentry)
    // if (!isDev) {
    //   Sentry.captureException(args);
    // }
  },

  /**
   * Warning log - solo en desarrollo
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Debug log - solo en desarrollo
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Info log - solo en desarrollo
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

export default logger;
