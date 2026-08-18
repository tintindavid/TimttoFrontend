import { SheetWork } from './reporte.types';

/** A single responsible user frozen into a `ScheduleEntry` (ot-responsables-programacion-trazable). */
export interface OtProgramacionResponsable {
  userId: string;
  /** Frozen at assignment time via `nameShort(user)` — does not track later name changes (design.md D8). */
  snapshotName: string;
}

/**
 * One entry of `OT.programaciones[]` — append-only, at most one entry has
 * `isActive: true` per OT. Reprogramming pushes a new entry and flips the
 * previous active one to `isActive: false` (never mutated otherwise).
 */
export interface OtProgramacionEntry {
  _id: string;
  fechaInicio: string;
  fechaFin: string;
  responsables: OtProgramacionResponsable[];
  isActive: boolean;
  /** `null` for entries created by the one-shot legacy migration. */
  createdBy: string | null;
  createdByName: string;
  createdAt: string;
}

export interface SetOtProgramacionDto {
  fechaInicio: string;
  fechaFin: string;
  responsableUserIds: string[];
}

export interface OT {
  Consecutivo?: string;
  numeroOT?: string; // For display purposes - could map to Consecutivo
  ClienteId?: {
    _id: string;
    nombre: string; // Fixed typo from Razonsocial
    Razonsocial: string;
    Ciudad: string;
    Departamento: string;
    Email: string;
    Nit: number;
    Direccion: string;
  };
  customerId: { // Alias for ClienteId
    _id: string;
    nombre: string;
  };
  EstadoOt?: string;
  FechaCreacion?: string;
  TipoServicio?: string;
  tipoMantenimiento?: string; // For compatibility
  Avance?: number | string;
  EstadoText?: string;
  reportes?: any[];
  hojasTrabajo?: SheetWork[]; // Worksheets
  OtPrioridad?: string;
  urgencia?: string; // Alias for OtPrioridad
  /** @deprecated Legacy singular responsable — preserved for backward-compat, not written by new code. Use `programaciones[]`. */
  ResponsableId?: string;
  /** Append-only programación history. Empty/undefined on legacy OTs (retro-compat permissive). */
  programaciones?: OtProgramacionEntry[];
  /** Computed per-request by the backend from the caller's userId vs. the active programación (design.md D5/D6). */
  canWork?: boolean;
  /** True when this OT was generated from one or more tickets. */
  isFromTicket?: boolean;
  /** Backwards-compat alias some endpoints use; treat both as equivalent. */
  fromTicket?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

export interface CreateOtDto {
  ClienteId: string;
  TipoServicio?: string;
  ResponsableId?: string;
  // otros campos según backend
}

export interface UpdateOtDto {
  EstadoOt?: string;
  Avance?: number;
  ResponsableId?: string;
}
