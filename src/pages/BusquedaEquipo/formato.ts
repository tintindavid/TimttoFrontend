const MEDIANOCHE_UTC = /T00:00:00(\.000)?Z$/;

/** Short Spanish date. Date-only values (midnight UTC) are read in UTC so they do not move to the day before. */
export const formatearFecha = (iso: string | null | undefined, vacio = 'Sin fecha'): string => {
  if (!iso) return vacio;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return vacio;
  return fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(MEDIANOCHE_UTC.test(iso) && { timeZone: 'UTC' }),
  });
};

export const capitalizar = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);
