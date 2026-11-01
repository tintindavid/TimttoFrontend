import { toast } from 'react-toastify';
import type { RequisicionesDefaultsResult } from '@/types';

/** Spanish summary of what the default-data seeding created (null when nothing was created). */
export const formatRequisicionesDefaults = (r: Extract<RequisicionesDefaultsResult, { tipos: number }>): string | null => {
  const parts: string[] = [];
  if (r.tipos) parts.push(`${r.tipos} ${r.tipos === 1 ? 'tipo' : 'tipos'}`);
  if (r.areas) parts.push(`${r.areas} ${r.areas === 1 ? 'área' : 'áreas'}`);
  if (r.regla) parts.push(`${r.regla} ${r.regla === 1 ? 'regla' : 'reglas'}`);
  if (r.presupuesto) parts.push(`${r.presupuesto} ${r.presupuesto === 1 ? 'presupuesto' : 'presupuestos'}`);
  if (parts.length === 0) return null;
  const verb = parts.length === 1 && /^1 /.test(parts[0]) ? 'Se creó' : 'Se crearon';
  return `${verb} ${parts.join(', ')} por defecto para Requisiciones.`;
};

/** Toasts the seeding outcome of a tenant create / capabilities response; no-op when seeding was not attempted. */
export const notifyRequisicionesDefaults = (result?: RequisicionesDefaultsResult): void => {
  if (!result) return;
  if (result.error) {
    toast.warning(
      'No se pudieron crear los datos por defecto de Requisiciones. El cambio se guardó; ejecuta `npm run seed:requisiciones-defaults -- --tenant=<id>` para sembrarlos.'
    );
    return;
  }
  const message = formatRequisicionesDefaults(result);
  if (message) toast.info(message);
};
