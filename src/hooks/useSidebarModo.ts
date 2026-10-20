import { useCallback, useState } from 'react';

/** Mode of the side menu on desktop: `fijo` (260 px in the flow, the default) or `compacto` (a strip of icons). */
export type ModoSidebar = 'fijo' | 'compacto';

export const CLAVE_MODO_SIDEBAR = 'timtto.sidebar.modo';

/** Reads the remembered mode. An unknown value, or a storage that is not available, reads as `fijo`. */
const leerModo = (): ModoSidebar => {
  try {
    return window.localStorage.getItem(CLAVE_MODO_SIDEBAR) === 'compacto' ? 'compacto' : 'fijo';
  } catch {
    return 'fijo';
  }
};

const guardarModo = (modo: ModoSidebar): void => {
  try {
    window.localStorage.setItem(CLAVE_MODO_SIDEBAR, modo);
  } catch {
    // private window or blocked storage: the mode simply lives in memory for the session
  }
};

/**
 * State of the side menu (change: sidebar-compacto-colapsable).
 *  - `modo`: the user's choice, remembered in the browser.
 *  - `abierto`: transient, only meaningful in `compacto` (the floating panel is open). It is never stored and it
 *    closes whenever the mode changes.
 */
export const useSidebarModo = () => {
  const [modo, setModo] = useState<ModoSidebar>(leerModo);
  const [abierto, setAbierto] = useState(false);

  const alternar = useCallback(() => {
    setModo((actual) => {
      const siguiente: ModoSidebar = actual === 'fijo' ? 'compacto' : 'fijo';
      guardarModo(siguiente);
      return siguiente;
    });
    setAbierto(false);
  }, []);

  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const compacto = modo === 'compacto';
  return { modo, compacto, abierto: compacto && abierto, abrir, cerrar, alternar };
};

export default useSidebarModo;
