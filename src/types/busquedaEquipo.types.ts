/**
 * Global equipment search and consolidated summary (`/busqueda/equipos`).
 * Mirrors the API contract of the OpenSpec change `buscador-equipos`. Dates are ISO strings or null.
 */

export type CampoCoincidencia = 'serie' | 'inventario' | 'modelo' | 'marca' | 'invima';

export interface ClienteBusqueda {
  _id: string;
  nombre: string;
}

export interface EquipoEncontrado {
  _id: string;
  nombre: string;
  marca: string;
  modelo: string;
  serie: string;
  inventario: string;
  estadoOperativo: string;
  cliente: ClienteBusqueda | null;
  sede: string | null;
  servicio: string | null;
  coincidencia: { campo: CampoCoincidencia; valor: string };
}

export interface EquipoResumido {
  _id: string;
  nombre: string;
  marca: string;
  modelo: string;
  serie: string;
  inventario: string;
  invima: string;
  riesgo: string;
  ubicacion: string;
  estado: string;
  estadoOperativo: string;
  sede: string | null;
  servicio: string | null;
  mesesMtto: string[];
  ultimoMtto: string | null;
  proximoMtto: string | null;
  foto: string | null;
}

export interface HojaVidaResumen {
  disponible: boolean;
  existe: boolean;
  _id: string | null;
  estado: string | null;
}

export interface SeccionResumen<T> {
  disponible: boolean;
  total: number;
  recientes: T[];
}

export interface MantenimientoReciente {
  _id: string;
  consecutivo: string | null;
  estado: string | null;
  tipoMtto: string | null;
  fecha: string | null;
  ot: { _id: string; consecutivo: string | null } | null;
}

export interface ActividadExternaReciente {
  _id: string;
  tipo: string;
  consecutivo: string | null;
  fecha: string | null;
  proveedor: string | null;
  estadoFinal: string | null;
}

export interface TicketReciente {
  _id: string;
  consecutivo: string | null;
  status: string;
  urgency: string | null;
  fecha: string | null;
}

export interface RepuestoReciente {
  _id: string;
  nombre: string;
  cantidad: number | null;
  estado: string | null;
  fecha: string | null;
}

export interface ResumenEquipo {
  equipo: EquipoResumido;
  cliente: ClienteBusqueda | null;
  hojaVida: HojaVidaResumen;
  mantenimientos: SeccionResumen<MantenimientoReciente>;
  actividadesExternas: SeccionResumen<ActividadExternaReciente>;
  tickets: SeccionResumen<TicketReciente>;
  repuestos: SeccionResumen<RepuestoReciente>;
}
