import { useEffect, useState } from 'react';

/** Bootstrap `lg` breakpoint: from here the side menu is part of the page; below it is an off-canvas drawer. */
export const CONSULTA_ESCRITORIO = '(min-width: 992px)';

const coincide = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(CONSULTA_ESCRITORIO).matches;
};

/** True on large screens. When `matchMedia` is not available (old browsers, jsdom) it assumes desktop. */
export const useEsEscritorio = (): boolean => {
  const [escritorio, setEscritorio] = useState<boolean>(coincide);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const consulta = window.matchMedia(CONSULTA_ESCRITORIO);
    const alCambiar = (e: MediaQueryListEvent) => setEscritorio(e.matches);
    setEscritorio(consulta.matches);
    consulta.addEventListener?.('change', alCambiar);
    return () => consulta.removeEventListener?.('change', alCambiar);
  }, []);

  return escritorio;
};

export default useEsEscritorio;
